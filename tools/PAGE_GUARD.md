# Page guard (missing-element pre-push check)

Every `git push` from this repo or any of its worktrees runs `tools/page_guard.py`
via the shared pre-push hook. For each HTML page changed in the push it compares the
key-element inventory (ids, landmarks, roles, buttons, nav links, `data-guard` markers,
h1/h2, script and stylesheet includes) of the remote tip (before) with the commit being
pushed (after). If anything disappeared, the push is blocked with a list.

- Install / refresh the hook (once per clone, covers all worktrees): `bash tools/install_page_guard.sh`
- Check by hand: `python3 tools/page_guard.py check origin/main HEAD` (or `WORKTREE` for uncommitted edits)
- Baseline snapshot: `tools/page_inventory_baseline.json` (regenerate with
  `python3 tools/page_guard.py inventory origin/main --json tools/page_inventory_baseline.json`)
- Protect something that has no id: add `data-guard="name"` to it.

## Removing something on purpose
Add a line to `.page-guard-allow` (repo root) in a commit in the same push:

    moderation/index.html :: button:lock     # just that item
    articles/old-page.html                   # any removal on that page, or deleting it

Only lines new in the pushed range count, so an old line never approves a later removal.
`git push --no-verify` skips the check; use only in an emergency.
