# myClawTeam

Monorepo for the myClawTeam image gallery workflow.

## Workspaces

- `apps/web`: React, Vite, Tailwind, and TypeScript frontend.
- `apps/api`: Node.js, Express, and TypeScript backend.
- `packages/shared`: Shared TypeScript contracts and constants.

## Commands

```bash
npm install
npm run build
npm run lint
npm run db:generate
npm run db:migrate
npm run dev:api
npm run dev:web
```

The API defaults to `0.0.0.0:8080`. The frontend dev server runs with Vite and proxies
API requests to the backend.

Database migrations live in `apps/api/prisma/migrations` and are applied with Prisma
against the PostgreSQL database configured by `DATABASE_URL`.

Object Storage is configured through the vendor-neutral `OBJECT_STORAGE_*` variables in
`.env.example`. Storage helpers accept relative object keys and prepend the configured
prefix before every S3 operation.

The upload API accepts one or more image files at `POST /api/uploads` as
`multipart/form-data`, stores each object under the configured prefix, and records metadata
in PostgreSQL.

## Environment

Copy `.env.example` for local development and provide real values through the environment.
The API validates required configuration at startup and fails fast when PostgreSQL or Object
Storage settings are missing.
