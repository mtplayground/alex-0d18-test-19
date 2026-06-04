# myClawTeam Product Contract

myClawTeam is a self-hostable image gallery app for uploading, browsing, selecting, and downloading image sets. It is implemented as a TypeScript monorepo with a React frontend, an Express API, shared contracts, PostgreSQL metadata storage, and S3-compatible object storage for image binaries.

## Current Capabilities

- Upload one or many image files through a drag-and-drop/file-picker UI.
- Validate uploads for supported image types (`JPG`, `PNG`, `GIF`, `WebP`) and a 10 MB per-file size limit.
- Store uploaded image binaries in S3-compatible object storage and image metadata in PostgreSQL.
- List image metadata newest-first and render a responsive thumbnail gallery.
- Select thumbnails individually, select all, clear selection, and download selected images as a streamed zip archive.
- Show clear user-facing errors for invalid file types, size limits, empty zip selections, missing metadata, and missing storage objects.
- Run Playwright E2E coverage for upload, display, selection, zip download, and key validation/error cases.

## Architecture

- `apps/web`: React + Vite + Tailwind frontend.
- `apps/api`: Node.js + Express API compiled to `dist/server.js`.
- `packages/shared`: shared TypeScript constants and API response/request contracts.
- `apps/api/prisma`: Prisma schema and migrations for PostgreSQL.
- Production build serves the compiled React app from `apps/web/dist` through the Express API on `0.0.0.0:8080`.

## Data And Storage

- PostgreSQL is the only persistent metadata store.
- Prisma manages the `images` table with: `id`, `filename`, `storage_key`, `content_type`, `size`, and `uploaded_at`.
- User-uploaded binaries are never stored in PostgreSQL or local disk; they live in S3-compatible object storage.
- The app uses the vendor-neutral `OBJECT_STORAGE_*` env scheme.
- `OBJECT_STORAGE_PREFIX` is mandatory, must end with `/`, and is prepended to every object key used for S3 get/put/delete operations.
- Stored database keys are relative keys under purpose-based paths such as `uploads/YYYY/MM/DD/...`.

## Runtime And Deployment

- Required runtime config is documented in `.env.example`.
- The API fails fast when required PostgreSQL or object storage env vars are missing or malformed.
- `npm run db:generate` generates Prisma client code.
- `npm run db:migrate` applies PostgreSQL migrations.
- `npm run build` builds shared, API, and frontend workspaces.
- `npm run deploy:verify` runs format check, lint, and production build.
- `npm start` runs the compiled production server.

## Conventions

- Keep API and frontend contracts in `packages/shared` when data crosses the client/server boundary.
- Keep object storage calls behind the storage helper so prefix handling remains centralized.
- Do not introduce alternate storage env names; use `OBJECT_STORAGE_*`.
- Do not add non-PostgreSQL persistence for user state or metadata.
