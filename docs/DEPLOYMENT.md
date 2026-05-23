# Deployment — TriviaNightCreator

TriviaNightCreator is a full-stack app with:

- React web frontend
- Hono API
- PostgreSQL database
- server-side PDF generation
- scheduled archive job

The intended hosting target is Railway.

## Local development

Typical local development command:

```powershell
pnpm run dev
```

If split scripts exist:

```powershell
pnpm run dev:web
pnpm run dev:api
```

## Required environment variables

Names may change as implementation evolves, but expected categories are:

```env
DATABASE_URL=
APP_BASE_URL=
EDIT_TOKEN_SECRET=
PRESENT_TOKEN_SECRET=
PDF_RENDERER_MODE=
ARCHIVE_JOB_ENABLED=true
ARCHIVE_JOB_CRON=0 3 * * 0
TRIVIA_NIGHT_ARCHIVE_AFTER_DAYS=365
```

Do not commit `.env` files.

## Database setup

Generate and apply migrations using the project scripts.

```powershell
pnpm run db:generate
pnpm run db:migrate
```

Inspect generated migrations before committing them.

## Local production preview

```powershell
pnpm run build
pnpm run preview
```

If the API and web builds are separate, use the project-specific preview scripts listed in `package.json`.

## Railway deployment

TriviaNightCreator is configured as a **Unified Docker Monolith** for Railway, running both the React web frontend and Hono API server inside a single container instance to minimize active resource costs and completely eliminate CORS constraints.

### 1. Deployment Architecture
* **Frontend SPA Build**: Compiled via Vite during Docker's first build stage (`pnpm --filter @trivia/web build`).
* **Hono API Server**: Compiled in the second Docker stage, running on Node inside Microsoft's official pre-tested Playwright container image (`mcr.microsoft.com/playwright`).
* **Static Assets Serving**: Hono's `serveStatic` middleware serves the built frontend SPA from `apps/api/dist/web` on non-API routes `/` with fallback SPA client-side routing.
* **Port Binding**: Hono automatically binds to the dynamically assigned `$PORT` environment variable supplied by Railway, defaulting to `3001` locally.

### 2. Required Railway Services
1. **Unified Monolith Service**: 
   - Configured in the root [railway.json](file:///C:/CodingProjects/TriviaNightCreator/railway.json).
   - Automatically builds using the root [Dockerfile](file:///C:/CodingProjects/TriviaNightCreator/Dockerfile) via the DOCKER builder.
   - Monitors active startup health via `/api/health`.
2. **PostgreSQL Database Service**:
   - Spin up a managed PostgreSQL database in the same Railway project dashboard.
   - Automatically injects the private `DATABASE_URL` credentials connection string.
3. **Scheduled Archive Job (Cron)**:
   - Run in-process in the Node API container or scheduled via a dedicated Railway serverless runner pointing to the archive script.

## Archive job

Archive inactive trivia nights weekly by default.

Suggested config:

```env
ARCHIVE_JOB_ENABLED=true
ARCHIVE_JOB_CRON=0 3 * * 0
TRIVIA_NIGHT_ARCHIVE_AFTER_DAYS=365
```

Archived quizzes should not be restorable by private edit link in the MVP.

## Verification before deploy

```powershell
pnpm run verify
```

For deployment-affecting changes, also verify:

- migrations apply cleanly
- API starts successfully
- PDF generation works in the deployment-like environment
- archive job can run safely
- presentation routes do not expose unrevealed answers
- secrets are supplied through Railway variables, not committed files

## Generated files

Do not commit generated PDFs, build output, local database files, or environment files unless they are explicit test fixtures and documented as such.
