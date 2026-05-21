# Trivia Night Host App — Product & MVP Specifications

## 1. Product Summary

A private-link, no-account-required trivia night builder and hosting tool for in-person corporate, school, fundraiser, community, and social events.

The app helps a host:

- build a trivia night using their own questions
- organise questions into rounds
- print polished A4 answer sheets
- print per-round marking guides
- optionally present questions and answers on screen
- enter scores per round
- show round and overall leaderboards
- support bonus points, special rounds, and tiebreakers

The app is not primarily a phone-based quiz app. Teams answer on paper. The host may use a projector or screen, but presentation mode is optional.

---

## 2. Target Audience

Primary users:

- school fundraiser organisers
- corporate/social event organisers
- club and community trivia hosts
- casual hosts running in-person trivia nights

The product should prioritise:

- reliability
- simple setup
- good print output
- clear host controls
- low-friction access
- no requirement for accounts
- no requirement for team devices
- safe presentation views that do not accidentally reveal answers

---

## 3. Core MVP Positioning

The MVP should support this core promise:

> Create a private trivia night, print clean answer sheets and marking guides, optionally present it on screen, enter scores, and show leaderboards.

The MVP should not attempt to generate questions. Hosts provide their own questions.

AI-assisted generation is a roadmap feature.

---

## 4. Core In-Room Flow

A typical supported trivia-night flow:

1. Host creates a trivia night.
2. Host adds or edits rounds and questions.
3. Host prints one answer sheet per round.
4. Host prints one marking guide per round.
5. Teams write answers on paper.
6. Host optionally presents questions one at a time.
7. At the end of a round, host shows a question recap screen.
8. Host collects answer sheets.
9. Host presents answers either one at a time or all at once.
10. Host enters scores per team per round.
11. App shows:
    - most recent round leaderboard
    - overall leaderboard
12. Repeat for later rounds.
13. Tiebreakers are used only to resolve tied teams, not to add points.

The app should support this flow but not force a rigid sequence. The host should be able to jump between presentation views as needed.

---

## 5. MVP Feature Scope

### 5.1 Included in MVP

- No-account trivia night creation
- Private edit link
- Separate presentation access
- Default trivia night template
- Round builder
- Question builder
- Standard questions
- Multipoint questions
- Multiple-choice questions
- Special rounds
- Two answer sheet layouts:
  - 10-question A4 portrait
  - 20-question A4 landscape, 2 columns of 10
- One answer sheet per round
- One marking guide per round
- Branding fields on answer sheets
- Automatically placed decorative black-and-white cartoon assets on answer sheets
- Presentation mode
- Full-screen audience mode with host controls hidden
- Question-by-question presentation
- Question recap screen
- Answer walkthrough with deliberate reveal
- Answer recap screen
- Manual per-round scoring
- Round-level bonus points
- Whole-night bonus points
- Score validation with warning and override
- Most recent round leaderboard
- Overall leaderboard
- Tiebreakers
- Archive quizzes after 12 months of inactivity

### 5.2 Excluded from MVP

- Full user accounts
- Saved quiz dashboard
- AI question generation
- AI full trivia-night generation
- In-app AI cartoon generation
- Team phone submissions
- Automatic marking
- Picture rounds
- Audio rounds
- Video rounds
- General printable question sheets
- Handout-based bonus rounds
- JSON import/export
- Archived quiz restoration by private link
- Multi-device live presenter control
- Reusable question bank UI

---

## 6. Roadmap Features

### 6.1 Accounts

Accounts may be added later for:

- saved quiz dashboard
- easier return to old quizzes
- quiz duplication
- long-term storage
- reusable question banks
- custom branding templates
- AI generation history
- premium or advanced features

Basic no-account use should remain available indefinitely.

### 6.2 AI-Assisted Generation

Roadmap AI features:

- generate individual questions
- generate full trivia nights
- suggest answer variants
- suggest round themes
- suggest tiebreakers
- possibly generate handout-based bonus round content

### 6.3 Decorative Cartoon Library

The app should eventually include a reusable library of approximately 50 black-and-white cartoon decorations for answer sheets.

These images are:

- decorative only
- not question-specific
- not clues
- not attached to individual questions
- generated or curated once
- reused across printed answer sheets

The MVP should support the concept of automatically placing these images in answer sheet templates.

