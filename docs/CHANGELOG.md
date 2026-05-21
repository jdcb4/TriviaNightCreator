# Changelog

Notable changes by version. Newest at the top. Bumps follow `docs/VERSIONING.md`.

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
