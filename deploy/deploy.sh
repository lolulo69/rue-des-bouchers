#!/usr/bin/env bash
# Pull-based deploy: publish the tip of origin/main right away (CI runs in parallel) and roll back to the newest green commit if the tip's CI fails; if it changed (or nothing is published yet),
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
  # Deploy first, verify in parallel: publish the tip of $BRANCH unless its CI run FAILED; if it failed, roll back to the
  # newest commit with a green CI run. A run still in progress (or superseded/cancelled) does not block the deploy.
  # DEPLOY_ANY=1: always the tip. GREEN_ONLY=1: only green commits (the stricter mode).
  local api="https://api.github.com/repos/${GH_REPO:-lolulo69/rue-des-bouchers}/actions/workflows/ci.yml/runs"
  local tip; tip=$(git rev-parse "origin/$BRANCH")
  if [[ "${DEPLOY_ANY:-0}" == 1 ]]; then
    target=$tip
  else
    local tipstate=""
    [[ "${GREEN_ONLY:-0}" == 1 ]] || tipstate=$(curl -fsS --max-time 20 -H "Accept: application/vnd.github+json" "$api?head_sha=$tip&per_page=5" \
      | tr -d ' \n' | grep -o '"conclusion":"[a-z_]*"\|"conclusion":null' | head -n1) || true
    if [[ "${GREEN_ONLY:-0}" != 1 && "$tipstate" != '"conclusion":"failure"' ]]; then
      target=$tip
    else
      target=$(curl -fsS --max-time 20 -H "Accept: application/vnd.github+json" "$api?branch=$BRANCH&status=success&event=push&per_page=1" \
        | sed -n 's/.*"head_sha": *"\([0-9a-f]\{40\}\)".*/\1/p' | head -n1) || true
      [[ -n "$target" ]] && echo "tip $tip failed CI: rolling back to the newest green commit $target"
    fi
    if [[ -z "$target" ]]; then echo "no deployable commit found (API down?): keeping the current release"; exit 0; fi
    git cat-file -e "$target^{commit}" 2>/dev/null || git fetch --quiet origin "$target" || { echo "commit $target not fetchable"; exit 0; }
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
