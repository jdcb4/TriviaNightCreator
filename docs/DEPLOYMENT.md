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

Recommended Railway services:

1. Web/API service
   - runs the Hono API and serves the built frontend, or deploys alongside a static frontend depending on implementation
2. PostgreSQL service
   - stores trivia nights, rounds, questions, teams, scores, access tokens, and print metadata
3. Scheduled archive job
   - archives trivia nights inactive for the configured retention period
4. PDF renderer dependency
   - ensure Playwright/Chromium or the chosen PDF renderer works in the deployment image

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
