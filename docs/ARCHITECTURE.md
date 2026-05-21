# Architecture — TriviaNightCreator

## Runtime shape

TriviaNightCreator is a full-stack TypeScript app:

- React frontend for builder, print centre, scoring, and presentation mode.
- Hono API for trivia-night CRUD, access-token validation, scoring, presentation-safe data, and PDF generation endpoints.
- PostgreSQL database with Drizzle for relational persistence.
- Server-side PDF generation for answer sheets and marking guides.
- Railway deployment for web/API/database hosting.

The MVP is single-device for presentation. It does not require WebSockets or realtime multi-device sync.

## Module boundaries

- `apps/web` — React app shell, routes, feature screens, presentation mode, and print-centre UI.
- `apps/api` — Hono routes, request validation, auth/access-token middleware, API composition.
- `packages/domain` — pure business rules:
  - default trivia-night template
  - round layout rules
  - question slot derivation
  - max-score calculation
  - score validation
  - leaderboard ranking
  - tiebreak ordering
  - presentation-safe state derivation
- `packages/db` — Drizzle schema, migrations, database client, repository modules.
- `packages/shared` — shared Zod schemas, types, constants, and API contract helpers.
- `packages/pdf` — PDF template data shaping and rendering helpers.
- `apps/web/src/components/ui` — generic token-driven visual primitives.
- `apps/web/src/features/*` — feature-specific UI and orchestration.
- `apps/web/src/styles` — global styles and token definitions.
- `docs` — durable documentation and human-facing UX artifacts.

## Boundary rules

- Domain code must not import React, Hono, Drizzle, browser APIs, filesystem APIs, or network clients.
- UI components must not own persistence or direct database calls.
- API routes validate external input with Zod before calling services.
- Database access sits behind repository/service modules so it can be tested and mocked.
- Shared schemas are reused by UI, API, tests, and persistence where practical.
- Print/PDF rendering should receive explicit template data. It should not query the database directly.
- Randomness, IDs, dates, and clock time should be injected where they affect deterministic tests.

## Persistence

Use PostgreSQL with Drizzle from the start.

This project intentionally does **not** start with JSON persistence because its core data is relational:

- trivia nights have rounds
- rounds have questions
- trivia nights have teams
- teams have round scores
- bonus scores connect teams, rounds, and events
- access tokens connect to trivia nights
- decorative answer-sheet selections need deterministic reprints
- future accounts and saved quiz libraries are relational

Use JSONB only where it is a good fit for type-specific configuration, such as `answerConfig`, `branding`, `settings`, and possibly print-layout metadata.

## Core data concepts

### TriviaNight

The overall event. Contains title, optional subtitle/date/venue, branding, settings, status, lifecycle timestamps, and access relationships.

### Round

A trivia night section.

Supported MVP types:

- `question_round`
- `special_round`

Question rounds use either the 10-question portrait or 20-question landscape answer sheet layout.

Special rounds have no MVP answer sheet and may use manual scoring.

### Question

Saved only when non-empty.

Questions have a stable `orderIndex` matching their displayed slot number.

Supported MVP types:

- standard
- multipoint
- multiple choice

### Question slots

The UI displays explicit empty slots based on round layout, but the database stores only non-empty questions.

Slot derivation is a domain/UI concern, not a persistence requirement.

### Team

A named team within a trivia night.

### RoundScore

A per-team, per-round score.

`null` means unmarked. `0` means deliberately marked as zero.

### BonusScore

A non-negative integer score attached either to a round or to the whole trivia night.

### AccessToken

A token hash granting a specific access type.

MVP access types:

- `edit`
- `present`

`mark` may be added later.

### DecorativeAsset

A reusable black-and-white cartoon asset used as answer-sheet decoration.

Decorative assets are not attached to questions and are not clues.

### AnswerSheetDecorationSelection

Persisted selected asset/slot choices for deterministic reprints.

## Answer visibility

Answer visibility is a security-sensitive product rule.

Do not load full editor data into presentation views and hide answers with CSS.

Use separate selectors or endpoints:

- `getEditorTriviaNight()`
- `getPresentationQuestions()`
- `getPresentationAnswersForRound()`
- `getMarkingGuideData()`

Rules:

- editor access can see answers
- marking guide generation can see answers
- presentation question/recap views cannot see answers
- answer walkthrough/answer recap can see answers only for the selected round
- presenter access cannot edit quiz content

## Printing and PDF architecture

MVP print outputs:

- answer sheet per question round
- marking guide per round

PDFs should be generated reliably for A4 output.

Recommended approach:

1. Build templates as HTML/CSS components or template functions.
2. Render server-side to PDF with a tool such as Playwright.
3. Keep PDF data shaping separate from the renderer.
4. Persist decoration choices on first generation.
5. Reuse persisted decoration choices for deterministic reprints.

Do not commit generated PDFs.

## Presentation architecture

MVP presentation is single-device.

Presentation mode should support:

- title slide
- round intro
- question-by-question view
- question recap view
- answer walkthrough with deliberate reveal
- answer recap
- recent round leaderboard
- overall leaderboard
- final results
- tiebreaker view

No WebSocket/SSE infrastructure is required for MVP.

If multi-device presentation control is added later, document the decision and introduce realtime state deliberately.

## Scoring architecture

Score calculation belongs in domain code.

Rules:

- max score is calculated from filled questions, not answer-sheet slots
- special rounds may define manual max score
- unmarked and zero are distinct
- above-max score creates warning and requires explicit override
- bonus points are non-negative integers
- tied teams share ranks
- tiebreakers resolve ordering among tied teams without changing score totals

## Validation

- Zod validates external input at API boundaries.
- Domain functions validate business invariants.
- Drizzle schema enforces database constraints where practical.
- UI should surface validation before submit, but API/domain validation is the source of truth.

## Testing

Use Vitest.

Recommended coverage:

- domain tests for max-score calculation
- leaderboard ranking and ties
- tiebreak ordering
- slot derivation
- layout switching constraints
- score validation and override logic
- presentation-safe data selectors
- API route validation
- PDF template data generation
- database repository behaviour where practical

Use React Testing Library for UI behaviour.

## Deployment

See `docs/DEPLOYMENT.md`.
