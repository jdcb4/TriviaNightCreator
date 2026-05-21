import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type {
  BrandingConfig,
  TriviaNightSettings,
  AnswerConfig,
  SpecialRoundConfig,
} from "@trivia/shared";

// TRIVIA NIGHTS TABLE
export const triviaNights = pgTable("trivia_nights", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  date: text("date"),
  venue: text("venue"),
  status: text("status").notNull().default("draft"), // draft | ready | live | completed | archived
  branding: jsonb("branding").$type<BrandingConfig>().notNull(),
  settings: jsonb("settings").$type<TriviaNightSettings>().notNull(),
  lastAccessedAt: timestamp("last_accessed_at").notNull().defaultNow(),
  archivedAt: timestamp("archived_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ACCESS TOKENS TABLE
export const accessTokens = pgTable("access_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  triviaNightId: uuid("trivia_night_id")
    .notNull()
    .references(() => triviaNights.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  accessType: text("access_type").notNull(), // edit | present | mark
  createdAt: timestamp("created_at").notNull().defaultNow(),
  revokedAt: timestamp("revoked_at"),
});

// TEAMS TABLE
export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  triviaNightId: uuid("trivia_night_id")
    .notNull()
    .references(() => triviaNights.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  orderIndex: integer("order_index").notNull(),
});

// ROUNDS TABLE
export const rounds = pgTable("rounds", {
  id: uuid("id").primaryKey().defaultRandom(),
  triviaNightId: uuid("trivia_night_id")
    .notNull()
    .references(() => triviaNights.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  orderIndex: integer("order_index").notNull(),
  type: text("type").notNull(), // question_round | special_round
  answerSheetLayout: text("answer_sheet_layout"), // portrait_10 | landscape_20
  description: text("description"),
  specialRoundConfig: jsonb("special_round_config").$type<SpecialRoundConfig>(),
  answersRevealed: boolean("answers_revealed").notNull().default(false),
});

// QUESTIONS TABLE
export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  roundId: uuid("round_id")
    .notNull()
    .references(() => rounds.id, { onDelete: "cascade" }),
  orderIndex: integer("order_index").notNull(),
  type: text("type").notNull(), // standard | multipoint | multiple_choice
  prompt: text("prompt").notNull(),
  points: integer("points").notNull().default(1),
  answerConfig: jsonb("answer_config").$type<AnswerConfig>().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ROUND SCORES TABLE
export const roundScores = pgTable("round_scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  triviaNightId: uuid("trivia_night_id")
    .notNull()
    .references(() => triviaNights.id, { onDelete: "cascade" }),
  roundId: uuid("round_id")
    .notNull()
    .references(() => rounds.id, { onDelete: "cascade" }),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  score: integer("score"), // null = unmarked, 0 = marked 0
  overrideAboveMax: boolean("override_above_max").notNull().default(false),
  overrideReason: text("override_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  teamRoundIdx: uniqueIndex("team_round_idx").on(table.teamId, table.roundId),
}));

// BONUS SCORES TABLE
export const bonusScores = pgTable("bonus_scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  triviaNightId: uuid("trivia_night_id")
    .notNull()
    .references(() => triviaNights.id, { onDelete: "cascade" }),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  roundId: uuid("round_id")
    .references(() => rounds.id, { onDelete: "cascade" }), // Nullable: absent means whole-night bonus
  label: text("label").notNull(),
  points: integer("points").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// TIEBREAKERS TABLE
export const tiebreakers = pgTable("tiebreakers", {
  id: uuid("id").primaryKey().defaultRandom(),
  triviaNightId: uuid("trivia_night_id")
    .notNull()
    .references(() => triviaNights.id, { onDelete: "cascade" }),
  prompt: text("prompt").notNull(),
  answer: text("answer"),
  orderIndex: integer("order_index").notNull(),
});

// DECORATIVE ASSETS TABLE (e.g., Cartoon images)
export const decorativeAssets = pgTable("decorative_assets", {
  id: text("id").primaryKey(), // Using text IDs like 'cartoon-owl', 'cartoon-brain'
  name: text("name").notNull(),
  sizeCategory: text("size_category").notNull(), // small | medium | large
  fileUrl: text("file_url").notNull(),
});

// DECORATIVE SELECTIONS TABLE (ensures deterministic reprints)
export const decorationSelections = pgTable("decoration_selections", {
  id: uuid("id").primaryKey().defaultRandom(),
  roundId: uuid("round_id")
    .notNull()
    .references(() => rounds.id, { onDelete: "cascade" }),
  slotId: text("slot_id").notNull(), // e.g. "header", "side", "footer"
  assetId: text("asset_id")
    .notNull()
    .references(() => decorativeAssets.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// RELATIONS DEFINITIONS (Drizzle queries feature helper)

export const triviaNightsRelations = relations(triviaNights, ({ many }) => ({
  rounds: many(rounds),
  teams: many(teams),
  accessTokens: many(accessTokens),
  roundScores: many(roundScores),
  bonusScores: many(bonusScores),
  tiebreakers: many(tiebreakers),
}));

export const roundsRelations = relations(rounds, ({ one, many }) => ({
  triviaNight: one(triviaNights, {
    fields: [rounds.triviaNightId],
    references: [triviaNights.id],
  }),
  questions: many(questions),
  roundScores: many(roundScores),
  bonusScores: many(bonusScores),
  decorationSelections: many(decorationSelections),
}));

export const questionsRelations = relations(questions, ({ one }) => ({
  round: one(rounds, {
    fields: [questions.roundId],
    references: [rounds.id],
  }),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  triviaNight: one(triviaNights, {
    fields: [teams.triviaNightId],
    references: [triviaNights.id],
  }),
  roundScores: many(roundScores),
  bonusScores: many(bonusScores),
}));

export const roundScoresRelations = relations(roundScores, ({ one }) => ({
  triviaNight: one(triviaNights, {
    fields: [roundScores.triviaNightId],
    references: [triviaNights.id],
  }),
  round: one(rounds, {
    fields: [roundScores.roundId],
    references: [rounds.id],
  }),
  team: one(teams, {
    fields: [roundScores.teamId],
    references: [teams.id],
  }),
}));

export const bonusScoresRelations = relations(bonusScores, ({ one }) => ({
  triviaNight: one(triviaNights, {
    fields: [bonusScores.triviaNightId],
    references: [triviaNights.id],
  }),
  round: one(rounds, {
    fields: [bonusScores.roundId],
    references: [rounds.id],
  }),
  team: one(teams, {
    fields: [bonusScores.teamId],
    references: [teams.id],
  }),
}));

export const decorationSelectionsRelations = relations(decorationSelections, ({ one }) => ({
  round: one(rounds, {
    fields: [decorationSelections.roundId],
    references: [rounds.id],
  }),
  asset: one(decorativeAssets, {
    fields: [decorationSelections.assetId],
    references: [decorativeAssets.id],
  }),
}));
