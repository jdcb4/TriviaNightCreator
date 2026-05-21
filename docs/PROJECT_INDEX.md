# Project Index — TriviaNightCreator

The first stop for navigating this project.

## What this project is

TriviaNightCreator is a full-stack TypeScript app for building and hosting in-person trivia nights for corporate, school, fundraiser, community, and social events.

The MVP helps a host create a private trivia night, organise rounds and questions, generate reliable A4 PDF answer sheets and per-round marking guides, optionally present questions and answers on screen, enter per-round scores, and show recent-round and overall leaderboards.

Teams answer on paper. The app does not require team devices. Full user accounts are roadmap; the MVP uses private edit and presentation access links.

## Important folders

The exact structure may evolve, but use these boundaries unless a decision record changes them.

- `apps/web` — React frontend and presentation UI.
- `apps/api` — Hono API server.
- `packages/domain` — framework-independent trivia-night rules, score calculation, leaderboard logic, round/question constraints, and print-layout domain rules.
- `packages/db` — Drizzle schema, migrations, database client, repository modules.
- `packages/shared` — shared Zod schemas, TypeScript types, constants, and API contracts.
- `packages/pdf` — PDF template rendering helpers for answer sheets and marking guides.
- `src/components/ui` or `apps/web/src/components/ui` — token-driven reusable visual primitives.
- `src/styles` or `apps/web/src/styles` — semantic design tokens and global CSS.
- `docs` — durable project documentation and human-facing UX artifacts.
- `scripts` — deterministic project utility scripts.
- `assets/decorations` — reusable black-and-white decorative cartoon assets for answer sheets, if stored locally.

## Commands

Check `package.json` before relying on these. Keep this table current as scripts change.

| Command | Purpose |
| --- | --- |
| `pnpm install` | Install dependencies. |
| `pnpm run dev` | Start local development services. |
| `pnpm run dev:web` | Start the React frontend, if split scripts exist. |
| `pnpm run dev:api` | Start the Hono API, if split scripts exist. |
| `pnpm run db:generate` | Generate Drizzle migrations from schema changes. |
| `pnpm run db:migrate` | Apply database migrations. |
| `pnpm run db:studio` | Open Drizzle Studio, if configured. |
| `pnpm run typecheck` | TypeScript checking. |
| `pnpm run lint` | ESLint. |
| `pnpm test` | Vitest once. |
| `pnpm run test:watch` | Vitest in watch mode. |
| `pnpm run build` | Production build. |
| `pnpm run verify` | Typecheck + lint + test + build commit gate. |
| `pnpm dlx fallow --no-cache --format human` | Dead-code, complexity, and duplication scan. |

## Key docs

- [`AGENTS.md`](../AGENTS.md) — every-turn agent ruleset.
- [`docs/SPECS.md`](SPECS.md) — product and MVP specification.
- [`docs/AGENT_REFERENCE.md`](AGENT_REFERENCE.md) — detailed agent reference.
- [`docs/DESIGN_TOKENS.md`](DESIGN_TOKENS.md) — colour, type, and layout token system.
- [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) — module boundaries and runtime shape.
- [`docs/VERIFICATION.md`](VERIFICATION.md) — required checks before commit.
- [`docs/VERSIONING.md`](VERSIONING.md) — version rules.
- [`docs/DECISIONS.md`](DECISIONS.md) — durable decisions.
- [`docs/ROADMAP.md`](ROADMAP.md) — future ideas only, not active work.
- [`docs/CHANGELOG.md`](CHANGELOG.md) — notable changes by version.
- [`docs/DEPLOYMENT.md`](DEPLOYMENT.md) — deploy instructions.
- [`SECURITY.md`](../SECURITY.md) — security rules, if present.

## Product reference

For product behaviour, prefer `docs/SPECS.md` over guessing.

Critical MVP assumptions:

- Default quiz: 3 rounds of 20 empty question slots.
- Answer sheets: one per round, A4 PDF, either 10 portrait or 20 landscape.
- Marking guides: one per round.
- Access: no account required, private edit link, separate presentation link.
- Presentation: optional, single-device, no realtime sync required for MVP.
- Scoring: per-round, unmarked distinct from zero, above-max warning with override.
- Special rounds: no MVP answer sheet; custom handouts are roadmap.
