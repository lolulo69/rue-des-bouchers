#!/usr/bin/env bash
# Pull-based deploy: publish the newest origin/main commit that passed CI; if it changed (or nothing is published yet),
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
  # Only publish what CI proved: the newest commit on $BRANCH whose « CI » workflow run succeeded.
  # DEPLOY_ANY=1 restores the old behaviour (deploy the tip of $BRANCH whatever CI says).
  if [[ "${DEPLOY_ANY:-0}" == 1 ]]; then
    target=$(git rev-parse "origin/$BRANCH")
  else
    target=$(curl -fsS --max-time 20 -H "Accept: application/vnd.github+json" \
      "https://api.github.com/repos/${GH_REPO:-lolulo69/rue-des-bouchers}/actions/workflows/ci.yml/runs?branch=$BRANCH&status=success&event=push&per_page=1" \
      | sed -n 's/.*"head_sha": *"\([0-9a-f]\{40\}\)".*/\1/p' | head -n1) || true
    if [[ -z "$target" ]]; then echo "no green CI run found (API down?): keeping the current release"; exit 0; fi
    git cat-file -e "$target^{commit}" 2>/dev/null || git fetch --quiet origin "$target" || { echo "green commit $target not fetchable"; exit 0; }
  fi
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
