#!/usr/bin/env bash
# Installs the page-guard pre-push hook for this repo and ALL its worktrees.
# Worktrees share the common .git, so one hook covers them all. The guard
# script is copied into <common-git-dir>/page-guard/ so branches/worktrees
# that predate tools/page_guard.py are still protected. Re-run after editing
# tools/page_guard.py to refresh the copy.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
COMMON="$(cd "$(git rev-parse --git-common-dir)" && pwd)"
HOOKS_PATH="$(git config --get core.hooksPath || true)"
if [ -n "$HOOKS_PATH" ]; then
  case "$HOOKS_PATH" in /*) HOOKDIR="$HOOKS_PATH";; *) HOOKDIR="$PWD/$HOOKS_PATH";; esac
  echo "note: core.hooksPath is set; installing into $HOOKDIR"
else
  HOOKDIR="$COMMON/hooks"
fi
mkdir -p "$HOOKDIR" "$COMMON/page-guard"
cp tools/page_guard.py "$COMMON/page-guard/page_guard.py"
HOOK="$HOOKDIR/pre-push"
if [ -f "$HOOK" ] && ! grep -q 'page-guard' "$HOOK"; then
  mv "$HOOK" "$HOOKDIR/pre-push.local"
  echo "kept existing pre-push as pre-push.local (it still runs first)"
fi
cat > "$HOOK" <<'HOOK'
#!/usr/bin/env bash
# page-guard pre-push hook (installed by tools/install_page_guard.sh)
input="$(cat)"
here="$(dirname "$0")"
if [ -x "$here/pre-push.local" ]; then
  printf '%s\n' "$input" | "$here/pre-push.local" "$@" || exit $?
fi
COMMON="$(cd "$(git rev-parse --git-common-dir)" && pwd)"
printf '%s\n' "$input" | python3 "$COMMON/page-guard/page_guard.py" hook "$@"
HOOK
chmod +x "$HOOK"
echo "page-guard installed: $HOOK"
git worktree list | sed 's/^/  covers: /'
