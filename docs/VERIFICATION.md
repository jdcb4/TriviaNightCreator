# Verification

Run these deterministic checks before claiming implementation work is complete:

```bash
pnpm run typecheck
pnpm test
pnpm run lint
pnpm run build
```

The combined gate should be exposed as:

```bash
pnpm run verify
```

For significant implementation changes, run Fallow and consider its feedback before final verification:

```bash
pnpm dlx fallow --no-cache --format human
```

If Fallow is unavailable, record that it was skipped and perform a local code-quality review before running deterministic checks.

## Database checks

For changes affecting Drizzle schema or migrations:

```bash
pnpm run db:generate
pnpm run db:migrate
```

If a migration is generated, inspect it before committing.

Add or update tests for:

- old data loading into the new shape, where applicable
- repository behaviour
- constraints that affect product behaviour

## API checks

For Hono API changes, verify:

- request validation rejects invalid input
- access-token rules are enforced
- presentation routes do not expose unrevealed answers
- editor-only routes reject presenter access
- errors are structured and safe

## PDF/print checks

For answer sheet or marking guide changes:

- generate a sample 10-question portrait answer sheet
- generate a sample 20-question landscape answer sheet
- generate a sample marking guide
- visually inspect A4 layout
- check that branding appears on every page
- check that decorative assets are deterministic after first generation
- check that missing slots are skipped where required

Do not commit generated PDFs unless explicitly required as fixtures.

## Presentation checks

For presentation changes, verify:

- question view does not show answers
- recap view does not show answers
- answer walkthrough requires deliberate reveal
- answer recap shows answers only when intended
- full-screen audience mode hides host controls
- multiple-choice options are shown in question views

## Optional deeper checks

When investigating dead code, duplication, or unused dependencies:

```bash
pnpm dlx ts-prune
pnpm dlx knip
pnpm dlx jscpd .
```

These may report false positives for framework entrypoints, plugin-loaded files, generated files, and runtime-only dependencies. Document false positives near the relevant config or in this file.

## Environment

Use Node.js 22 LTS if configured in `.nvmrc`, and pnpm 9+ unless the project explicitly changes versions.
