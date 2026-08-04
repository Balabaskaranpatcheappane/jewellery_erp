# Deployment (Windows)

This is a **local, offline-first desktop deployment**: the Electron app talks to
a NestJS API on `localhost:3000`, which uses a local PostgreSQL 17 database.

## Prerequisites on the target machine

- **PostgreSQL 17** installed and running. The installer's `bin` directory
  (containing `pg_dump` / `pg_restore`) must be on the system `PATH` — the
  backup/restore feature shells out to them.
- **Node.js 22 LTS** (only needed to run the API; see topology note below).

## 1. Configure

```
copy .env.example apps\api\.env
```
Edit `apps\api\.env`:
- `DATABASE_URL` — real PostgreSQL user/password/port
- `JWT_SECRET` — a long random string
- `BACKUP_DIR` — optional; where `.dump` backups are written (default `./backups`)

## 2. Database

```
pnpm install
pnpm db:migrate      # create/upgrade schema
pnpm db:seed         # first-run admin user + sample rates
```

## 3. Build the Windows installer

```
pnpm package:desktop
```
electron-builder (config in `apps/desktop/electron-builder.yml`) produces an
**NSIS installer (.exe)** in `apps/desktop/release/`. It allows choosing the
install directory and creates a desktop shortcut.

## Production topology

The desktop installer packages the **renderer + Electron shell only**. The
NestJS API and PostgreSQL run as local services the app connects to. Recommended
setup on a shop PC:

1. **PostgreSQL 17** — installed as a Windows service (default).
2. **API** — run `pnpm --filter @erp/api start:prod` (after `pnpm build`) via a
   process manager so it starts on boot. Options:
   - [NSSM](https://nssm.cc/) to register `node apps/api/dist/main.js` as a
     Windows service, or
   - Windows Task Scheduler "At startup".
3. **Desktop app** — the installed EXE; it loads `http://localhost:3000/api`.

> Bundling the API + Postgres into a single one-click installer is a future
> enhancement. The current split keeps the database independently
> backup-able and upgradeable.

## Backup & restore

In the app: **Settings → Backups** (admin only).
- **Backup now** runs `pg_dump -Fc` into `BACKUP_DIR` on the API host.
- **Restore** runs `pg_restore --clean --if-exists` from a chosen `.dump`.

For unattended nightly backups, schedule the same `pg_dump` command via Windows
Task Scheduler, writing into `BACKUP_DIR`; those files show up in the app's list
automatically.
