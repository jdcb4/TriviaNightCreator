# Decisions

Durable architecture and tooling decisions for TriviaNightCreator. ADR-lite format: each entry is dated, names the decision, the reasoning, and any rejected alternatives.

When adding a new entry, append to the bottom and keep past decisions. Do not delete past decisions; supersede them with a new entry if needed.

## Format

```text
## YYYY-MM-DD: <decision title>

**Decision:** <one sentence>

**Reasoning:** <why this won>

**Rejected alternatives:** <what else was considered and why not>

**Supersedes:** <link to a prior decision, if applicable>
```

---

## 2026-05-21: Build a full-stack React + Hono trivia host tool

**Decision:** Use React for the frontend and Hono for the backend API.

**Reasoning:** The product needs a rich builder UI, presentation mode, scoring screens, print-centre workflows, and a relatively small but clear API. React fits the UI needs and Hono keeps the backend lightweight while staying TypeScript-first.

**Rejected alternatives:** A client-only app was rejected because the MVP needs durable private-link access, database persistence, PDF generation, and answer visibility enforcement. Next.js was considered but is not necessary for the MVP because server rendering and framework-integrated routing are not core requirements.

## 2026-05-21: Use PostgreSQL + Drizzle from the start

**Decision:** Use PostgreSQL with Drizzle as the persistence layer.

**Reasoning:** The core data is relational: trivia nights have rounds, rounds have questions, trivia nights have teams, teams have scores, bonus scores attach to teams/rounds/events, and access tokens attach to trivia nights. Drizzle keeps schema and query work TypeScript-friendly.

**Rejected alternatives:** JSON files were rejected because relational scoring, access, and lifecycle queries would become awkward quickly. NoSQL was rejected because the app has strong relational access patterns. Prisma was considered but Drizzle better matches the desired lightweight TypeScript style.

## 2026-05-21: Use private access links instead of account auth in the MVP

**Decision:** The MVP uses private edit and presentation access tokens, not full user accounts.

**Reasoning:** The product should be usable without account creation. Private edit links let a host create and manage a quiz quickly, while separate presentation links prevent visible quiz/presentation access from becoming edit access.

**Rejected alternatives:** Full account auth was rejected for MVP because it adds product, security, and recovery complexity before the core host workflow is proven. A single shared code was rejected because presentation access and edit access must remain separate.

## 2026-05-21: Generate answer sheets and marking guides as PDFs

**Decision:** MVP print outputs should be generated as A4 PDFs.

**Reasoning:** Printable answer sheets are central to the product. Corporate, school, and fundraiser hosts need reliable A4 output. Browser printing alone can vary across browsers and printers.

**Rejected alternatives:** Browser-only printable HTML was rejected as the final MVP print method, though HTML/CSS templates may still be used internally and rendered to PDF server-side.

## 2026-05-21: Treat decorative cartoons as reusable answer-sheet assets

**Decision:** Black-and-white cartoon images are reusable answer-sheet decorations, not question content.

**Reasoning:** The decorative images should add personality to paper answer sheets without affecting question semantics, marking, or presentation. They should be automatically placed by templates with deterministic reprints.

**Rejected alternatives:** Per-question image generation was rejected because the MVP does not include picture questions or question sheets. Host-selected decoration was deferred because automatic template placement is simpler.

## 2026-05-21: Keep handout-based special rounds on the roadmap

**Decision:** Special custom handouts are roadmap features, not MVP features.

**Reasoning:** The MVP should focus on standard answer sheets, marking guides, presentation, and scoring. Handout-based bonus rounds such as movie stills, logos, maps, emoji clues, or matching rounds require distinct templates and workflows.

**Rejected alternatives:** General-purpose question sheets in the MVP were rejected because they would distort the early product around a less central print artifact.
