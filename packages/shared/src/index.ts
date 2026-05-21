import { z } from "zod";

// Branding configuration schema
export const BrandingConfigSchema = z.object({
  eventTitle: z.string().min(1, "Event title is required").default("Trivia Night"),
  subtitle: z.string().optional(),
  logoUrl: z.string().url().or(z.literal("")).optional(),
  footerText: z.string().default("Please write clearly. Hand this sheet in at the end of the round."),
});
export type BrandingConfig = z.infer<typeof BrandingConfigSchema>;

// Trivia Night Settings schema
export const TriviaNightSettingsSchema = z.object({
  allowLateTeamRegistration: z.boolean().default(true),
  showLiveLeaderboard: z.boolean().default(true),
});
export type TriviaNightSettings = z.infer<typeof TriviaNightSettingsSchema>;

// Trivia Night Main Schema
export const TriviaNightSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional(),
  date: z.string().optional(),
  venue: z.string().optional(),
  status: z.enum(["draft", "ready", "live", "completed", "archived"]).default("draft"),
  branding: BrandingConfigSchema,
  settings: TriviaNightSettingsSchema,
  lastAccessedAt: z.string(),
  archivedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type TriviaNight = z.infer<typeof TriviaNightSchema>;

// Round layouts and types
export const RoundTypeSchema = z.enum(["question_round", "special_round"]);
export type RoundType = z.infer<typeof RoundTypeSchema>;

export const AnswerSheetLayoutSchema = z.enum(["portrait_10", "landscape_20"]);
export type AnswerSheetLayout = z.infer<typeof AnswerSheetLayoutSchema>;

export const SpecialRoundConfigSchema = z.object({
  maxPoints: z.number().int().nonnegative().optional(),
});
export type SpecialRoundConfig = z.infer<typeof SpecialRoundConfigSchema>;

// Round main schema
export const RoundSchema = z.object({
  id: z.string().uuid(),
  triviaNightId: z.string().uuid(),
  title: z.string().min(1, "Round title is required"),
  orderIndex: z.number().int().nonnegative(),
  type: RoundTypeSchema,
  answerSheetLayout: AnswerSheetLayoutSchema.optional(),
  description: z.string().optional(),
  specialRoundConfig: SpecialRoundConfigSchema.optional(),
  answersRevealed: z.boolean().default(false),
});
export type Round = z.infer<typeof RoundSchema>;

// Question Types and Answers Config
export const QuestionTypeSchema = z.enum(["standard", "multipoint", "multiple_choice"]);
export type QuestionType = z.infer<typeof QuestionTypeSchema>;

export const StandardAnswerConfigSchema = z.object({
  type: z.literal("standard"),
  answer: z.string().min(1, "Correct answer is required"),
  acceptableAnswers: z.array(z.string()).optional(),
});
export type StandardAnswerConfig = z.infer<typeof StandardAnswerConfigSchema>;

export const MultipointAnswerConfigSchema = z.object({
  type: z.literal("multipoint"),
  answers: z.array(z.string().min(1)).min(1, "At least one answer is required"),
  pointsPerAnswer: z.literal(1).default(1),
});
export type MultipointAnswerConfig = z.infer<typeof MultipointAnswerConfigSchema>;

export const MultipleChoiceOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1), // e.g. "A", "B", "C", "D"
  text: z.string().min(1),  // e.g. "Mercury"
});
export type MultipleChoiceOption = z.infer<typeof MultipleChoiceOptionSchema>;

export const MultipleChoiceAnswerConfigSchema = z.object({
  type: z.literal("multiple_choice"),
  options: z.array(MultipleChoiceOptionSchema).min(2, "At least two options are required"),
  correctOptionId: z.string().min(1, "Correct option is required"),
});
export type MultipleChoiceAnswerConfig = z.infer<typeof MultipleChoiceAnswerConfigSchema>;

export const AnswerConfigSchema = z.discriminatedUnion("type", [
  StandardAnswerConfigSchema,
  MultipointAnswerConfigSchema,
  MultipleChoiceAnswerConfigSchema,
]);
export type AnswerConfig = z.infer<typeof AnswerConfigSchema>;

// Question Main Schema
export const QuestionSchema = z.object({
  id: z.string().uuid(),
  roundId: z.string().uuid(),
  orderIndex: z.number().int().nonnegative(),
  type: QuestionTypeSchema,
  prompt: z.string().min(1, "Question prompt is required"),
  points: z.number().int().positive().default(1),
  answerConfig: AnswerConfigSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Question = z.infer<typeof QuestionSchema>;

// Team Main Schema
export const TeamSchema = z.object({
  id: z.string().uuid(),
  triviaNightId: z.string().uuid(),
  name: z.string().min(1, "Team name is required"),
  orderIndex: z.number().int().nonnegative(),
});
export type Team = z.infer<typeof TeamSchema>;

// Round Score Main Schema
export const RoundScoreSchema = z.object({
  id: z.string().uuid(),
  triviaNightId: z.string().uuid(),
  roundId: z.string().uuid(),
  teamId: z.string().uuid(),
  score: z.number().int().nonnegative().nullable(), // null means unmarked, 0 is deliberate zero
  overrideAboveMax: z.boolean().default(false),
  overrideReason: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type RoundScore = z.infer<typeof RoundScoreSchema>;

// Bonus Score Main Schema
export const BonusScoreSchema = z.object({
  id: z.string().uuid(),
  triviaNightId: z.string().uuid(),
  teamId: z.string().uuid(),
  roundId: z.string().uuid().optional(), // optional; absent means whole-night bonus
  label: z.string().min(1, "Description label is required"),
  points: z.number().int().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type BonusScore = z.infer<typeof BonusScoreSchema>;

// Tiebreaker Main Schema
export const TiebreakerSchema = z.object({
  id: z.string().uuid(),
  triviaNightId: z.string().uuid(),
  prompt: z.string().min(1, "Tiebreaker prompt is required"),
  answer: z.string().optional(),
  orderIndex: z.number().int().nonnegative(),
});
export type Tiebreaker = z.infer<typeof TiebreakerSchema>;

// Access Token Schema
export const AccessTypeSchema = z.enum(["edit", "present", "mark"]);
export type AccessType = z.infer<typeof AccessTypeSchema>;

export const AccessTokenSchema = z.object({
  id: z.string().uuid(),
  triviaNightId: z.string().uuid(),
  tokenHash: z.string(),
  accessType: AccessTypeSchema,
  createdAt: z.string(),
  revokedAt: z.string().optional(),
});
export type AccessToken = z.infer<typeof AccessTokenSchema>;

// Predefined slots metadata
export interface QuestionSlot {
  slotNumber: number;
  question: Question | null;
}

// Presentation-safe details (hiding answer config unless revealed)
export const PresentationQuestionSchema = z.object({
  id: z.string().uuid(),
  roundId: z.string().uuid(),
  orderIndex: z.number().int().nonnegative(),
  type: QuestionTypeSchema,
  prompt: z.string(),
  points: z.number(),
  options: z.array(MultipleChoiceOptionSchema).optional(), // only for multiple_choice
});
export type PresentationQuestion = z.infer<typeof PresentationQuestionSchema>;

export const PresentationRoundStateSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  orderIndex: z.number(),
  type: RoundTypeSchema,
  questions: z.array(PresentationQuestionSchema),
  answers: z.record(z.string(), z.any()).optional(), // revealed answers by questionId
  isRevealed: z.boolean().default(false),
});
export type PresentationRoundState = z.infer<typeof PresentationRoundStateSchema>;
