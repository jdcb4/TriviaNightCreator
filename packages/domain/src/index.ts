import type {
  Question,
  Round,
  QuestionSlot,
  Team,
  RoundScore,
  BonusScore,
  PresentationQuestion,
  PresentationRoundState,
} from "@trivia/shared";

/**
 * Calculates the maximum possible score for a list of questions in a round.
 * Only questions that are filled (non-empty) are counted.
 */
export function calculateRoundMaxScore(questions: Question[], specialMaxPoints?: number): number {
  if (specialMaxPoints !== undefined && specialMaxPoints > 0) {
    return specialMaxPoints;
  }
  return questions.reduce((sum, question) => {
    if (question.type === "multipoint" && question.answerConfig.type === "multipoint") {
      // Each correct answer in a multipoint question is worth pointsPerAnswer (MVP is fixed at 1 per answer)
      const answersCount = question.answerConfig.answers.length;
      const pointsPer = question.answerConfig.pointsPerAnswer || 1;
      return sum + answersCount * pointsPer;
    }
    // Standard and multiple choice questions use the points property
    return sum + (question.points || 1);
  }, 0);
}

/**
 * Validates a team's entered round score against the round's maximum score.
 */
export interface ScoreValidationResult {
  isValid: boolean;
  warning: boolean;
  message?: string;
}

export function validateScore(score: number | null, maxScore: number): ScoreValidationResult {
  if (score === null) {
    return { isValid: true, warning: false };
  }
  if (score < 0) {
    return { isValid: false, warning: false, message: "Score cannot be negative." };
  }
  if (score > maxScore) {
    return {
      isValid: true,
      warning: true,
      message: `Entered score (${score}) is above calculated round maximum (${maxScore}).`,
    };
  }
  return { isValid: true, warning: false };
}

/**
 * Derives the list of slots (empty or filled) for a round based on its layout.
 */
export function deriveQuestionSlots(round: Round, questions: Question[]): QuestionSlot[] {
  const expectedCount = round.answerSheetLayout === "portrait_10" ? 10 : 20;
  
  return Array.from({ length: expectedCount }, (_, index) => {
    const slotNumber = index + 1;
    const question = questions.find((q) => q.orderIndex === slotNumber);
    return {
      slotNumber,
      question: question ?? null,
    };
  });
}

/**
 * Leaderboard structures
 */
export interface TeamRoundResult {
  roundId: string;
  roundTitle: string;
  questionScore: number | null; // null = unmarked, 0 = marked 0
  bonusScore: number;
  totalRoundScore: number | null; // null = both unmarked, else sum
}

export interface TeamLeaderboardRow {
  teamId: string;
  teamName: string;
  orderIndex: number;
  roundResults: TeamRoundResult[];
  nightBonusScore: number;
  totalScore: number;
  rank: number;
  hasUnmarkedRounds: boolean;
}

/**
 * Calculates leaderboards across a trivia night for both overall and individual rounds.
 * Correctly assigns identical ranks to tied scores and skips ranks appropriately.
 */
