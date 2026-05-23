# Changelog

Notable changes by version. Newest at the top. Bumps follow `docs/VERSIONING.md`.

## 1.3.1 - 2026-05-23

- **Deployment Hotfix**:
  - Added `tsconfig.json` to the Dockerfile COPY instructions in both build stages. This ensures nested TypeScript builds (such as packages/shared) can locate and extend the root `tsconfig.json` during the Docker image compilation.

## 1.3.0 - 2026-05-23

- **Unified Production Docker Monolith**:
  - Prepared deployment configurations for a highly cost-effective, single-container Railway hosting strategy.
  - Configured Hono's `serveStatic` middleware to serve React static web SPA assets in production and gracefully fall back to `index.html` for client-side routing.
  - Corrected Node server port binding to dynamically read the `$PORT` environment variable supplied by Railway.
  - Created a robust multi-stage root [Dockerfile](file:///C:/CodingProjects/TriviaNightCreator/Dockerfile) using Microsoft's official Playwright runtime image to guarantee Chromium binary execution with zero library errors.
  - Wrote root [railway.json](file:///C:/CodingProjects/TriviaNightCreator/railway.json) configuration files and documented the architecture under [docs/DEPLOYMENT.md](file:///C:/CodingProjects/TriviaNightCreator/docs/DEPLOYMENT.md).
- **Editor Overview Landing Page**:
  - Replaced the direct Builder tab with a premium landing page showing a welcome message, key info (venue, date, registered teams, round count, total possible points), and an Action Plan step-by-step checklist.
  - Standardized all navigation menu buttons with unified stretch-width styles to prevent layout alignment conflicts.
- **Quiz Builder Improvements**:
  - Renamed "Rounds & Questions" to "Quiz Builder" to improve product alignment.
  - Built an above-navigation quiz statistics header detailing total rounds, teams, and points.
  - Standardized round titles to explicitly indicate editability with a clear interactive pen emoji badge.
  - Added new `Add Round` and `Delete Round` (with cascading confirmation delete modal) capabilities.
- **Special Rounds Custom Configurations**:
  - Introduced direct limits setting for max possible points on special round scoring.
  - Added multi-line rich text rules/instructions saved inside the database and projected on screen during active presentation mode.
- **Presenter & Host Controller Enhancements**:
  - Closed space gaps, optimized typographic padding, and collapsed recap slides into a gorgeous CSS masonry grid to fit up to 20 questions/answers on a single landscape screen.
  - Turned off answer recaps by default.
  - Removed standard recap navigation options from the projector's client controls bar to keep projection clean.
  - Placed a host controller direct slide grid launcher button on the projection Title Slide.
  - Enabled direct URL param (`?hostControl=true`) initialization so hosts can launch immediately into the slide matrix jump view.

## 1.2.0 - 2026-05-23

- Redesigned the presenter slide projection deck layout to completely remove individual question and answer slides in favor of round-based summary views.
  - **Round Recap Workflow**: Structured each round into Landing (`round_intro`), Questions Recap (`question_recap`), Answers Transition ("Here Come the Answers"), Answers Recap (`answer_recap`, toggleable), and a Split Leaderboard screen.
- Integrated the split-column leaderboard screen:
  - **Recent Round Standings**: Displays the top 10 rankings for the active round on the left.
  - **Overall Standings**: Displays cumulative scores on the right (rendered as a placeholder blank screen on Round 1 to hide redundant identical standings).
- Designed the premium **Host Control Desk Grid** modal:
  - Offers immediate navigation to any specific slide using a matrix layout where rows represent rounds and columns represent phases of play.
  - Accessible via a floating controller panel overlay button (`🎛️ Host Controller`).

## 1.1.0 - 2026-05-23

- Redesigned A4 answer sheet printable templates to support multi-size and multi-aspect ratio decoration slots for enhanced visual interest.
  - **Square Stamp (Small, 1:1, 60x60px)**: Dedicated slot in the header for compact stamp graphics (uses the 10 existing square assets).
  - **Tall Portrait Mascot (Medium, 2:3, 90x135px)**: Dedicated slot in the side panel for full-body standing mascots.
  - **Wide Landscape Banner (Large, 4:1, 160x40px)**: Dedicated slot in the footer for horizontal banner scenes.
- Created a programmatic vector SVG generator script powered by OpenRouter to produce clean, high-contrast, black-and-white vector doodles.
- Generated and added 20 new high-quality vector cartoon SVGs (10 tall portrait mascots and 10 wide landscape banners).
- Updated the database seeder to store size category mappings and file references for all 30 unique assets.

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
