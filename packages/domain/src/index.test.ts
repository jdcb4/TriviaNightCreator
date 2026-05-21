import { describe, it, expect } from "vitest";
import {
  calculateRoundMaxScore,
  validateScore,
  deriveQuestionSlots,
  calculateLeaderboards,
  derivePresentationRoundState,
} from "./index.js";
import type { Question, Round, Team, RoundScore, BonusScore } from "@trivia/shared";

describe("Domain Logic", () => {
  // Test Data
  const sampleRound: Round = {
    id: "round-1-uuid",
    triviaNightId: "trivia-uuid",
    title: "Round 1",
    orderIndex: 1,
    type: "question_round",
    answerSheetLayout: "landscape_20",
    answersRevealed: false,
  };

  const q1: Question = {
    id: "q1-uuid",
    roundId: "round-1-uuid",
    orderIndex: 1,
    type: "standard",
    prompt: "What is 2+2?",
    points: 1,
    answerConfig: {
      type: "standard",
      answer: "4",
    },
    createdAt: "",
    updatedAt: "",
  };

  const q2: Question = {
    id: "q2-uuid",
    roundId: "round-1-uuid",
    orderIndex: 2,
    type: "multiple_choice",
    prompt: "Select Prime Minister?",
    points: 2,
    answerConfig: {
      type: "multiple_choice",
      options: [
        { id: "opt-1", label: "A", text: "Edmund Barton" },
        { id: "opt-2", label: "B", text: "Some Else" },
      ],
      correctOptionId: "opt-1",
    },
    createdAt: "",
    updatedAt: "",
  };

  const q3: Question = {
    id: "q3-uuid",
    roundId: "round-1-uuid",
    orderIndex: 3,
    type: "multipoint",
    prompt: "Name two primary colors?",
    points: 1,
    answerConfig: {
      type: "multipoint",
      answers: ["Red", "Blue"],
      pointsPerAnswer: 1,
    },
    createdAt: "",
    updatedAt: "",
  };

  describe("calculateRoundMaxScore", () => {
    it("should aggregate standard and multiple choice question points", () => {
      const maxScore = calculateRoundMaxScore([q1, q2]);
      expect(maxScore).toBe(3); // 1 + 2 = 3
    });

    it("should calculate multipoint question max score by answers count", () => {
      const maxScore = calculateRoundMaxScore([q3]);
      expect(maxScore).toBe(2); // 2 answers * 1 point each = 2
    });

    it("should sum mixed question types correctly", () => {
      const maxScore = calculateRoundMaxScore([q1, q2, q3]);
      expect(maxScore).toBe(5); // 1 + 2 + 2 = 5
    });
  });

  describe("validateScore", () => {
    it("should accept valid scores below the max score", () => {
      const result = validateScore(4, 5);
      expect(result.isValid).toBe(true);
      expect(result.warning).toBe(false);
    });

    it("should reject negative scores", () => {
      const result = validateScore(-1, 5);
      expect(result.isValid).toBe(false);
      expect(result.warning).toBe(false);
      expect(result.message).toBe("Score cannot be negative.");
    });

    it("should trigger warning and allow override for scores above calculated max", () => {
      const result = validateScore(6, 5);
      expect(result.isValid).toBe(true);
      expect(result.warning).toBe(true);
      expect(result.message).toContain("above calculated round maximum");
    });

    it("should support null as unmarked", () => {
      const result = validateScore(null, 5);
      expect(result.isValid).toBe(true);
      expect(result.warning).toBe(false);
    });
  });

  describe("deriveQuestionSlots", () => {
    it("should return 10 slots for portrait layout", () => {
      const portraitRound = { ...sampleRound, answerSheetLayout: "portrait_10" as const };
      const slots = deriveQuestionSlots(portraitRound, [q1, q2]);
      expect(slots.length).toBe(10);
      expect(slots[0]?.question?.id).toBe("q1-uuid");
      expect(slots[1]?.question?.id).toBe("q2-uuid");
      expect(slots[2]?.question).toBeNull();
    });

    it("should return 20 slots for landscape layout", () => {
      const slots = deriveQuestionSlots(sampleRound, [q1, q2]);
      expect(slots.length).toBe(20);
      expect(slots[19]?.slotNumber).toBe(20);
    });
  });

  describe("calculateLeaderboards", () => {
    const teams: Team[] = [
      { id: "team-a-uuid", triviaNightId: "trivia-uuid", name: "Team A", orderIndex: 1 },
      { id: "team-b-uuid", triviaNightId: "trivia-uuid", name: "Team B", orderIndex: 2 },
      { id: "team-c-uuid", triviaNightId: "trivia-uuid", name: "Team C", orderIndex: 3 },
      { id: "team-d-uuid", triviaNightId: "trivia-uuid", name: "Team D", orderIndex: 4 },
    ];

    const rounds: Round[] = [sampleRound];

    it("should compute rank with joint ties resolving ties correctly", () => {
      // Scores: Team A = 10, Team B = 8, Team C = 8, Team D = 5
      const scores: RoundScore[] = [
        { id: "s1", triviaNightId: "trivia-uuid", roundId: "round-1-uuid", teamId: "team-a-uuid", score: 10, overrideAboveMax: false, createdAt: "", updatedAt: "" },
        { id: "s2", triviaNightId: "trivia-uuid", roundId: "round-1-uuid", teamId: "team-b-uuid", score: 8, overrideAboveMax: false, createdAt: "", updatedAt: "" },
        { id: "s3", triviaNightId: "trivia-uuid", roundId: "round-1-uuid", teamId: "team-c-uuid", score: 8, overrideAboveMax: false, createdAt: "", updatedAt: "" },
        { id: "s4", triviaNightId: "trivia-uuid", roundId: "round-1-uuid", teamId: "team-d-uuid", score: 5, overrideAboveMax: false, createdAt: "", updatedAt: "" },
      ];

      const leaderboard = calculateLeaderboards(teams, rounds, scores, []);

      expect(leaderboard[0]?.teamId).toBe("team-a-uuid");
      expect(leaderboard[0]?.rank).toBe(1);

      // Team B and C are tied, so both should have rank 2
      const teamBRow = leaderboard.find((row) => row.teamId === "team-b-uuid");
      const teamCRow = leaderboard.find((row) => row.teamId === "team-c-uuid");
      expect(teamBRow?.rank).toBe(2);
      expect(teamCRow?.rank).toBe(2);

      // Team D should skip to rank 4 because of the tie at 2nd
      const teamDRow = leaderboard.find((row) => row.teamId === "team-d-uuid");
      expect(teamDRow?.rank).toBe(4);
    });

    it("should integrate round-level and overall bonus scores", () => {
      const scores: RoundScore[] = [
        { id: "s1", triviaNightId: "trivia-uuid", roundId: "round-1-uuid", teamId: "team-a-uuid", score: 5, overrideAboveMax: false, createdAt: "", updatedAt: "" },
      ];

      const bonuses: BonusScore[] = [
        // round-level bonus
        { id: "b1", triviaNightId: "trivia-uuid", teamId: "team-a-uuid", roundId: "round-1-uuid", label: "Early registration", points: 2, createdAt: "", updatedAt: "" },
        // night-level bonus
        { id: "b2", triviaNightId: "trivia-uuid", teamId: "team-a-uuid", label: "Best joke", points: 3, createdAt: "", updatedAt: "" },
      ];

      const leaderboard = calculateLeaderboards(teams, rounds, scores, bonuses);
      const teamARow = leaderboard.find((row) => row.teamId === "team-a-uuid");

      expect(teamARow?.totalScore).toBe(10); // 5 (base) + 2 (round bonus) + 3 (night bonus)
      expect(teamARow?.roundResults[0]?.bonusScore).toBe(2);
      expect(teamARow?.nightBonusScore).toBe(3);
    });

    it("should correctly identify unmarked rounds", () => {
      const leaderboard = calculateLeaderboards(teams, rounds, [], []);
      expect(leaderboard[0]?.hasUnmarkedRounds).toBe(true);
      expect(leaderboard[0]?.roundResults[0]?.questionScore).toBeNull();
    });
  });

  describe("derivePresentationRoundState", () => {
    it("should completely hide answerConfig for unrevealed state", () => {
      const state = derivePresentationRoundState(sampleRound, [q1, q2], false);
      
      expect(state.isRevealed).toBe(false);
      expect(state.answers).toBeUndefined();
      
      // Question prompts are present
      expect(state.questions.length).toBe(2);
      expect(state.questions[0]?.prompt).toBe(q1.prompt);
      
      // Standard question has no answer leakage
      expect((state.questions[0] as any).answerConfig).toBeUndefined();
      
      // Multiple choice has options mapped but not correct answer
      expect(state.questions[1]?.options?.length).toBe(2);
      expect((state.questions[1] as any).correctOptionId).toBeUndefined();
    });

    it("should provide structured answers when revealed is true", () => {
      const state = derivePresentationRoundState(sampleRound, [q1, q2], true);
      
      expect(state.isRevealed).toBe(true);
      expect(state.answers).toBeDefined();
      expect(state.answers?.[q1.id]).toEqual({
        answer: "4",
        acceptableAnswers: [],
      });
      expect(state.answers?.[q2.id]).toEqual({
        correctOptionId: "opt-1",
        correctOptionLabel: "A",
        correctOptionText: "Edmund Barton",
      });
    });
  });
});
