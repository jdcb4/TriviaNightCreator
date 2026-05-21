# Agent Instructions — TriviaNightCreator

This file holds the rules an agent must obey **on every turn**. Detailed reference material lives in `docs/AGENT_REFERENCE.md` — load it on demand, not by default.

## Project shape

- Preset: `full-stack-react-hono`
- Product: no-account trivia night builder and host tool for in-person corporate, fundraiser, school, and social events.
- Core stack: TypeScript strict, pnpm, React, Hono, PostgreSQL, Drizzle, Zod, Tailwind, ESLint + Prettier, Vitest + RTL.
- Runtime targets: React web frontend, Hono API, PostgreSQL database, PDF generation service, deployed on Railway.
- Auth: do **not** implement full account auth in the MVP. Use private edit/presentation access tokens only. Accounts are roadmap unless the user explicitly moves them into active work.
- Persistence default: PostgreSQL + Drizzle. This project is intentionally relational because trivia nights, rounds, teams, scores, tokens, and printable output state need relational queries.
- Print output: answer sheets and marking guides are core MVP features and should be generated as reliable A4 PDFs.

## First-step orientation

Before making changes:

1. Read this file.
2. Read `docs/PROJECT_INDEX.md`.
3. Read `docs/SPECS.md` for product requirements when product behaviour is relevant.
4. Read any docs relevant to the files being changed.
5. Inspect `package.json` scripts before inventing commands.
6. Prefer existing patterns over new abstractions.

If docs are missing, stale, or inconsistent with the code, fix them as part of the change.

## Hard rules

1. **No account auth unless explicitly requested.** The MVP uses private edit and presentation tokens. If a task seems to require user accounts, document the need and ask before implementing.
2. **Do not confuse access tokens with auth.** Edit links and presentation links are access-control mechanisms for no-account use. They must remain separate.
3. **Do not expose answers to presentation views before reveal.** Answer visibility must be enforced by API/data selectors, not just hidden with CSS.
4. **No new top-level dependency or framework** without a `docs/DECISIONS.md` entry recording why.
5. **No major persistence/schema change** without a `docs/DECISIONS.md` entry and migration strategy.
6. **Run deterministic checks before claiming a task is complete.** See `docs/VERIFICATION.md`. Never claim a check passed when it did not.
7. **Bump the version on every behaviour-affecting change** per `docs/VERSIONING.md`, and update `docs/CHANGELOG.md`. If the change is version-neutral, say so explicitly in the commit message.
8. **Do not implement roadmap items unless the user moves them into active work.** Out-of-scope ideas go into `docs/ROADMAP.md`.
9. **Do not commit secrets, generated PDFs, build output, `node_modules`, or local env files.** See `.gitignore` and `SECURITY.md`.
10. **Do not weaken or skip tests to make them pass.** Fix the underlying issue.
11. **Local dev is Windows PowerShell.** When giving or running local commands, use PowerShell syntax. CI and Docker can use Linux bash. See `docs/AGENT_REFERENCE.md`.
12. **Use design tokens, not raw Tailwind style classes.** Visual style — colour, font size, font weight, tracking, radii — flows through `src/styles/tokens.css` and reusable primitives. Layout utilities are fine. See `docs/DESIGN_TOKENS.md`.

## Product rules agents must preserve

- Teams answer on paper.
- Presentation mode is optional, not required.
- The default trivia night is 3 rounds of 20 empty question slots.
- Empty question slots are shown in the UI but only non-empty questions are persisted.
- Normal question rounds use exactly one of two answer sheet layouts:
  - 10-question A4 portrait
  - 20-question A4 landscape, 2 columns of 10
- Changing layout/question count must be explicit.
- Special rounds have no answer sheet in the MVP.
- Answer sheets are generated per round, not per team, and include a team-name space.
- Marking guides are generated per round.
- Decorative black-and-white cartoons on answer sheets are reusable decoration assets, not question content.
- Score entry is per round. Unmarked is distinct from zero.
- Scores above calculated max should warn and allow explicit override.
- Tiebreakers resolve tied ranking only and do not add points.
- Recent round leaderboard and overall leaderboard are both required.

## Deterministic checks before commit

```bash
pnpm run typecheck
pnpm test
pnpm run lint
pnpm run build
```

Prefer the combined gate if present:

```bash
pnpm run verify
```

For significant implementation changes, also run Fallow and consider its feedback:

```bash
pnpm dlx fallow --no-cache --format human
```

`docs/VERIFICATION.md` lists extra checks for database, API, PDF, Docker, and deploy changes.

## Documentation and human-facing artifacts

- Documentation that is likely to be read by an agent, or that is central to ongoing maintenance, should remain in Markdown.
  - Examples: `AGENTS.md`, `docs/SPECS.md`, architecture notes, implementation plans, repo conventions, changelogs, and decision records.
- Human-facing artifacts, especially temporary or review-oriented artifacts, should usually be created as HTML.
  - Examples: UX proposals, app flow outlines, feature walkthroughs, visual explanations, prototypes, and approach summaries.
  - Use HTML interactivity where useful, such as collapsible sections, embedded images, diagrams, lightweight prototypes, or simple navigation.
  - Keep these artifacts useful and readable without making them unnecessarily complex.

## UX-first implementation

- Prioritise UX before substantial implementation work.
- For substantial features, present UX options or a lightweight UX outline before committing to implementation.
- Include screens, user flows, interaction states, and trade-offs where appropriate.
- Do not jump straight into major implementation unless the UX direction is already clear or approved.

## Documentation map

- `docs/SPECS.md` — product and MVP specification.
- `docs/PROJECT_INDEX.md` — entry point: folders, commands, key docs.
- `docs/ARCHITECTURE.md` — module boundaries and runtime shape.
- `docs/VERIFICATION.md` — required checks.
- `docs/VERSIONING.md` — version rules.
- `docs/DECISIONS.md` — durable decisions.
- `docs/ROADMAP.md` — future ideas only.
- `docs/CHANGELOG.md` — notable changes by version.
- `docs/DEPLOYMENT.md` — deploy instructions.
- `docs/AGENT_REFERENCE.md` — detailed agent reference.
- `docs/DESIGN_TOKENS.md` — colour, type, and layout token system.

## When blocked

If a task cannot be completed cleanly:

1. Make the smallest safe improvement available.
2. Document what remains blocked and why.
3. Include exact commands run and exact failures.
4. Do not claim checks passed unless they were run successfully.
