# Changelog

Notable changes by version. Newest at the top. Bumps follow `docs/VERSIONING.md`.

## 1.0.2 - 2026-05-22

- Fixed the "0 questions" presentation slide bug by unifying flat data.questions client-side when presenting via host/edit tokens, restoring all slide deck question steps.
- Introduced customizable presentation slide settings to include/exclude round question recap and answer recap slides from the slideshow.
- Created premium glassmorphic, interactive, full-screen on-demand recap modals for both questions and revealed answers, accessible anytime during a round.

## 1.0.1 - 2026-05-22

- Added premium glassmorphic Toast notification provider system across the web builder page replacing browser alerts.
- Redesigned standard and landscape answer sheets with dedicated graphic slots for cartoon decorations.
- Generated 10 high-quality B&W cartoon assets representing educational, game, and trivia themes.
- Optimized marking guide PDFs to fit up to 20 questions compactly onto a single information-dense A4 page.
- Fixed stale React closures in presentation slide polling, preventing slides from snapping back to Slide 1 every 5 seconds.
- Implemented round-limited overall leaderboard computations to prevent future saved scores from leaking onto slides between earlier rounds.

## 0.1.0 - 2026-05-21

- Initialized TriviaNightCreator documentation set.
- Defined the MVP as a no-account, private-link trivia night builder for in-person paper-based events.
- Selected React frontend, Hono API, PostgreSQL, Drizzle, Railway, TypeScript, Zod, Tailwind, Vitest, ESLint, and Prettier as stack defaults.
- Defined the default trivia night template: 3 rounds, 20 empty question slots per round.
- Defined MVP question types: standard, multipoint, and multiple choice.
- Defined MVP round types: question rounds and special rounds.
- Defined answer sheet layouts: 10-question A4 portrait and 20-question A4 landscape with two columns of ten.
- Defined answer sheets as one PDF per round, with team-name space, score box, branding, and automatic decorative black-and-white cartoons.
- Defined marking guides as one PDF per round.
- Defined presentation views including question-by-question, question recap, answer walkthrough, answer recap, recent round leaderboard, and overall leaderboard.
- Defined scoring rules: per-round scores, unmarked distinct from zero, bonus points, above-max warning with override, and tiebreakers that resolve ties without changing points.
- Defined access model using private edit and presentation tokens, with full user accounts left on the roadmap.
- Defined archive lifecycle for quizzes inactive for 12 months.