export function calculateLeaderboards(
  teams: Team[],
  rounds: Round[],
  scores: RoundScore[],
  bonusScores: BonusScore[]
): TeamLeaderboardRow[] {
  // Sort rounds by order index to ensure consistent display
  const sortedRounds = [...rounds].sort((a, b) => a.orderIndex - b.orderIndex);

  const leaderboard: TeamLeaderboardRow[] = teams.map((team) => {
    let overallScore = 0;
    let hasUnmarkedRounds = false;

    // Calculate score per round
    const roundResults: TeamRoundResult[] = sortedRounds.map((round) => {
      // Find team score for this round
      const scoreObj = scores.find(
        (s) => s.teamId === team.id && s.roundId === round.id
      );
      const questionScore = scoreObj ? scoreObj.score : null;

      if (questionScore === null) {
        hasUnmarkedRounds = true;
      } else {
        overallScore += questionScore;
      }

      // Find round-level bonuses for this team and round
      const roundBonuses = bonusScores.filter(
        (b) => b.teamId === team.id && b.roundId === round.id
      );
      const roundBonusSum = roundBonuses.reduce((sum, b) => sum + b.points, 0);
      overallScore += roundBonusSum;

      return {
        roundId: round.id,
        roundTitle: round.title,
        questionScore,
        bonusScore: roundBonusSum,
        totalRoundScore: questionScore === null ? null : questionScore + roundBonusSum,
      };
    });

    // Find whole-night bonuses for this team (where roundId is not specified or null)
    const nightBonuses = bonusScores.filter(
      (b) => b.teamId === team.id && (!b.roundId || b.roundId === null)
    );
    const nightBonusSum = nightBonuses.reduce((sum, b) => sum + b.points, 0);
    overallScore += nightBonusSum;

    return {
      teamId: team.id,
      teamName: team.name,
      orderIndex: team.orderIndex,
      roundResults,
      nightBonusScore: nightBonusSum,
      totalScore: overallScore,
      rank: 1, // Will be computed after sorting
      hasUnmarkedRounds,
    };
  });

  // Sort overall leaderboard: high total score first, then alphabetically by team name
  const sortedOverall = [...leaderboard].sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    return a.teamName.localeCompare(b.teamName);
  });

  // Assign joint ranks (e.g. 1, 2, 2, 4)
  let currentRank = 1;
  let previousScore: number | null = null;
  
  const overallRanked = sortedOverall.map((row, idx) => {
    if (previousScore !== null && row.totalScore !== previousScore) {
      currentRank = idx + 1;
    }
    previousScore = row.totalScore;
    return {
      ...row,
      rank: currentRank,
    };
  });

  // Sort overall ranked back by rank then name/orderIndex
  return overallRanked;
}

/**
 * Filters and transforms a detailed Question into a PresentationQuestion.
 * PresentationQuestion contains zero answerConfig details to prevent client leakage.
 */
export function derivePresentationQuestion(question: Question): PresentationQuestion {
  const presentationQ: PresentationQuestion = {
    id: question.id,
    roundId: question.roundId,
    orderIndex: question.orderIndex,
    type: question.type,
    prompt: question.prompt,
    points: question.points,
  };

  if (question.type === "multiple_choice" && question.answerConfig.type === "multiple_choice") {
    // Only map options without revealing which one is correct
    presentationQ.options = question.answerConfig.options.map((opt) => ({
      id: opt.id,
      label: opt.label,
      text: opt.text,
    }));
  }

  return presentationQ;
}

/**
 * Derives presentation-safe state for a round.
 * Answers are only included if `isRevealed` is true.
 */
export function derivePresentationRoundState(
  round: Round,
  questions: Question[],
  isRevealed: boolean
): PresentationRoundState {
  const presentationQuestions = questions
    .filter((q) => q.prompt.trim() !== "") // Skip empty questions
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map(derivePresentationQuestion);

  const state: PresentationRoundState = {
    id: round.id,
    title: round.title,
    orderIndex: round.orderIndex,
    type: round.type,
    questions: presentationQuestions,
    isRevealed,
    description: round.description ?? undefined,
    specialRoundConfig: round.specialRoundConfig ?? undefined,
  };

  if (isRevealed) {
    const answers: Record<string, any> = {};
    questions.forEach((q) => {
      if (q.type === "standard" && q.answerConfig.type === "standard") {
        answers[q.id] = {
          answer: q.answerConfig.answer,
          acceptableAnswers: q.answerConfig.acceptableAnswers ?? [],
        };
      } else if (q.type === "multipoint" && q.answerConfig.type === "multipoint") {
        answers[q.id] = {
          answers: q.answerConfig.answers,
        };
      } else if (q.type === "multiple_choice" && q.answerConfig.type === "multiple_choice") {
        const config = q.answerConfig as any;
        const correctOpt = config.options.find(
          (o: any) => o.id === config.correctOptionId
        );
        answers[q.id] = {
          correctOptionId: config.correctOptionId,
          correctOptionLabel: correctOpt?.label ?? "",
          correctOptionText: correctOpt?.text ?? "",
        };
      }
    });
    state.answers = answers;
  }

  return state;
}
