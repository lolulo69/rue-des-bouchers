#!/usr/bin/env bash
# One-time setup inside CT 105 (as root). Idempotent.
set -euo pipefail
REPO_URL=https://github.com/lolulo69/rue-des-bouchers.git

id rdb >/dev/null 2>&1 || useradd --system --create-home --home-dir /home/rdb --shell /usr/sbin/nologin rdb
[[ -d /opt/rue-des-bouchers/.git ]] || git clone "$REPO_URL" /opt/rue-des-bouchers
install -d -o rdb -g rdb /var/www/rue-des-bouchers
chown -R rdb:rdb /opt/rue-des-bouchers

cd /opt/rue-des-bouchers/deploy
install -m 644 nginx.conf /etc/nginx/sites-available/rue-des-bouchers
ln -sfn /etc/nginx/sites-available/rue-des-bouchers /etc/nginx/sites-enabled/rue-des-bouchers
rm -f /etc/nginx/sites-enabled/default
# The timer runs a copy outside the repo: deploy.sh resets the checkout to the newest green commit, which could be older
# than the script itself. Re-run this setup (or this install line) after changing deploy.sh.
install -m 755 deploy.sh /usr/local/bin/rdb-deploy.sh
install -m 644 rue-des-bouchers-deploy.service rue-des-bouchers-deploy.timer /etc/systemd/system/
systemctl daemon-reload

systemctl start rue-des-bouchers-deploy.service   # first build
nginx -t && systemctl reload nginx
systemctl enable --now rue-des-bouchers-deploy.timer
