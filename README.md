# Jewelry ERP

Enterprise Jewelry ERP — desktop application. This is the **Phase 1 skeleton**:
the full stack wired end to end with authentication and a rate-master vertical
slice. Domain modules are layered on in later phases.

> Lives alongside the legacy `../backend` (Laravel) and `../frontend` apps, which
> are untouched. This `erp/` monorepo is the new stack.

## Stack

| Layer      | Tech                                                                                  |
| ---------- | ------------------------------------------------------------------------------------- |
| Desktop    | Electron, React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, Zustand, TanStack Query, React Hook Form, Zod |
| Backend    | NestJS, Node.js 22, Prisma ORM, PostgreSQL 17                                          |
| Reports    | PDFKit, ExcelJS, Electron native printing, bwip-js (planned)                           |
| Deployment | electron-builder, Windows installer, local PostgreSQL with backup/restore (planned)    |

## Layout

```
erp/
├── packages/
│   └── shared/        # Zod schemas + types shared by API and desktop
└── apps/
    ├── api/           # NestJS + Prisma backend
    └── desktop/       # Electron + React client
```

## Prerequisites

- Node.js 22 LTS, pnpm 10
- PostgreSQL 17 running locally

## Getting started

```bash
pnpm install

# Backend: configure DB + run migrations + seed an admin user
cp .env.example apps/api/.env        # then edit DATABASE_URL etc.
pnpm db:generate
pnpm db:migrate
pnpm db:seed                         # creates admin@jewelry.local / admin123

# Run
pnpm dev:api                         # NestJS on http://localhost:3000/api
pnpm dev:desktop                     # Electron + Vite renderer
```

## Useful scripts

| Command             | What it does                                    |
| ------------------- | ----------------------------------------------- |
| `pnpm build`        | Builds shared → api → desktop                   |
| `pnpm typecheck`    | Type-checks every package                       |
| `pnpm db:migrate`   | Runs Prisma migrations (dev)                    |
| `pnpm db:seed`      | Seeds the admin user + sample rates             |

## Phase 1 scope (this skeleton)

- JWT auth (login, `GET /auth/me`), bcrypt password hashing, seeded admin
- Rate Master: create/list daily metal rates (Gold/Silver/Platinum + purity)
- Electron shell, hash-router, protected routes, auth persistence
- shadcn/ui component base, Tailwind theming

## Roadmap (next phases)

1. **Inventory-by-weight** — items, stock lots (weight + piece), purity/hallmarking
2. **Customers & billing** — invoices, making charges, wastage %, GST, old-gold exchange
3. **Reports & printing** — PDF invoices, Excel exports, barcode/QR labels, native printing
4. **Operations** — karigar (artisan) job-work, schemes/chit funds, multi-branch stock transfer
5. **Deployment** — signed Windows installer, automated local Postgres backup/restore