### 6.4 Handout-Based Bonus Rounds

Question sheets are not part of the MVP, but should be considered later as part of specific handout-based special rounds.

Examples:

- picture round
- movie-still round
- logo identification round
- map round
- emoji round
- matching round
- dingbat/rebus round
- timeline ordering round
- “name these 4 movies from the pictures” round

These should be treated as specific custom handout round types, not as general-purpose question sheets for normal rounds.

### 6.5 Media Rounds

Roadmap support:

- picture rounds
- audio rounds
- video rounds

---

## 7. Default Trivia Night Template

When a new trivia night is created, the app should create the default structure all at once:

- 3 rounds
- 20 empty question slots per round
- each round defaults to the 20-question landscape answer sheet layout
- question numbers reset each round
- rounds named:
  - Round 1
  - Round 2
  - Round 3

Round names should be editable.

---

## 8. Round Types

### 8.1 Question Round

A standard round containing trivia questions.

Supported layouts:

- 10-question portrait layout
- 20-question landscape layout

Question rounds have answer sheets.

The round maximum score is calculated from filled questions, not from the number of answer slots.

### 8.2 Special Round

A manually scored round that may have no ordinary questions.

Special rounds:

- have no answer sheet in the MVP
- may have a manually configured maximum score
- are included in leaderboards
- may be presented if the host wants
- are intended for flexible live activities or bonus-style rounds

Examples:

- heads or tails
- closest guess
- table challenge
- physical activity
- sponsor challenge
- mystery round

Custom printed sheets for special rounds are a roadmap feature.

---

## 9. Question Slots

The UI should show explicit empty question slots.

Example for a 20-question round:

```text
1. [Empty question]
2. [Empty question]
3. [Empty question]
...
20. [Empty question]
```

The database should only save non-empty questions.

The frontend can derive slots from the round layout and existing saved questions.

Example logic:

```ts
const slots = Array.from({ length: round.expectedQuestionCount }, (_, index) => {
  const slotNumber = index + 1
  const question = questions.find(q => q.orderIndex === slotNumber)

  return {
    slotNumber,
    question: question ?? null
  }
})
```

Missing slots should be skipped in presentation and marking guides, while preserving original question numbering.

Example:

```text
Question 1
Question 2
Question 4
```

If Question 3 is empty, it is skipped rather than displayed blank.

---

## 10. Question Types

### 10.1 Standard Question

One question with one correct answer.

Example:

```text
Who was the first Prime Minister of Australia?
Answer: Edmund Barton
```

Fields:

- prompt
- answer
- optional acceptable answers
- points

### 10.2 Multipoint Question

One question with multiple correct answers.

Example:

```text
Name the five most populous countries.
```

Rules:

- each correct answer is worth 1 point
- MVP answer sheet still shows only one answer blank for the whole question
- roadmap may support multiple blank answer spaces for multipoint questions

Fields:

- prompt
- list of correct answers
- points per answer, fixed at 1 for MVP

### 10.3 Multiple-Choice Question

One question with provided answer options and one correct answer.

Rules:

- multiple-choice options should appear in presentation mode
- multiple-choice options should not appear on answer sheets
- teams may answer with either option letter or answer text
- marking guide should show both

Example marking guide format:

```text
Correct answer: A — Mercury
```

Fields:

- prompt
- options
- correct option
- points

---

## 11. Answer Sheet Requirements

### 11.1 General

Answer sheets are central to the MVP.

The app should generate one answer sheet per round.

Answer sheets are blank with respect to team names. They should include a space for teams to write their name.

The app does not need to generate one answer sheet per team.

### 11.2 Supported Layouts

There are only two MVP answer sheet layouts:

#### 10-Question Layout

- A4 portrait
- 10 numbered answer spaces
- branding on every page
- team name field
- score box
- marker field
- decorative cartoon placement

#### 20-Question Layout

- A4 landscape
- 2 columns of 10 answer spaces
- 20 numbered answer spaces total
- branding on every page
- team name field
- score box
- marker field
- decorative cartoon placement

### 11.3 Layout Switching

Changing question count requires explicitly changing the round layout.

The app should not silently change layouts when questions are added or removed.

If a host switches from 20-question landscape to 10-question portrait and questions exist in slots 11–20:

- warn the host
- do not silently delete those questions
- indicate that those slots will not be included under the 10-question layout unless moved or restored through a layout switch

### 11.4 Answer Sheet Contents

Each answer sheet should include:

- event title
- subtitle, if provided
- logo, if provided
- footer text
- round name
- team name field
- numbered answer spaces
- score box
- maximum score
- marker field
- automatically placed decorative black-and-white cartoons

Example score box:

```text
Score: ____ / 20
Marker: ______
```

The maximum score should be calculated from filled questions.

### 11.5 Decorative Cartoons

Decorative cartoon images should be added automatically by the template.

The host does not manually choose them in the MVP.

The system should support:

- 3 image sizes
- 3 placement zones per layout
- random allocation during sheet generation
- deterministic reprints once generated

Recommended rule:

> Randomise decorative assets on first answer sheet generation, then persist the selected asset/slot choices for that round.

This prevents the same sheet from changing unexpectedly when reprinted.

Possible data structure:

```ts
DecorativeAsset {
  id: string
  name: string
  sizeCategory: "small" | "medium" | "large"
  fileUrl: string
}
```

```ts
DecorationSlot {
  id: string
  layout: "portrait_10" | "landscape_20"
  supportedSize: "small" | "medium" | "large"
  position: "header" | "side" | "footer"
}
```

```ts
AnswerSheetDecorationSelection {
  roundId: string
  slotId: string
  assetId: string
}
```

---

## 12. Branding

The MVP should support these branding fields:

```ts
BrandingConfig {
  eventTitle: string
  subtitle?: string
  logoUrl?: string
  footerText?: string
}
```

Default values:

```text
Event title: Trivia Night
Subtitle: blank
Logo: blank/default placeholder
Footer text: Please write clearly. Hand this sheet in at the end of the round.
```

Branding should appear on every answer sheet and marking guide.

---

## 13. Marking Guides

The MVP should generate one marking guide per round.

Marking guides should include:

- event title
- round title
- question number
- question text
- correct answer
- accepted answers, where relevant
- multiple-choice correct option and text
- points available
- total maximum score for the round

Empty slots should be skipped, while preserving question numbering.

Example:

```text
1. Who was the first Prime Minister of Australia?
Answer: Edmund Barton
Points: 1

2. ...

4. ...
```

If Question 3 is empty, it should not appear.

---

## 14. Print Generation

### 14.1 MVP Format

MVP should generate proper PDFs for:

- answer sheets
- marking guides

The product relies heavily on reliable printed materials, so browser-only print output is not preferred as the final MVP method.

### 14.2 Implementation Recommendation

Templates may be built as HTML/CSS first, but should be rendered to PDF server-side.

Recommended approach:

- build print templates as HTML/CSS
- use a server-side renderer such as Playwright to generate PDF files
- enforce A4 page size
- control margins and layout
- preserve deterministic decoration placement

The print system should be designed with future custom handout-based rounds in mind.

---

## 15. Presentation Mode

Presentation mode is optional. The app should still be useful if the host does not use a screen.

Presentation mode should support a single-device workflow. No real-time multi-device sync is required in the MVP.

### 15.1 Presenter Views

Required views:

- title slide
- round intro
- question-by-question view
- question recap view
- answer walkthrough view
- answer recap view
- most recent round leaderboard
- overall leaderboard
- final results
- tiebreaker view

### 15.2 Question-by-Question View

Shows one question at a time.

For multiple-choice questions, options should be shown.

Answers should not be shown.

### 15.3 Question Recap View

Shows all filled questions in the round.

Does not show answers.

Used for the in-room moment where the host says:

> Answer sheets are due soon. The questions are back on screen if you need to check them.

Missing question slots are skipped, while preserving original numbering.

### 15.4 Answer Walkthrough View

Shows one question at a time.

The answer must require an intentional reveal action.

This prevents the host from accidentally revealing answers too early.

### 15.5 Answer Recap View

Shows all questions and answers for the round.

Used when the host wants to put all answers on screen at once.

### 15.6 Full-Screen Audience Mode

Presentation should support a full-screen mode where host controls are hidden.

There should also be a host control mode with visible controls for navigation.

---

## 16. Scoring

### 16.1 General Rules

