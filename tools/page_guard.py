#!/usr/bin/env python3
"""page_guard.py - missing-element guard for static HTML pages.

Compares the key-element inventory of every HTML page between a "before"
commit (what the remote already has) and an "after" commit (what is being
pushed) and fails if anything disappeared, unless the removal is allowed on
purpose in .page-guard-allow (see below).

Inventory per page (multiset, so losing one of two identical buttons counts):
  id:<id>                      every element id
  landmark:<tag>               header nav main footer aside form dialog, section#id
  role:<role>[#id]             any explicit role="..."
  button:<id|aria-label|text>  <button>, input[type=button|submit|reset]
  nav:<href>                   links inside <nav>
  guard:<name>                 data-guard="name" markers
  h1:/h2:<text>                top-level headings
  script:<src> / style:<href>  includes (query strings like ?v=3 ignored)
  page                         the page file itself (lost when the file is deleted)

Usage:
  page_guard.py hook <remote-name> <remote-url>     (git pre-push; refs on stdin)
  page_guard.py check [BEFORE] [AFTER]              (default origin/main vs HEAD; AFTER may be WORKTREE)
  page_guard.py inventory [REV] [--json FILE]       (dump inventory, e.g. baseline)

Allowing a removal on purpose: add a line to .page-guard-allow (repo root) in
the same push:
  <path>                  allow any removal on that page (or deleting it)
  <path> :: <item>        allow just that item, e.g.  moderation/index.html :: button:Ask Dad
Only lines that are NEW in the pushed range count, so an old line never
silently approves a later removal. Lines starting with # are comments.
Emergency bypass: git push --no-verify (don't make a habit of it).
"""
import json, os, re, subprocess, sys
from collections import Counter
from html.parser import HTMLParser

ZERO = "0" * 40
ALLOW_FILE = ".page-guard-allow"
LANDMARKS = {"header", "nav", "main", "footer", "aside", "form", "dialog"}
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link",
        "meta", "param", "source", "track", "wbr"}


def git(*args, check=True):
    r = subprocess.run(["git", *args], capture_output=True)
    if check and r.returncode:
        raise RuntimeError(r.stderr.decode(errors="replace").strip())
    return r.stdout.decode("utf-8", errors="replace") if r.returncode == 0 else None


def short(rev):
    return rev[:10] if len(rev) == 40 else rev


def strip_q(u):
    return u.split("?", 1)[0].split("#", 1)[0].strip()


def norm(t, drop_numbers=False):
    if drop_numbers:   # live counters like "Pending 3" must not look like a removal
        t = re.sub(r"\b\d+\b", " ", t)
    return " ".join(t.split())[:80]


