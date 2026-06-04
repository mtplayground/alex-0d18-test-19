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
npm start
npm run lint
npm run deploy:verify
npm run db:generate
npm run db:migrate
npm run dev:api
npm run dev:web
```

The API defaults to `0.0.0.0:8080`. The frontend dev server runs with Vite and proxies
API requests to the backend.

In production, `npm run build` compiles both the API and the frontend. `npm start` runs the
compiled API process, which serves the built frontend from `apps/web/dist` and the API from
the same `0.0.0.0:8080` listener.

Database migrations live in `apps/api/prisma/migrations` and are applied with Prisma
against the PostgreSQL database configured by `DATABASE_URL`.

Object Storage is configured through the vendor-neutral `OBJECT_STORAGE_*` variables in
`.env.example`. Storage helpers accept relative object keys and prepend the configured
prefix before every S3 operation.

The upload API accepts one or more image files at `POST /api/uploads` as
`multipart/form-data`, stores each object under the configured prefix, and records metadata
in PostgreSQL.

Image metadata is available at `GET /api/images`, newest first. Each image includes a
binary route at `GET /api/images/:id/content`.

Selected images can be streamed as a zip archive with `POST /api/downloads/zip` and a JSON
body containing `imageIds`.

## Environment

Copy `.env.example` for local development and provide real values through the environment.
The API validates required configuration at startup and fails fast when PostgreSQL or Object
Storage settings are missing.

Required runtime variables:

- `HOST`: bind address. Use `0.0.0.0` for self-hosted containers or VMs.
- `PORT`: listener port. The default and expected production port is `8080`.
- `NODE_ENV`: use `production` for a production process.
- `DATABASE_URL`: PostgreSQL connection URL.
- `OBJECT_STORAGE_ACCESS_KEY_ID`: S3-compatible access key.
- `OBJECT_STORAGE_SECRET_ACCESS_KEY`: S3-compatible secret key.
- `OBJECT_STORAGE_BUCKET`: S3-compatible bucket name.
- `OBJECT_STORAGE_PREFIX`: required object-key prefix, including the trailing `/`.
- `OBJECT_STORAGE_ENDPOINT`: S3-compatible endpoint URL.
- `OBJECT_STORAGE_REGION`: S3-compatible region, usually `auto` for Tigris.
- `OBJECT_STORAGE_FORCE_PATH_STYLE`: `true` or `false`.

## Bare Self-Hosted Run

These steps run myClawTeam as a single Node.js process that serves the compiled React app
and the Express API on port `8080`.

1. Install Node.js 20 or newer and provide access to PostgreSQL plus an S3-compatible
   object storage bucket.
2. Install dependencies:

   ```bash
   npm ci
   ```

3. Provide the runtime environment. For example:

   ```bash
   cp .env.example .env.production
   # Edit .env.production with real PostgreSQL and Object Storage values.
   set -a
   . ./.env.production
   set +a
   ```

4. Generate Prisma client code and apply migrations:

   ```bash
   npm run db:generate
   npm run db:migrate
   ```

5. Verify the production build:

   ```bash
   npm run deploy:verify
   ```

6. Start the production server:

   ```bash
   npm start
   ```

7. Check the running process:

   ```bash
   curl http://127.0.0.1:8080/health
   ```

For uploaded files, keep `OBJECT_STORAGE_PREFIX` exactly aligned with the storage IAM policy.
The application stores relative keys in PostgreSQL and prepends `OBJECT_STORAGE_PREFIX` for
every S3 get, put, and delete operation.
