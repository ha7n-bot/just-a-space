# Deployment and recovery

## Runtime

Use a continuously running Linux container or VM, Node 24 LTS and a durable local filesystem supporting SQLite locking. Provision one application instance per database volume. Staging and production each need a separate filesystem, origin and credentials. GitHub Pages alone cannot run the CMS. Require sign-in at the staging gateway before exposing the review URL. Robots directives are advisory.

## Local validation

From the repository root, use the tracked lockfile.

~~~sh
npm ci --ignore-scripts
npm run lint
npm run build
npm test
node --env-file=.env.example server.mjs
~~~

Open http://localhost:3000/ar and /en, /ar/menu, /en/menu and /admin. For the browser suite and measured coverage consult QA_TEST_PLAN.md and QA_RESULTS.md. Runtime serves server-rendered HTML.

## Container staging

1. Build from the audited commit. Record the commit and image digest. Docker uses the Node 24 Bookworm slim image. Pin the registry digest reviewed by operations in the actual release and refresh after security updates.
2. Mount a dedicated volume at /var/lib/just-a-space. The container runs under the Node user, UID 1000. For a bind mount prepare ownership and 0700 permissions before startup.
3. Put TLS termination and authenticated staging access in front of the loopback upstream. Bypass shared caches for the admin area, authenticated traffic and responses carrying cookies. Configure timeouts, request-size limits and log minimization at the gateway.
4. Inject SITE_ORIGIN as the exact externally visible origin. Keep PUBLIC_LAUNCH=0 for review deployments. This example binds only on loopback. Set the real HTTPS origin behind the TLS gateway.

~~~sh
docker build --pull -t just-a-space:review .
docker volume create just-a-space-review
docker run --name just-a-space-review --restart unless-stopped -d \
  -p 127.0.0.1:3000:3000 -v just-a-space-review:/var/lib/just-a-space \
  -e SITE_ORIGIN=http://localhost:3000 -e PUBLIC_LAUNCH=0 just-a-space:review
~~~

| Setting | Purpose |
| --- | --- |
| SITE_ORIGIN | Canonical origin without a trailing path. HTTP only for loopback. Supply HTTPS on hosted environments |
| DB_PATH | Absolute volume path recommended. Local default var/cafe.sqlite. Container default /var/lib/just-a-space/cafe.sqlite |
| PORT | HTTP port behind TLS proxy. Example 3000 |
| PUBLIC_LAUNCH | Keep 0 through audit. Set 1 with final HTTPS origin after owner sign-off and release checks |

The application applies its checked-in migration when opening SQLite. Inspect cms/001.sql each release. Back up before starting code with database changes. Check schema compatibility before switching an existing database to an older release.

## Owner bootstrap

Run once against a new persistent database. Choose a lowercase username and a passphrase from the owner's password manager. The following Bash command reads the passphrase without echo and sends it on stdin.

~~~bash
read -r -s -p 'New owner passphrase: ' cafe_owner_pass
printf '\n'
printf '%s\n' "$cafe_owner_pass" | docker exec -i just-a-space-review node cms/owner.mjs cafeowner
unset cafe_owner_pass
~~~

For a local installation, replace the Docker invocation with node --env-file=.env.example cms/owner.mjs cafeowner. Confirm role controls on separate viewer and manager accounts. The bootstrap CLI refuses to overwrite an existing owner. Give each staff member a named account. Keep a recovery owner under business control.

## Backup, restore and rollback

Use ops/snapshot.mjs with the live database. It uses SQLite's online backup API, strips sessions and login-attempt counters from the copy, then runs integrity and foreign-key checks. The destination must be new. Snapshots include user password hashes, audit history and any media stored in SQLite. Store encrypted copies in an owner-controlled backup service, restricting access and defining retention. Keep the deployment commit, host configuration and original approved artwork separately. [SQLite backup API](https://nodejs.org/api/sqlite.html)

~~~sh
# On the service host, using an actual timestamp and a fresh destination
node ops/snapshot.mjs /var/lib/just-a-space/cafe.sqlite /secure-backups/cafe-YYYYMMDD-HHMM.sqlite

# Recovery drill on a new private volume
node ops/snapshot.mjs /secure-backups/cafe-YYYYMMDD-HHMM.sqlite /recovery/cafe.sqlite
~~~

Schedule a daily off-host encrypted copy and a pre-release copy. Alert on failures, stale snapshots and low disk capacity. For a recovery drill, start the matching image with DB_PATH=/recovery/cafe.sqlite on an isolated host. Verify both locales, log in again and inspect published records, audit history and media. Record the tested restore duration and data age.

For recovery, pause writes, preserve the existing database and all SQLite sidecars, and point the replacement at the separate restored volume. Obtain authority before cutover that could discard newer writes. For a code-only defect, roll back the immutable image when schema compatibility allows. Reconcile intervening writes before reverting database state.

## CI and launch gates

.github/workflows/checks.yml runs on pushes, pull requests and manual dispatch with read-only repository permissions. It validates the lockfile, runs lint/build/tests, audits application dependencies and builds an image. Configure required checks and protected environments in the owner's GitHub account. Public deployment requires separate authorization.

Confirm the base image, patch level, administrator list, backup recovery, DNS and TLS. QA_RESULTS.md and FINAL_AUDIT.md describe tests still to be run. Verify final content, robots behavior, canonical origin, both locale routes and mobile/keyboard access on the deployed host. Monitor aggregate HTTP 5xx rate, latency, certificate expiry, disk free space and backup freshness. Restrict proxy logs and configure justified retention. Monitoring alerts, DNS, host provisioning and off-host backup destinations depend on the chosen owner's hosting account.