- scores are entered per team per round
- scores are integers
- no half points
- no negative points
- unmarked is distinct from zero
- a deliberate zero must be saved as zero
- bonus points are supported
- special rounds count in leaderboards

### 16.2 Round Scores

A round score starts as unmarked.

```ts
RoundScore {
  teamId: string
  roundId: string
  score: number | null
}
```

Interpretation:

- `null` means unmarked
- `0` means marked as zero

### 16.3 Score Validation

The app should calculate the maximum score for each round from filled questions.

If a host enters a score above the calculated maximum:

- warn the host
- allow an explicit override

This supports real-world flexibility while still catching likely mistakes.

### 16.4 Bonus Points

Bonus points can be:

- attached to a round
- attached to the whole trivia night

```ts
BonusScore {
  id: string
  triviaNightId: string
  teamId: string
  roundId?: string
  label: string
  points: number
}
```

Rules:

- `roundId` present = round-level bonus
- `roundId` absent = whole-night bonus
- bonus points are non-negative integers

### 16.5 Leaderboards

The app should show both:

- most recent round leaderboard
- overall leaderboard

The leaderboard should show all teams.

If not all scores are entered, the app may still show the leaderboard, but should make incomplete score status clear.

Tied teams should show the same rank.

Example:

```text
1. Team A — 42
2. Team B — 39
2. Team C — 39
4. Team D — 35
```

---

## 17. Tiebreakers

Tiebreakers only determine winner ordering among tied teams.

They do not add to ordinary point totals.

MVP tiebreaker model:

```ts
Tiebreaker {
  id: string
  triviaNightId: string
  prompt: string
  answer?: string
  orderIndex: number
}
```

Tiebreaker result:

```ts
TiebreakerResult {
  triviaNightId: string
  tiedTeamIds: string[]
  winningTeamId: string
}
```

For MVP, the host decides the tiebreaker winner manually.

Automatic closest-answer evaluation is not required.

---

## 18. Privacy and Access

### 18.1 No-Account Access

The MVP should not require accounts.

Anyone with the private edit link can edit the trivia night.

This is intentional.

### 18.2 Access Types

Use separate access modes:

```text
edit
present
mark, optional later
```

MVP should at least support:

- edit access
- presentation access

The presentation access must not expose edit controls or unrevealed answers.

### 18.3 Token Separation

The app must distinguish between:

- private edit access
- presentation access visible during the quiz

The presenter code/link should not provide backend edit access.

Recommended:

```ts
AccessToken {
  id: string
  triviaNightId: string
  tokenHash: string
  accessType: "edit" | "present" | "mark"
  createdAt: string
  revokedAt?: string
}
```

Store token hashes, not raw tokens.

---

## 19. Archiving and Data Lifecycle

Trivia nights should be archived after 12 months of inactivity.

Archive schedule should be configurable.

Suggested environment variables:

```env
ARCHIVE_JOB_ENABLED=true
ARCHIVE_JOB_CRON=0 3 * * 0
TRIVIA_NIGHT_ARCHIVE_AFTER_DAYS=365
```

Archive condition should be based on the latest of relevant activity timestamps, preferably tracked with:

```ts
lastAccessedAt: string
```

When archived:

- quiz is no longer restorable by private edit link
- presentation links should stop working or show an archived message
- data is retained
- account-based restoration may be considered later
- warning before archive is only relevant once accounts exist

---

## 20. Recommended Tech Stack

### 20.1 Application Stack

```text
Frontend: React
Backend API: Hono
Database: PostgreSQL
ORM: Drizzle
Hosting: Railway
Repository: single monorepo
Shared types: yes
```

### 20.2 Database Choice

Use PostgreSQL.

Reasoning:

- trivia nights have rounds
- rounds have questions
- teams have scores
- leaderboards require relational queries
- bonus points connect to teams, rounds, and events
- future accounts and saved libraries are relational
- JSONB can still support flexible question configs

### 20.3 Question Config Storage

Use relational tables for stable entities and JSONB where appropriate.

Recommended:

- stable entities as tables
- question-specific answer configuration as JSONB
- print/decorative layout selections as relational or JSONB depending on implementation simplicity

---

## 21. Suggested Data Model

### 21.1 TriviaNight