class Inv(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.items = Counter({"page": 1})
        self.stack = []          # open tags
        self.capture = None      # [kind, attrs, textparts, depth]
        self.nav_depth = 0

    def handle_starttag(self, tag, attrs):
        a = {k: (v or "") for k, v in attrs}
        i = a.get("id", "").strip()
        sfx = f"#{i}" if i else ""
        if i:
            self.items[f"id:{i}"] += 1
        if tag in LANDMARKS:          # by tag only: adding an id later is not a removal
            self.items[f"landmark:{tag}"] += 1
        elif tag == "section" and i:
            self.items[f"landmark:section#{i}"] += 1
        if a.get("role"):
            self.items[f"role:{a['role'].strip()}{sfx}"] += 1
        if a.get("data-guard"):
            self.items[f"guard:{a['data-guard'].strip()}"] += 1
        if tag == "script" and a.get("src"):
            self.items[f"script:{strip_q(a['src'])}"] += 1
        if tag == "link" and "stylesheet" in a.get("rel", "").lower() and a.get("href"):
            self.items[f"style:{strip_q(a['href'])}"] += 1
        if tag == "input" and a.get("type", "").lower() in ("button", "submit", "reset"):
            self.items["button:" + (i or a.get("aria-label") or a.get("value") or a.get("name") or "?")] += 1
        if tag == "nav":
            self.nav_depth += 1
        if tag == "a" and self.nav_depth and a.get("href"):
            self.items[f"nav:{strip_q(a['href']) or a['href']}"] += 1
        if self.capture is None and tag in ("button", "h1", "h2"):
            self.capture = [tag, a, [], len(self.stack)]
        if tag not in VOID:
            self.stack.append(tag)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID and self.stack and self.stack[-1] == tag:
            self.stack.pop()

    def handle_data(self, d):
        if self.capture is not None:
            self.capture[2].append(d)

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if tag in self.stack:
            while self.stack:
                t = self.stack.pop()
                if t == "nav":
                    self.nav_depth = max(0, self.nav_depth - 1)
                if t == tag:
                    break
        c = self.capture
        if c is not None and len(self.stack) <= c[3]:
            kind, a = c[0], c[1]
            txt = norm("".join(c[2]), drop_numbers=(kind == "button"))
            if kind == "button":
                key = a.get("id") or a.get("aria-label") or txt or a.get("title") or "?"
                self.items[f"button:{norm(key)}"] += 1
            elif txt:
                self.items[f"{kind}:{txt}"] += 1
            self.capture = None


def inventory_of(text):
    p = Inv()
    try:
        p.feed(text)
        p.close()
    except Exception:
        pass
    return p.items


def is_page(path):
    return path.lower().endswith((".html", ".htm"))


def read_blob(rev, path):
    if rev == "WORKTREE":
        try:
            with open(path, encoding="utf-8", errors="replace") as f:
                return f.read()
        except FileNotFoundError:
            return None
    return git("show", f"{rev}:{path}", check=False)


def list_pages(rev):
    if rev == "WORKTREE":
        out = git("ls-files", "-co", "--exclude-standard")
    else:
        out = git("ls-tree", "-r", "--name-only", rev)
    return sorted(p for p in (out or "").splitlines() if is_page(p))


def changed_pages(before, after):
    args = ["diff", "--name-status", "--no-renames", before]
    if after != "WORKTREE":
        args.append(after)
    out = git(*args)
    res = []
    for line in out.splitlines():
        st, _, path = line.partition("\t")
        if is_page(path) and st[0] in "MD":   # added pages can't lose anything
            res.append(path)
    return res


def allow_entries(rev):
    txt = read_blob(rev, ALLOW_FILE) or ""
    out = set()
    for line in txt.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "::" in line:
            p, _, item = line.partition("::")
            out.add((p.strip(), item.strip()))
        else:
            out.add((line.split()[0], "*"))
    return out


def check(before, after, label=""):
    pages = changed_pages(before, after)
    new_allow = allow_entries(after) - allow_entries(before)
    problems, allowed = {}, []
    for path in pages:
        b = inventory_of(read_blob(before, path) or "")
        at = read_blob(after, path)
        a = inventory_of(at) if at is not None else Counter()
        lost = b - a
        if at is None and not ((path, "*") in new_allow or (path, "page") in new_allow):
            problems[path] = [f"page  (whole page deleted, {sum(b.values())} elements)"]
            continue
        for item, n in sorted(lost.items()):
            if (path, "*") in new_allow or (path, item) in new_allow:
                allowed.append(f"{path} :: {item}")
            else:
                problems.setdefault(path, []).append(f"{item}" + (f"  (x{n})" if n > 1 else ""))
    per = Counter(x.split(" :: ")[0] for x in allowed)
    for path, n in per.items():
        items = [x.split(" :: ", 1)[1] for x in allowed if x.startswith(path + " :: ")]
        shown = ", ".join(items[:4]) + (f", +{n - 4} more" if n > 4 else "")
        print(f"page-guard: allowed removal on {path} ({shown})", file=sys.stderr)
    if problems:
        n = sum(len(v) for v in problems.values())
        print(f"\npage-guard: BLOCKED{label} - {n} key element(s) would disappear "
              f"(before {short(before)} -> after {short(after)}):", file=sys.stderr)
        for path, items in problems.items():
            print(f"  {path}", file=sys.stderr)
            for it in items:
                print(f"      - {it}", file=sys.stderr)
        print("\nIf this is on purpose, add lines like these to .page-guard-allow in a commit"
              " in this push, then push again:", file=sys.stderr)
        hints = [f"  {path}" if it.startswith("page  (") else f"  {path} :: {it.split('  (x')[0]}"
                 for path, items in problems.items() for it in items]
        for h in hints[:10]:
            print(h, file=sys.stderr)
        if len(hints) > 10:
            print(f"  ... and {len(hints) - 10} more (same pattern)", file=sys.stderr)
        print("  (or just '<path>' to allow every removal on that page)\n", file=sys.stderr)
        return 1
    print(f"page-guard: OK{label} - {len(pages)} changed page(s) checked, nothing missing.", file=sys.stderr)
    return 0


def resolve_before(local_sha, remote_sha, remote, remote_ref):
    if remote_sha != ZERO and git("cat-file", "-e", f"{remote_sha}^{{commit}}", check=False) is not None:
        return remote_sha
    # new branch, or remote tip unknown locally: compare against main's merge-base
    for cand in (f"{remote}/{remote_ref.rsplit('/', 1)[-1]}", f"{remote}/main", "origin/main"):
        mb = git("merge-base", local_sha, cand, check=False)
        if mb:
            return mb.strip()
    return None


def hook(argv):
    remote = argv[0] if argv else "origin"
    rc = 0
    for line in sys.stdin.read().splitlines():
        parts = line.split()
        if len(parts) != 4:
            continue
        local_ref, local_sha, remote_ref, remote_sha = parts
        if local_sha == ZERO:          # deleting a remote branch
            continue
        before = resolve_before(local_sha, remote_sha, remote, remote_ref)
        if not before:
            print(f"page-guard: no base found for {remote_ref}; skipping", file=sys.stderr)
            continue
        rc |= check(before, local_sha, f" [{remote_ref.replace('refs/heads/', '')}]")
    return rc


def dump(rev, out=None):
    data = {"rev": git("rev-parse", rev).strip() if rev != "WORKTREE" else "WORKTREE", "pages": {}}
    for p in list_pages(rev):
        data["pages"][p] = dict(sorted(inventory_of(read_blob(rev, p) or "").items()))
    s = json.dumps(data, indent=1, ensure_ascii=False, sort_keys=False)
    if out:
        with open(out, "w", encoding="utf-8") as f:
            f.write(s + "\n")
        n = sum(sum(v.values()) for v in data["pages"].values())
        print(f"page-guard: wrote {out} ({len(data['pages'])} pages, {n} items) from {data['rev'][:10]}")
    else:
        print(s)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    cmd, rest = sys.argv[1], sys.argv[2:]
    os.chdir(git("rev-parse", "--show-toplevel").strip())
    if cmd == "hook":
        return hook(rest)
    if cmd == "check":
        before = rest[0] if len(rest) > 0 else "origin/main"
        after = rest[1] if len(rest) > 1 else "HEAD"
        return check(before, after)
    if cmd == "inventory":
        rev = rest[0] if rest and not rest[0].startswith("--") else "HEAD"
        out = rest[rest.index("--json") + 1] if "--json" in rest else None
        dump(rev, out)
        return 0
    print(__doc__)
    return 2


if __name__ == "__main__":
    sys.exit(main())
