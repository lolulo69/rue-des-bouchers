# Deploy (Proxmox CT 105)

Pull-based: a systemd timer in the container runs `deploy.sh` every 2 minutes. When `origin/main`
moved, it runs `npm ci && npm run build` and publishes `dist/` as
`/var/www/rue-des-bouchers/releases/<sha>`, then atomically repoints `current`, which nginx serves on port 8090.

- Container: CT 105 `rue-des-bouchers`, 10.10.10.132, repo cloned in `/opt/rue-des-bouchers`, runs as user `rdb`.
- LAN: http://192.168.1.163:8090 (DNAT on the host, `/etc/network/interfaces.d/rue-des-bouchers`).
- One-time setup: `pct exec 105 -- bash /opt/rue-des-bouchers/deploy/setup.sh` (after cloning), see `setup.sh`.
- The timer runs `/usr/local/bin/rdb-deploy.sh`, a copy of `deploy.sh` installed by `setup.sh` (the checkout may be reset to an older green commit). After editing `deploy.sh`: `pct exec 105 -- install -m 755 /opt/rue-des-bouchers/deploy/deploy.sh /usr/local/bin/rdb-deploy.sh`.
- Only the newest `main` commit with a green CI run is published (`DEPLOY_ANY=1` to override).
- Logs: `pct exec 105 -- journalctl -u rue-des-bouchers-deploy -n 50`.
- Force a rebuild: `pct exec 105 -- runuser -u rdb -- env FORCE=1 /opt/rue-des-bouchers/deploy/deploy.sh`.
- `host-dnat.interfaces` is the host-side port forward (copy of `/etc/network/interfaces.d/rue-des-bouchers`).