```ts
TriviaNight {
  id: string
  title: string
  subtitle?: string
  date?: string
  venue?: string
  status: "draft" | "ready" | "live" | "completed" | "archived"
  branding: BrandingConfig
  settings: TriviaNightSettings
  lastAccessedAt: string
  archivedAt?: string
  createdAt: string
  updatedAt: string
}
```

### 21.2 Round

```ts
Round {
  id: string
  triviaNightId: string
  title: string
  orderIndex: number
  type: "question_round" | "special_round"
  answerSheetLayout?: "portrait_10" | "landscape_20"
  description?: string
  specialRoundConfig?: {
    maxPoints?: number
  }
}
```

### 21.3 Question

```ts
Question {
  id: string
  roundId: string
  orderIndex: number
  type: "standard" | "multipoint" | "multiple_choice"
  prompt: string
  points: number
  answerConfig: StandardAnswerConfig | MultipointAnswerConfig | MultipleChoiceAnswerConfig
  answerSheetConfig?: {
    answerLines: number
  }
  createdAt: string
  updatedAt: string
}
```

### 21.4 Answer Configs

```ts
type StandardAnswerConfig = {
  type: "standard"
  answer: string
  acceptableAnswers?: string[]
}
```

```ts
type MultipointAnswerConfig = {
  type: "multipoint"
  answers: string[]
  pointsPerAnswer: 1
}
```

```ts
type MultipleChoiceAnswerConfig = {
  type: "multiple_choice"
  options: {
    id: string
    label: string
    text: string
  }[]
  correctOptionId: string
}
```

### 21.5 Team

```ts
Team {
  id: string
  triviaNightId: string
  name: string
  orderIndex: number
}
```

### 21.6 RoundScore

```ts
RoundScore {
  id: string
  triviaNightId: string
  roundId: string
  teamId: string
  score: number | null
  overrideAboveMax: boolean
  overrideReason?: string
  createdAt: string
  updatedAt: string
}
```

### 21.7 BonusScore

```ts
BonusScore {
  id: string
  triviaNightId: string
  teamId: string
  roundId?: string
  label: string
  points: number
  createdAt: string
  updatedAt: string
}
```

### 21.8 Tiebreaker

```ts
Tiebreaker {
  id: string
  triviaNightId: string
  prompt: string
  answer?: string
  orderIndex: number
}
```

### 21.9 AccessToken

```ts
AccessToken {
  id: string
  triviaNightId: string
  tokenHash: string
  accessType: "edit" | "present" | "mark"
  createdAt: string
  revokedAt?: string
}
```

### 21.10 DecorativeAsset

```ts
DecorativeAsset {
  id: string
  name: string
  sizeCategory: "small" | "medium" | "large"
  fileUrl: string
}
```

### 21.11 AnswerSheetDecorationSelection

```ts
AnswerSheetDecorationSelection {
  id: string
  roundId: string
  slotId: string
  assetId: string
  createdAt: string
}
```

---

## 22. Suggested Screens

### 22.1 Create Trivia Night

Fields:

- event title
- subtitle, optional
- date, optional
- venue, optional

Default creation should generate:

- 3 rounds
- 20 empty slots each
- landscape 20 layout for each round

### 22.2 Builder

Main functions:

- edit event details
- edit branding
- view round list
- edit round names
- change round layout
- edit question slots
- add/change question types
- manage teams
- access print centre
- access presentation mode
- access scoring

### 22.3 Round Editor

Shows explicit slots.

For each slot:

- empty state
- question type
- prompt
- answer details
- points

### 22.4 Print Centre

Outputs:

- answer sheet per round
- marking guide per round

Future outputs:

- special round handouts
- bonus round sheets
- full host pack

### 22.5 Presentation Mode

Views:

- title
- round intro
- question-by-question
- question recap
- answer walkthrough
- answer recap
- recent round leaderboard
- overall leaderboard
- final results
- tiebreaker

### 22.6 Scoring

Score grid:

```text
Team | Round 1 | Round 2 | Round 3 | Bonus | Total
```

Need clear states for:

- unmarked
- zero
- above-max override
- incomplete leaderboard

---

## 23. API Shape

Suggested routes:

```text
POST   /api/trivia-nights
GET    /api/trivia-nights/:id
PATCH  /api/trivia-nights/:id

POST   /api/trivia-nights/:id/rounds
PATCH  /api/rounds/:roundId
DELETE /api/rounds/:roundId

POST   /api/rounds/:roundId/questions
PATCH  /api/questions/:questionId
DELETE /api/questions/:questionId

POST   /api/trivia-nights/:id/teams
PATCH  /api/teams/:teamId
DELETE /api/teams/:teamId

POST   /api/trivia-nights/:id/scores
GET    /api/trivia-nights/:id/leaderboards

POST   /api/trivia-nights/:id/bonus-scores
PATCH  /api/bonus-scores/:bonusScoreId
DELETE /api/bonus-scores/:bonusScoreId

POST   /api/trivia-nights/:id/tiebreakers
PATCH  /api/tiebreakers/:tiebreakerId
DELETE /api/tiebreakers/:tiebreakerId

GET    /api/print/rounds/:roundId/answer-sheet
GET    /api/print/rounds/:roundId/marking-guide

GET    /api/present/:presentToken/state
```

Separate host/editor-safe routes from presentation-safe routes.

Presentation-safe routes must not expose unrevealed answers or edit tokens.

---

## 24. Security and Answer Visibility

Answers should not merely be hidden in the UI.

The app should avoid sending answer data to presentation views until the view requires it.

Use separate data selectors or endpoints:

```ts
getEditorTriviaNight()
getPresentationQuestions()
getPresentationAnswersForRound()
getMarkingGuide()
```

Rules:

- editor access can see answers
- marking guide can see answers
- presentation question view cannot see answers
- answer walkthrough/recap may see answers for the selected round
- presenter access cannot modify quiz content

---

## 25. Implementation Priorities

### Phase 1: Core Builder

- create trivia night
- default 3x20 template
- edit rounds
- edit question slots
- support three question types
- save non-empty questions only

### Phase 2: Print Outputs

- generate answer sheet PDFs
- generate marking guide PDFs
- support branding
- support automatic decorative asset placement
- persist decoration selections for deterministic reprints

### Phase 3: Scoring

- teams
- per-round score entry
- unmarked vs zero
- score validation with warning/override
- bonus scores
- round leaderboard
- overall leaderboard

### Phase 4: Presentation

- title slide
- round intro
- question-by-question
- recap
- answer walkthrough
- answer recap
- fullscreen mode
- leaderboard views

### Phase 5: Lifecycle and Access

- edit/presenter token handling
- archive job
- archived-state handling

---

## 26. Open Questions for Later

These are not blockers for MVP:

1. What features should require an account?
2. Should anonymous quizzes be claimable by an account later?
3. Should account users be able to restore archived quizzes?
4. Should custom branding templates be paid/account features?
5. Should decorative cartoon packs be themeable?
6. Should handout-based bonus rounds have their own builder?
7. Should question reuse become a question bank or simple duplicate/import workflow?
8. Should PDF exports be stored or generated on demand?
9. Should presenters support multiple devices later via WebSockets or Server-Sent Events?
10. Should AI generation be built into the quiz editor or as a separate planning flow?

---

## 27. Summary of Key Decisions

- Corporate/social/fundraiser trivia is the primary target.
- Teams answer on paper.
- Presentation mode is useful but optional.
- MVP does not generate questions.
- MVP uses PostgreSQL, Drizzle, Hono, React, and Railway.
- NoSQL is not preferred.
- No accounts are required for MVP or basic use.
- Private edit links allow editing.
- Separate presentation access must not allow editing.
- Default quiz is 3 rounds of 20 questions.
- Answer sheets are one per round, not one per team.
- Answer sheets support 10 portrait or 20 landscape layouts only.
- Layout changes must be explicit.
- Empty slots are shown in the UI but not saved in the database.
- Empty slots are skipped in presentation and marking guides.
- Round maximum score is calculated from filled questions.
- Scores are per round.
- Unmarked is distinct from zero.
- Above-maximum scores warn but can be overridden.
- Bonus points can apply to rounds or the whole night.
- Tiebreakers only resolve ties and do not add points.
- Leaderboards show both recent round results and overall standings.
- Special rounds have no answer sheet in MVP.
- Handout-based special rounds are roadmap.
- Decorative black-and-white cartoons are reusable answer sheet decorations, not question content.
- Answer sheets and marking guides should be generated as PDFs.
- Trivia nights are archived after 12 months of inactivity.
