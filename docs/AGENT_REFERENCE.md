# Agent Reference

Detailed reference for AI agents working in TriviaNightCreator. Load on demand — not on every turn. The short every-turn ruleset is in `AGENTS.md`.

## Toolchain defaults

- **TypeScript** strict mode, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`. Path alias should be consistent, usually `@/*`.
- **Package manager** pnpm 9+. Do not switch to npm or yarn without a `docs/DECISIONS.md` entry.
- **Frontend** React with a router chosen by the implementation plan.
- **API** Hono.
- **Database** PostgreSQL + Drizzle.
- **Validation** Zod everywhere external input lands.
- **Styling** Tailwind CSS + token-driven local primitives.
- **PDF** server-side generation for A4 answer sheets and marking guides.
- **Lint/format** ESLint flat config + Prettier.
- **Test** Vitest + React Testing Library. Use `jsdom` for component tests and `node` for domain/server tests.
- **Code quality** Fallow for dead code, duplication, and complexity. Knip / ts-prune / jscpd as on-demand investigations.
- **Deps** Renovate or Dependabot may be introduced later. Keep dependencies current after CI passes.

## Modularity rules

- Domain code is framework-independent. No React, Hono, DB, filesystem, or browser imports.
- UI components do not own persistence or network calls.
- API routes validate requests and delegate to services/domain modules.
- IO sits behind service/repository modules so it can be mocked in tests.
- Feature orchestration is separate from pure domain rules.
- Inject time, randomness, IDs, and external services for deterministic tests.
- PDF renderers receive explicit template data and do not query the database directly.

## Product invariants

Protect these invariants unless `docs/SPECS.md` changes:

- No account auth in MVP.
- Private edit access and presentation access are separate.
- Presentation routes must not expose unrevealed answers.
- Teams answer on paper.
- Presentation mode is optional.
- Default quiz is 3 rounds of 20 empty slots.
- Only non-empty questions are saved.
- Missing slots are skipped but numbering is preserved.
- Question rounds use explicit 10 portrait or 20 landscape answer sheet layouts.
- Special rounds have no answer sheet in MVP.
- Answer sheets are per round, not per team.
- Marking guides are per round.
- Decorative cartoons are reusable decorations, not question content.
- Unmarked score is distinct from zero.
- Above-max score warns and allows explicit override.
- Tiebreakers do not alter point totals.

## Reducing duplication

Before adding new code:

1. Search for existing functions, hooks, components, schemas, constants, and types that already solve part of the problem.
2. Prefer extending an existing module over creating a parallel implementation.
3. Extract shared logic only after at least two real call sites exist, unless the boundary is already obvious.
4. Keep shared utilities small and dependency-light.
5. Avoid catch-all `utils` files that mix unrelated concerns.

Duplication policy:

- Domain rules have one canonical implementation.
- Validation schemas are reused by UI, API, tests, and persistence where practical.
- Constants and defaults live in named config modules, not inline across screens.
- Test helpers do not reimplement production logic in a way that can mask bugs.

## Deterministic codebase analysis

```bash
pnpm dlx fallow --no-cache --format human
pnpm dlx ts-prune
pnpm dlx knip
pnpm dlx jscpd .
pnpm ls --depth=0
pnpm dlx ast-grep --pattern 'PATTERN' src
```

Do not blindly follow these tools. False positives are common for framework entrypoints, plugin-loaded files, generated files, and runtime-only dependencies. Document false positives near the relevant config.

## Persistence and schema changes

When changing persisted data, database schema, local storage, or public data formats:

1. Document current and new schema.
2. Add or update migration logic.
3. Add tests for old data loading into the new version where applicable.
4. Increment `MAJOR` if old data cannot be migrated.
5. Update `docs/ARCHITECTURE.md`, `docs/VERSIONING.md`, and `docs/CHANGELOG.md` where needed.
6. Add a `docs/DECISIONS.md` entry for significant persistence decisions.

## Drizzle guidance

- Keep schema definitions close to related persistence modules.
- Use explicit indexes for common lookup paths:
  - trivia night by id
  - rounds by trivia night/order
  - questions by round/order
  - teams by trivia night/order
  - scores by round/team
  - access tokens by hash/access type
- Use JSONB for type-specific configs where it avoids premature over-normalisation.
- Validate JSONB content with Zod at boundaries.
- Migrations must be inspected before commit.

## Access and security

- Store access token hashes, not raw tokens.
- Use separate token scopes for edit and present.
- Do not log raw access tokens.
- Do not put tokens in generated PDFs.
- Do not let presentation access hit editor endpoints.
- Treat answer visibility as a data-access rule, not a UI-only rule.
- Keep environment secrets out of source control.

## PDF/print guidance

MVP PDFs:

- 10-question portrait answer sheet
- 20-question landscape answer sheet
- per-round marking guide

Rules:

- A4 output must be reliable.
- Branding appears on every sheet.
- Decorative assets are automatically placed.
- Decoration choices should be persisted after first generation.
- Generated PDFs should not be committed unless intentionally used as fixtures.
- If Playwright or a similar browser renderer is used, ensure it works in deployment.

## Dependency policy

Before adding a dependency:

1. Check whether the platform or existing dependencies already solve the problem.
2. Prefer small, well-maintained packages with TypeScript support.
3. Avoid dependencies for trivial helpers.
4. Document meaningful new dependencies in `docs/DECISIONS.md`.
5. Run dependency checks after installation.

PDF, database, validation, and routing dependencies are meaningful and should be recorded if not already present.

## Git hygiene

Do not commit:

- `node_modules`
- build output
- generated PDFs
- local database files
- coverage output
- `.env` or `.env.local`
- signing credentials
- API keys
- tokens
- secrets
- editor caches
- OS metadata

Before committing:

```bash
git status --short
git diff --check
git diff --stat
```

## Working on Windows (PowerShell)

The user's local dev environment is Windows with PowerShell. CI and Docker run Linux bash, so commands inside Dockerfiles, workflows, and package scripts can use bash where appropriate.

Rules for interactive local commands:

- No `&&` or `||` chains for PowerShell 5.1 compatibility.
- Env vars are `$env:NAME`.
- Line continuation is backtick.
- Use `$null`, not `/dev/null`.
- Prefer `Remove-Item -Recurse -Force`, not `rm -rf`.
- `mkdir` works for simple directory creation.
- Quote paths with spaces.

### Cross-shell command equivalents

| Task | Bash | PowerShell |
| --- | --- | --- |
| Sequence | `A; B` | `A; B` |
| Conditional | `A && B` | `A; if ($?) { B }` |
| Set env var inline | `FOO=bar pnpm dev` | `$env:FOO="bar"; pnpm dev` |
| Multi-line | `cmd \` | `cmd ``` |
| Make dir | `mkdir -p path/to/dir` | `mkdir path/to/dir` |
| Remove dir | `rm -rf dir` | `Remove-Item -Recurse -Force dir` |
| Suppress output | `cmd > /dev/null 2>&1` | `cmd > $null 2> $null` |

## When documenting commands

- For commands that run in CI/Docker, bash syntax is fine and should be labelled as `bash`.
- For commands the user runs locally, prefer shell-neutral single-line commands.
- When shell-neutral is not possible, provide PowerShell commands.

## When blocked

1. Make the smallest safe improvement available.
2. Document what remains blocked and why.
3. Include exact commands run and exact failures.
4. Do not claim checks passed unless they were run successfully.
