#!/usr/bin/env bash
# Pull-based deploy: fetch origin/main; if it changed (or nothing is published yet),
# npm ci + npm run build, then publish dist/ as a new release behind the "current" symlink.
# Run by rue-des-bouchers-deploy.timer every 2 minutes. FORCE=1 rebuilds even without changes.
set -euo pipefail

REPO_DIR="${REPO_DIR:-/opt/rue-des-bouchers}"
WEB_DIR="${WEB_DIR:-/var/www/rue-des-bouchers}"
BRANCH="${BRANCH:-main}"
KEEP=3

# Everything lives in main(): bash parses the whole function before running it, so the
# git reset below can safely rewrite this very file.
main() {
  exec 9>"$WEB_DIR/.deploy.lock"
  flock -n 9 || { echo "deploy already running"; exit 0; }

  cd "$REPO_DIR"
  git fetch --quiet origin "$BRANCH"
  local target deployed
  target=$(git rev-parse "origin/$BRANCH")
  deployed=$(basename "$(readlink -f "$WEB_DIR/current" 2>/dev/null || echo none)")
  if [[ "$deployed" == "$target" && "${FORCE:-0}" != 1 ]]; then
    exit 0
  fi

  echo "deploying $target (was $deployed)"
  git reset --quiet --hard "$target"
  npm ci --no-audit --no-fund --loglevel=error
  npm run build

  local rel="$WEB_DIR/releases/$target"
  rm -rf "$rel"
  mkdir -p "$WEB_DIR/releases"
  cp -a dist "$rel"
  ln -sfn "$rel" "$WEB_DIR/current.tmp"
  mv -T "$WEB_DIR/current.tmp" "$WEB_DIR/current"

  # Garde les KEEP dernières releases
  ls -1dt "$WEB_DIR"/releases/*/ | tail -n +$((KEEP + 1)) | xargs -r rm -rf
  echo "deployed $target"
}

main "$@"
exit 0
