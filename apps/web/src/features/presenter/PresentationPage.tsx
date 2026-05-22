import React, { useState, useEffect, useRef } from "react";
import { Heading, Body, Surface, Stack, Button, Subtle } from "../../components/ui/primitives";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  EyeOff,
  Maximize,
  Minimize,
  Volume2,
  Tv,
  ArrowLeft,
  Layers,
  Award,
  HelpCircle,
  Trophy,
  Settings,
  X,
} from "lucide-react";
import { calculateLeaderboards, derivePresentationRoundState } from "@trivia/domain";

interface PresentationPageProps {
  triviaNightId: string;
  presentToken: string;
  editToken?: string | undefined; // Optional: If passed, presentation mode allows direct host controls (e.g. reveals)
  onExit: () => void;
}

type SlideType =
  | { type: "title" }
  | { type: "round_intro"; roundIndex: number }
  | { type: "question"; roundIndex: number; questionIndex: number }
  | { type: "question_recap"; roundIndex: number }
  | { type: "answer_walkthrough"; roundIndex: number; questionIndex: number }
  | { type: "answer_recap"; roundIndex: number }
  | { type: "round_leaderboard"; roundIndex: number }
  | { type: "overall_leaderboard"; upToRoundIndex: number }
  | { type: "tiebreakers" }
  | { type: "results" };

export const PresentationPage: React.FC<PresentationPageProps> = ({
  triviaNightId,
  presentToken,
  editToken,
  onExit,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trivia, setTrivia] = useState<any>(null);
  const [rounds, setRounds] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [tiebreakers, setTiebreakers] = useState<any[]>([]);
  
  // Real scores and bonuses for leaderboard calculations
  const [scoresList, setScoresList] = useState<any[]>([]);
  const [bonusScoresList, setBonusScoresList] = useState<any[]>([]);

  // Presentation State
  const [slides, setSlides] = useState<SlideType[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});
  const [showControls, setShowControls] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Slide presentation options & recap modal states
  const [includeQuestionRecaps, setIncludeQuestionRecaps] = useState(true);
  const [includeAnswerRecaps, setIncludeAnswerRecaps] = useState(true);
  const [showSettingsPopover, setShowSettingsPopover] = useState(false);
  const [recapModal, setRecapModal] = useState<{ type: "questions" | "answers"; roundIndex: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Use a ref to store the latest fetchPresentationData function to avoid stale closures in setInterval
  const fetchPresentationDataRef = useRef<any>(null);
  useEffect(() => {
    fetchPresentationDataRef.current = fetchPresentationData;
  });

  // Poll for host changes if we don't have edit access
  useEffect(() => {
    if (fetchPresentationDataRef.current) {
      fetchPresentationDataRef.current();
    }
    const interval = setInterval(() => {
      if (fetchPresentationDataRef.current) {
        fetchPresentationDataRef.current(true); // silent refresh
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [triviaNightId, presentToken]);

  // Bind keyboard navigation keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Space") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "h" || e.key === "H") {
        setShowControls((prev) => !prev);
      } else if (e.key === "f" || e.key === "F") {
        toggleFullScreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [slides, currentSlideIndex]);

  const fetchPresentationData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // 1. Fetch main presentation state
      const response = await fetch(`/api/trivia-nights/${triviaNightId}`, {
        headers: {
          "X-Trivia-Token": presentToken,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load presentation. Verification check failed.");
      }

      const data = await response.json();
      setTrivia(data.triviaNight);
      
      let clientRounds = data.rounds || [];
      if (data.questions && data.questions.length > 0) {
        clientRounds = clientRounds.map((r: any) => {
          const roundQ = data.questions.filter((q: any) => q.roundId === r.id);
          return derivePresentationRoundState(r, roundQ, !!r.answersRevealed);
        });
      }

      setRounds(clientRounds);
      setTeams(data.teams || []);
      setTiebreakers(data.tiebreakers || []);

      // 2. Fetch scores and bonuses to enable real leaderboard calculations
      const scoresRes = await fetch(`/api/trivia-nights/${triviaNightId}/leaderboards`, {
        headers: {
          "X-Trivia-Token": presentToken,
        },
      });

      if (scoresRes.ok) {
        const scoresData = await scoresRes.json();
        if (scoresData.scores) {
          setScoresList(scoresData.scores);
        }
        if (scoresData.bonusScores) {
          setBonusScoresList(scoresData.bonusScores);
        }
      }
    } catch (err) {
      console.error(err);
      if (!silent) setError(err instanceof Error ? err.message : "Error initializing presentation mode.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Rebuild the slide deck when rounds or presentation settings update
  useEffect(() => {
    if (rounds && rounds.length > 0) {
      buildSlideDeck(rounds, tiebreakers);
    }
  }, [rounds, tiebreakers, includeQuestionRecaps, includeAnswerRecaps]);

  // Compile slide navigation sequence
  const buildSlideDeck = (loadedRounds: any[], loadedTiebreakers: any[]) => {
    const deck: SlideType[] = [];

    // 1. Title Slide
    deck.push({ type: "title" });

    // Sort rounds by order index
    const sortedRounds = [...loadedRounds].sort((a, b) => a.orderIndex - b.orderIndex);

    sortedRounds.forEach((round, roundIdx) => {
      // 2. Round Intro
      deck.push({ type: "round_intro", roundIndex: roundIdx });

      // 3. Question-by-Question (only if not a special round)
      if (round.type !== "special_round" && round.questions && round.questions.length > 0) {
        round.questions.forEach((_: any, qIdx: number) => {
          deck.push({ type: "question", roundIndex: roundIdx, questionIndex: qIdx });
        });

        // 4. Question Recap
        if (includeQuestionRecaps) {
          deck.push({ type: "question_recap", roundIndex: roundIdx });
        }

        // 5. Answer Walkthrough (deliberate reveal slots)
        round.questions.forEach((_: any, qIdx: number) => {
          deck.push({ type: "answer_walkthrough", roundIndex: roundIdx, questionIndex: qIdx });
        });

        // 6. Answer Recap
        if (includeAnswerRecaps) {
          deck.push({ type: "answer_recap", roundIndex: roundIdx });
        }
      }

      // 7. Round Leaderboard
      deck.push({ type: "round_leaderboard", roundIndex: roundIdx });

      // 7b. Overall Leaderboard
      deck.push({ type: "overall_leaderboard", upToRoundIndex: roundIdx });
    });

    // 8. Tiebreakers
    if (loadedTiebreakers && loadedTiebreakers.length > 0) {
      deck.push({ type: "tiebreakers" });
    }

    // 9. Final Results Standings
    deck.push({ type: "results" });

    setSlides(deck);
    setCurrentSlideIndex((prev) => {
      if (prev >= deck.length) return 0;
      return prev;
    });
  };

  const handleNext = () => {
    setShowSettingsPopover(false);
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setShowSettingsPopover(false);
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
    }
  };

  const toggleFullScreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullScreen(true);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullScreen(false);
      });
    }
  };

  // Toggle correct answers reveal for slides
  const handleToggleReveal = (questionId: string) => {
    setRevealedAnswers((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  // Trigger server-side reveal endpoint if editor access is present
  const handleServerRevealRound = async (roundId: string, revealed: boolean) => {
    if (!editToken) return;

    try {
      const response = await fetch(`/api/rounds/${roundId}/reveal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Trivia-Token": editToken,
        },
        body: JSON.stringify({ revealed }),
      });

      if (response.ok) {
        // Optimistically update round reveal state locally
        setRounds((prev) =>
          prev.map((r) => (r.id === roundId ? { ...r, isRevealed: revealed, answers: revealed ? {} : undefined } : r))
        );
        fetchPresentationData(true); // Refresh answers content payload
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-presentation text-text-presentation text-lg">
        <div className="animate-spin mr-3 border-2 border-accent-info border-t-transparent rounded-full w-6 h-6"></div>
        Booting projection slide deck...
      </div>
    );
  }

  if (error || !trivia) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-surface-presentation">
        <Heading level={2} className="text-accent-danger mb-4">
          Presentation Load Error
        </Heading>
        <Body className="mb-6 max-w-md text-text-presentation">{error || "Failed to load deck data."}</Body>
        <Button onClick={onExit} variant="secondary">
          Exit Presentation
        </Button>
      </div>
    );
  }

  const activeSlide = slides[currentSlideIndex];

  // RENDER UTILITY SLIDE TEMPLATES
  const renderSlideContent = () => {
    if (!activeSlide) return null;

    switch (activeSlide.type) {
      case "title":
        return (
          <Stack align="center" gap="large" className="text-center max-w-4xl px-8 select-none py-12">
            <div className="text-accent-primary uppercase tracking-widest text-h3 font-display font-extrabold mb-2 animate-bounce">
              Welcome to
            </div>
            <Heading level={1} display={true} className="text-5xl md:text-7xl font-extrabold text-text-presentation leading-none font-display">
              {trivia.title}
            </Heading>
            {trivia.subtitle && (
              <Heading level={2} className="text-2xl md:text-3xl text-text-secondary font-sans font-medium mt-2">
                {trivia.subtitle}
              </Heading>
            )}
            <div className="border-t border-white/10 w-48 my-8"></div>
            <Stack gap="small" align="center" className="text-text-secondary text-lg font-semibold font-sans">
              {trivia.venue && (
                <div className="flex items-center gap-2">
                  <span>📍</span> {trivia.venue}
                </div>
              )}
              {trivia.date && (
                <div className="flex items-center gap-2">
                  <span>📅</span> {trivia.date}
                </div>
              )}
            </Stack>

            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl max-w-md mt-6">
              <Subtle className="text-text-secondary">
                📄 Teams will answer on paper answer sheets. Prepare your pens and select your team captains!
              </Subtle>
            </div>
          </Stack>
        );

      case "round_intro": {
        const round = rounds[activeSlide.roundIndex];
        return (
          <Stack align="center" gap="large" className="text-center max-w-3xl px-8 select-none py-12">
            <span className="text-accent-primary text-h2 uppercase tracking-widest font-extrabold font-display">
              Get Ready
            </span>
            <Heading level={1} display={true} className="text-6xl md:text-8xl text-text-presentation leading-none font-display uppercase tracking-tight">
              {round?.title}
            </Heading>
            {round?.type === "special_round" && (
              <span className="text-caption bg-accent-warning/10 text-accent-warning border border-accent-warning/20 px-3 py-1 rounded-full font-bold">
                Special Activity Round
              </span>
            )}
            <div className="border-b border-white/10 w-32 my-6"></div>
            <Body className="text-text-secondary text-xl font-medium max-w-lg">
              {round?.type === "special_round"
                ? "This round is a special challenge. Listen closely to the host for instructions!"
                : `This round contains ${round?.questions?.length || 0} questions. Write your answers on the Round ${activeSlide.roundIndex + 1} Answer Sheet.`}
            </Body>
          </Stack>
        );
      }

      case "question": {
        const round = rounds[activeSlide.roundIndex];
        const question = round?.questions?.[activeSlide.questionIndex];
        return (
          <Stack align="stretch" gap="large" className="w-full max-w-5xl px-12 select-none">
            <div className="flex justify-between items-center border-b border-white/10 pb-6 mb-6">
              <div>
                <span className="text-accent-primary text-h4 font-display font-extrabold uppercase tracking-wider block">
                  {round?.title}
                </span>
                <span className="text-text-secondary text-caption font-semibold mt-1">
                  Question {question?.orderIndex} of {round?.questions?.length || 0}
                </span>
              </div>
              <span className="text-text-presentation text-h4 font-mono font-bold px-3 py-1 bg-white/5 border border-white/10 rounded-xl">
                {question?.points} {question?.points === 1 ? "pt" : "pts"}
              </span>
            </div>

            <Heading level={1} display={false} className="text-3xl md:text-5xl font-bold font-sans text-text-presentation leading-relaxed">
              {question?.prompt}
            </Heading>

            {/* Render Multiple Choice Options */}
            {question?.type === "multiple_choice" && question.options && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                {question.options.map((opt: any) => (
                  <Surface
                    key={opt.id}
                    variant="raised"
                    className="p-5 flex items-center gap-4 bg-white/5 border border-white/10 shadow-lg"
                  >
                    <span className="w-10 h-10 rounded-xl bg-accent-primary text-text-on-accent font-mono font-extrabold text-lg flex items-center justify-center shrink-0">
                      {opt.label}
                    </span>
                    <span className="text-text-presentation text-lg font-semibold font-sans">
                      {opt.text}
                    </span>
                  </Surface>
                ))}
              </div>
            )}
          </Stack>
        );
      }

      case "question_recap": {
        const round = rounds[activeSlide.roundIndex];
        return (
          <Stack align="stretch" gap="large" className="w-full max-w-6xl px-8 select-none py-6">
            <div className="border-b border-white/10 pb-4 mb-4 flex justify-between items-end">
              <div>
                <span className="text-accent-primary text-h3 font-display font-extrabold uppercase tracking-wide">
                  Round Recap
                </span>
                <Heading level={2} className="text-text-presentation text-2xl font-bold mt-1">
                  {round?.title} — Review Questions
                </Heading>
              </div>
              <span className="text-caption text-text-secondary bg-white/5 px-3 py-1 rounded-lg border border-white/10 font-medium">
                Answer sheets due soon!
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[60vh] pr-2">
              {round?.questions
                ?.sort((a: any, b: any) => a.orderIndex - b.orderIndex)
                .map((q: any) => (
                  <Surface
                    key={q.id}
                    variant="sunken"
                    className="p-4 bg-white/5 border border-white/10 flex items-start gap-4"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-accent-primary font-mono shrink-0">
                      {q.orderIndex}
                    </div>
                    <div className="overflow-hidden">
                      <Body className="text-text-presentation font-semibold text-body-sm leading-normal line-clamp-3">
                        {q.prompt}
                      </Body>
                      {q.type === "multiple_choice" && q.options && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {q.options.map((o: any) => (
                            <span key={o.id} className="text-body-xs font-semibold px-2 py-0.5 bg-white/5 rounded border border-white/10 text-text-secondary">
                              {o.label}: {o.text}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Surface>
                ))}
            </div>
          </Stack>
        );
      }

      case "answer_walkthrough": {
        const round = rounds[activeSlide.roundIndex];
        const question = round?.questions?.[activeSlide.questionIndex];
        const hasAnswersPayload = !!round?.isRevealed && !!round?.answers;
        const answerData = hasAnswersPayload ? round.answers[question?.id] : null;
        const isSelfRevealed = revealedAnswers[question?.id] || false;

        return (
          <Stack align="stretch" gap="large" className="w-full max-w-5xl px-12 select-none">
            <div className="flex justify-between items-center border-b border-white/10 pb-6 mb-6">
              <div>
                <span className="text-accent-success text-h4 font-display font-extrabold uppercase tracking-wider block">
                  Answers Reveal Walkthrough
                </span>
                <span className="text-text-secondary text-caption font-semibold mt-1">
                  Question {question?.orderIndex} of {round?.questions?.length || 0}
                </span>
              </div>
              <span className="text-text-presentation text-h4 font-mono font-bold px-3 py-1 bg-white/5 border border-white/10 rounded-xl">
                {question?.points} {question?.points === 1 ? "pt" : "pts"}
              </span>
            </div>

            <Heading level={1} display={false} className="text-2xl md:text-4xl font-bold font-sans text-text-presentation mb-4 leading-normal">
              {question?.prompt}
            </Heading>

            {/* Answer Display Grid */}
            <div className="mt-6 flex flex-col items-center">
              {isSelfRevealed ? (
                <Surface variant="overlay" className="w-full p-8 border-accent-success/30 bg-accent-success/5 animate-fade-in shadow-2xl flex flex-col items-center justify-center min-h-48">
                  <span className="text-accent-success uppercase tracking-widest text-caption font-bold mb-3">
                    Correct Answer
                  </span>
                  
                  {/* Multipoint answer block */}
                  {question?.type === "multipoint" && answerData?.answers ? (
                    <div className="flex flex-col gap-2 w-full max-w-md">
                      {answerData.answers.map((ans: string, idx: number) => (
                        <div key={idx} className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl font-semibold text-text-presentation text-lg text-center">
                          {ans}
                        </div>
                      ))}
                    </div>
                  ) : question?.type === "multiple_choice" && answerData ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center gap-4">
                        <span className="w-16 h-16 rounded-2xl bg-accent-success text-text-on-accent font-mono font-extrabold text-3xl flex items-center justify-center shrink-0">
                          {answerData.correctOptionLabel}
                        </span>
                        <Heading level={2} className="text-3xl text-text-presentation font-sans font-bold">
                          {answerData.correctOptionText}
                        </Heading>
                      </div>
                    </div>
                  ) : (
                    <Heading level={1} className="text-3xl md:text-5xl text-accent-success font-display font-extrabold text-center leading-none">
                      {answerData?.answer || "[Answer Hidden]"}
                    </Heading>
                  )}

                  {question?.type === "standard" && answerData?.acceptableAnswers?.length > 0 && (
                    <div className="mt-4 text-center">
                      <Subtle className="block mb-1 text-text-secondary font-semibold text-caption">Also Acceptable:</Subtle>
                      <span className="text-text-secondary font-sans font-medium text-lg">
                        {answerData.acceptableAnswers.join(", ")}
                      </span>
                    </div>
                  )}
                </Surface>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 border border-dashed border-white/20 rounded-2xl w-full min-h-48 bg-white/5 shadow-inner">
                  <HelpCircle size={48} className="text-text-subtle mb-4 animate-pulse" />
                  <Button
                    onClick={() => handleToggleReveal(question?.id)}
                    variant="primary"
                    size="large"
                    icon={<Eye size={18} />}
                    className="shadow-accent-primary/20 scale-105"
                  >
                    Reveal Answer
                  </Button>
                </div>
              )}
            </div>

            {/* Quick Helper to let the presenter Reveal all correct options or toggle standard state */}
            {editToken && !round?.isRevealed && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => handleServerRevealRound(round.id, true)}
                  className="px-4 py-2 border border-white/10 hover:border-accent-success rounded-xl bg-white/5 text-text-secondary hover:text-accent-success text-body-sm font-semibold transition-colors cursor-pointer"
                >
                  🔒 Unlock Answers Data on Screen (Requires Host Key)
                </button>
              </div>
            )}
          </Stack>
        );
      }

      case "answer_recap": {
        const round = rounds[activeSlide.roundIndex];
        const hasAnswersPayload = !!round?.isRevealed && !!round?.answers;
        return (
          <Stack align="stretch" gap="large" className="w-full max-w-6xl px-8 select-none py-6">
            <div className="border-b border-white/10 pb-4 mb-4 flex justify-between items-end">
              <div>
                <span className="text-accent-success text-h3 font-display font-extrabold uppercase tracking-wide">
                  Round Answers Recap
                </span>
                <Heading level={2} className="text-text-presentation text-2xl font-bold mt-1">
                  {round?.title} — Solutions Grid
                </Heading>
              </div>
              <span className="text-caption text-accent-success bg-accent-success/15 px-3 py-1 rounded-lg border border-accent-success/20 font-bold">
                Review complete round scoring details
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[60vh] pr-2">
              {round?.questions
                ?.sort((a: any, b: any) => a.orderIndex - b.orderIndex)
                .map((q: any) => {
                  const ansData = hasAnswersPayload ? round.answers[q.id] : null;
                  return (
                    <Surface
                      key={q.id}
                      variant="raised"
                      className="p-4 bg-white/5 border border-white/10 flex items-start gap-4"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-accent-success font-mono shrink-0">
                        {q.orderIndex}
                      </div>
                      <div className="overflow-hidden w-full">
                        <Body className="text-text-secondary font-semibold text-body-xs line-clamp-2 leading-tight">
                          {q.prompt}
                        </Body>
                        <div className="mt-2 text-accent-success font-semibold text-body-sm font-sans truncate">
                          {q.type === "multipoint" && ansData?.answers ? (
                            ansData.answers.join(" • ")
                          ) : q.type === "multiple_choice" && ansData ? (
                            `${ansData.correctOptionLabel} — ${ansData.correctOptionText}`
                          ) : (
                            ansData?.answer || "[Click walkthrough to reveal]"
                          )}
                        </div>
                      </div>
                    </Surface>
                  );
                })}
            </div>
          </Stack>
        );
      }

      case "round_leaderboard": {
        const round = rounds[activeSlide.roundIndex];
        // Calculate leaderboard standings from teams
        const overallRanked = computedLeaderboard;
        // Let's sort teams by this round's results specifically to show the round leaderboard!
        const roundScoresSorted = [...overallRanked]
          .map((row) => {
            const roundRes = row.roundResults.find((r) => r.roundId === round.id);
            const score = roundRes ? roundRes.totalRoundScore : null;
            return {
              ...row,
              roundScore: score,
            };
          })
          .sort((a, b) => {
            const scoreA = a.roundScore ?? -1;
            const scoreB = b.roundScore ?? -1;
            if (scoreB !== scoreA) return scoreB - scoreA;
            return a.teamName.localeCompare(b.teamName);
          });

        // Assign ranks
        let currentRank = 1;
        let prevScore: number | null = null;
        const rankedRoundRows = roundScoresSorted.map((row, idx) => {
          const score = row.roundScore ?? 0;
          if (prevScore !== null && score !== prevScore) {
            currentRank = idx + 1;
          }
          prevScore = score;
          return {
            ...row,
            roundRank: currentRank,
          };
        });

        return (
          <Stack align="stretch" gap="large" className="w-full max-w-4xl px-8 select-none py-6">
            <div className="text-center mb-6">
              <span className="text-accent-primary text-h3 uppercase tracking-widest font-extrabold font-display">
                Leaderboard Standings
              </span>
              <Heading level={1} className="text-4xl md:text-5xl text-text-presentation font-bold font-display mt-1">
                {round?.title} Results
              </Heading>
            </div>

            <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-2">
              {rankedRoundRows.map((row) => (
                <div
                  key={row.teamId}
                  className="flex justify-between items-center p-4 bg-white/5 border border-white/10 rounded-2xl shadow-lg"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-10 text-center font-bold font-mono text-accent-info text-xl">
                      {row.roundRank}.
                    </span>
                    <span className="text-text-presentation text-xl font-bold font-sans">
                      {row.teamName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {row.roundScore === null ? (
                      <span className="text-caption text-body-xs font-bold text-accent-warning bg-accent-warning/15 px-2 py-0.5 rounded border border-accent-warning/20">
                        Unmarked
                      </span>
                    ) : (
                      <span className="text-text-presentation text-xl font-extrabold font-mono text-accent-primary">
                        {row.roundScore} pts
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {teams.length === 0 && (
                <div className="text-center text-text-subtle py-8">
                  No team scores are configured yet.
                </div>
              )}
            </div>
          </Stack>
        );
      }

      case "overall_leaderboard": {
        const sortedRounds = [...rounds].sort((a, b) => a.orderIndex - b.orderIndex);
        const upToRoundIdx = activeSlide.upToRoundIndex;

        // Filter rounds up to this round index
        const roundsFiltered = sortedRounds.slice(0, upToRoundIdx + 1);
        const roundIdsFiltered = new Set(roundsFiltered.map((r) => r.id));

        // Filter scores for only the active rounds
        const scoresFiltered = scoresList.filter((s) => roundIdsFiltered.has(s.roundId));

        // Filter bonus scores: round-level bonuses must belong to the active rounds.
        // Night-level bonuses (no roundId) are only included if this is the final round.
        const bonusScoresFiltered = bonusScoresList.filter((b) => {
          if (b.roundId) {
            return roundIdsFiltered.has(b.roundId);
          }
          // Night bonus
          return upToRoundIdx === sortedRounds.length - 1;
        });

        const overallRanked = calculateLeaderboards(
          teams,
          roundsFiltered,
          scoresFiltered,
          bonusScoresFiltered
        );

        return (
          <Stack align="stretch" gap="large" className="w-full max-w-4xl px-8 select-none py-6">
            <div className="text-center mb-6">
              <span className="text-accent-primary text-h3 uppercase tracking-widest font-extrabold font-display">
                Trivia Night Standings
              </span>
              <Heading level={1} className="text-4xl md:text-5xl text-text-presentation font-bold font-display mt-1">
                Overall Leaderboard
              </Heading>
              <div className="text-text-secondary text-caption font-semibold mt-2">
                Cumulative standings up to {roundsFiltered[roundsFiltered.length - 1]?.title || `Round ${upToRoundIdx + 1}`}
              </div>
            </div>

            <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-2">
              {overallRanked.map((row) => (
                <div
                  key={row.teamId}
                  className="flex justify-between items-center p-4 bg-white/5 border border-white/10 rounded-2xl shadow-lg"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-10 text-center font-bold font-mono text-accent-info text-xl">
                      {row.rank}.
                    </span>
                    <span className="text-text-presentation text-xl font-bold font-sans">
                      {row.teamName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 font-semibold text-lg">
                    {row.hasUnmarkedRounds && (
                      <span className="text-caption text-body-xs font-bold text-accent-warning bg-accent-warning/15 px-2 py-0.5 rounded border border-accent-warning/20">
                        Incomplete
                      </span>
                    )}
                    <span className="text-text-presentation text-xl font-extrabold font-mono text-accent-primary">
                      {row.totalScore} pts
                    </span>
                  </div>
                </div>
              ))}
              {teams.length === 0 && (
                <div className="text-center text-text-subtle py-8">
                  No team scores are configured yet.
                </div>
              )}
            </div>
          </Stack>
        );
      }

      case "tiebreakers":
        return (
          <Stack align="stretch" gap="large" className="w-full max-w-4xl px-8 select-none py-6">
            <div className="text-center mb-6">
              <span className="text-accent-warning text-h3 uppercase tracking-widest font-extrabold font-display">
                Resolve Standing Order
              </span>
              <Heading level={1} className="text-4xl md:text-5xl text-text-presentation font-bold font-display mt-1">
                Tiebreaker Challenges
              </Heading>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto max-h-[50vh] pr-2">
              {tiebreakers
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((tb, idx) => {
                  const isRevealed = revealedAnswers[tb.id] || false;
                  return (
                    <Surface
                      key={tb.id}
                      variant="raised"
                      className="p-6 bg-white/5 border border-white/10 flex flex-col gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-accent-warning font-bold font-mono text-lg">
                          TB #{idx + 1}
                        </span>
                        <Body className="text-text-presentation font-semibold text-lg">
                          {tb.prompt}
                        </Body>
                      </div>

                      <div className="flex justify-end mt-2">
                        {isRevealed ? (
                          <div className="px-4 py-2 bg-accent-success/15 border border-accent-success/30 rounded-xl text-accent-success font-mono font-bold text-lg">
                            Answer: {tb.answer || "N/A"}
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleToggleReveal(tb.id)}
                            variant="secondary"
                            size="small"
                            icon={<Eye size={14} />}
                          >
                            Reveal TB Answer
                          </Button>
                        )}
                      </div>
                    </Surface>
                  );
                })}
            </div>
          </Stack>
        );

      case "results": {
        const overallRanked = computedLeaderboard;
        const winner = overallRanked[0];
        return (
          <Stack align="center" gap="large" className="text-center max-w-4xl px-8 select-none py-12">
            <div className="w-24 h-24 bg-accent-primary/20 text-accent-primary rounded-full flex items-center justify-center border-2 border-accent-primary mb-2 shadow-2xl shadow-accent-primary/30 animate-pulse">
              <Trophy size={48} />
            </div>

            <span className="text-accent-primary text-h2 uppercase tracking-widest font-extrabold font-display">
              Congratulations!
            </span>

            {winner ? (
              <Stack gap="small" align="center">
                <Subtle className="text-lg">The absolute champion is:</Subtle>
                <Heading level={1} display={true} className="text-6xl md:text-8xl text-text-presentation leading-none font-display uppercase tracking-tight text-accent-primary">
                  {winner.teamName}
                </Heading>
                <span className="text-text-presentation text-2xl font-bold font-sans mt-3">
                  Winning Score: {winner.totalScore} points
                </span>
              </Stack>
            ) : (
              <Heading level={1} display={true} className="text-5xl text-text-presentation">
                Thank you for playing!
              </Heading>
            )}

            <div className="border-t border-white/10 w-48 my-8"></div>
            <Body className="text-text-secondary text-lg">
              We hope you enjoyed the event. Drive safe!
            </Body>
          </Stack>
        );
      }

      default:
        return null;
    }
  };

  const computedLeaderboard = calculateLeaderboards(teams, rounds, scoresList, bonusScoresList);

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex flex-col bg-surface-presentation text-text-presentation select-none overflow-hidden relative"
      style={{
        backgroundImage: "radial-gradient(circle at center, rgba(18, 22, 33, 0.95) 0%, rgba(9, 11, 16, 0.98) 100%)",
      }}
    >
      {/* Dynamic slide backdrop decorative ambient grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none -z-10"></div>

      {/* Header bar - visible only with controller */}
      {showControls && (
        <header className="absolute top-0 inset-x-0 px-6 py-4 flex items-center justify-between z-40 bg-gradient-to-b from-black/80 to-transparent">
          <Stack direction="row" gap="default" align="center">
            <Button variant="ghost" size="small" icon={<ArrowLeft size={16} />} onClick={onExit} className="text-text-secondary hover:text-text-presentation">
              Exit
            </Button>
            <div className="border-r border-white/10 h-5"></div>
            <Subtle className="text-text-secondary font-semibold font-display">
              {trivia.title} Projection View
            </Subtle>
          </Stack>

          <Stack direction="row" gap="small" align="center">
            <Button
              variant="ghost"
              size="small"
              icon={<RefreshCw size={14} />}
              onClick={() => fetchPresentationData(false)}
              title="Refresh State"
            />
            <Button
              variant="ghost"
              size="small"
              icon={isFullScreen ? <Minimize size={14} /> : <Maximize size={14} />}
              onClick={toggleFullScreen}
              title="Fullscreen (F)"
            />
          </Stack>
        </header>
      )}

      {/* CORE ACTIVE SLIDE VIEW */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="transition-all duration-300 w-full flex justify-center">
          {renderSlideContent()}
        </div>
      </div>

      {/* FLOATING CONTROLLER BAR */}
      {showControls && (
        <div className="absolute bottom-6 inset-x-0 flex justify-center z-40 px-4">
          <Surface
            variant="overlay"
            glass={true}
            className="px-6 py-3 border border-white/10 bg-black/90 flex items-center gap-6 rounded-2xl shadow-2xl backdrop-blur-2xl animate-fade-in"
          >
            <Button
              variant="ghost"
              size="small"
              onClick={handlePrev}
              disabled={currentSlideIndex === 0}
              icon={<ChevronLeft size={18} />}
              className="text-text-secondary hover:text-text-presentation"
            />

            <span className="text-body-sm font-semibold font-mono text-text-secondary tracking-wider">
              SLIDE {currentSlideIndex + 1} OF {slides.length}
            </span>

            <Button
              variant="ghost"
              size="small"
              onClick={handleNext}
              disabled={currentSlideIndex === slides.length - 1}
              icon={<ChevronRight size={18} />}
              className="text-text-secondary hover:text-text-presentation"
            />

            <div className="border-r border-white/20 h-6"></div>

            {/* Quick Recap Action Buttons (Active for regular rounds) */}
            {activeSlide &&
              ("roundIndex" in activeSlide) &&
              rounds[activeSlide.roundIndex]?.type !== "special_round" && (
                <>
                  <button
                    onClick={() => setRecapModal({ type: "questions", roundIndex: activeSlide.roundIndex })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/30 text-body-xs font-bold text-text-presentation transition-all cursor-pointer shadow-md select-none"
                    title="Quick recap of all questions in this round"
                  >
                    📋 Recap Questions
                  </button>
                  <button
                    onClick={() => setRecapModal({ type: "answers", roundIndex: activeSlide.roundIndex })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/30 text-body-xs font-bold text-text-presentation transition-all cursor-pointer shadow-md select-none"
                    title="Quick recap of all answers in this round"
                  >
                    🔑 Recap Answers
                  </button>
                  <div className="border-r border-white/20 h-6"></div>
                </>
              )}

            {/* Presentation Options Dropup */}
            <div className="relative">
              <button
                onClick={() => setShowSettingsPopover(!showSettingsPopover)}
                className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                  showSettingsPopover
                    ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                    : "border-white/15 bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-presentation"
                }`}
                title="Slide Settings"
              >
                <Settings size={18} />
              </button>

              {showSettingsPopover && (
                <div className="absolute bottom-full right-0 mb-3 w-72 p-4 bg-black/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-2xl flex flex-col gap-4 animate-fade-in z-50">
                  <span className="text-body-xs font-extrabold uppercase tracking-wider text-accent-primary font-display">
                    Presentation Options
                  </span>
                  
                  <div className="flex flex-col gap-3">
                    <label className="flex items-start gap-3 cursor-pointer text-left select-none group">
                      <input
                        type="checkbox"
                        checked={includeQuestionRecaps}
                        onChange={(e) => setIncludeQuestionRecaps(e.target.checked)}
                        className="mt-0.5 rounded border-white/20 bg-white/5 text-accent-primary focus:ring-accent-primary cursor-pointer w-4 h-4"
                      />
                      <div>
                        <span className="text-body-xs font-bold text-text-presentation group-hover:text-accent-primary transition-colors block">
                          Include Question Recaps
                        </span>
                        <span className="text-[10px] text-text-secondary leading-normal block mt-0.5">
                          Show a slide summarizing all questions before the answers walkthrough.
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer text-left select-none group">
                      <input
                        type="checkbox"
                        checked={includeAnswerRecaps}
                        onChange={(e) => setIncludeAnswerRecaps(e.target.checked)}
                        className="mt-0.5 rounded border-white/20 bg-white/5 text-accent-primary focus:ring-accent-primary cursor-pointer w-4 h-4"
                      />
                      <div>
                        <span className="text-body-xs font-bold text-text-presentation group-hover:text-accent-primary transition-colors block">
                          Include Answer Recaps
                        </span>
                        <span className="text-[10px] text-text-secondary leading-normal block mt-0.5">
                          Show a slide summarizing all solutions at the very end of the round.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="border-r border-white/20 h-6"></div>

            <span className="text-caption text-body-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded text-text-subtle font-mono font-bold">
              Keys: ← / → / Space
            </span>

            <button
              onClick={() => setShowControls(false)}
              className="text-body-xs font-semibold text-text-subtle hover:text-text-presentation transition-colors bg-transparent border-0 cursor-pointer"
              title="Hide controls. Press H to restore."
            >
              Hide Panel
            </button>
          </Surface>
        </div>
      )}

      {/* Little floating icon button to restore controller when hidden */}
      {!showControls && (
        <button
          onClick={() => setShowControls(true)}
          className="absolute bottom-4 right-4 p-2.5 rounded-xl border border-white/15 bg-black/80 hover:bg-black text-text-secondary hover:text-text-presentation cursor-pointer z-40 transition-all opacity-40 hover:opacity-100 shadow-xl"
          title="Show Controls (H)"
        >
          <Tv size={16} />
        </button>
      )}

      {/* ON-DEMAND RECAP MODAL OVERLAY */}
      {recapModal && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-fade-in">
          <div className="w-full max-w-4xl bg-black/90 border border-white/10 rounded-3xl p-8 flex flex-col shadow-2xl max-h-[85vh] relative overflow-hidden">
            {/* Close Button */}
            <button
              onClick={() => setRecapModal(null)}
              className="absolute top-6 right-6 p-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-presentation cursor-pointer transition-all shadow-md"
              title="Close Recap"
            >
              <X size={18} />
            </button>

            {/* Modal Header */}
            <div className="border-b border-white/10 pb-4 mb-6 pr-12">
              <span className="text-accent-primary text-caption font-extrabold uppercase tracking-widest block font-sans">
                Round {recapModal.roundIndex + 1} Recap
              </span>
              <Heading level={1} className="text-3xl font-extrabold text-text-presentation font-display mt-1">
                {rounds[recapModal.roundIndex]?.title} — All {recapModal.type === "questions" ? "Questions" : "Answers"}
              </Heading>
            </div>

            {/* Modal Content Scroll Area */}
            <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4">
              {rounds[recapModal.roundIndex]?.questions
                ?.sort((a: any, b: any) => a.orderIndex - b.orderIndex)
                .map((q: any) => {
                  const hasAnswersPayload = !!rounds[recapModal.roundIndex]?.isRevealed && !!rounds[recapModal.roundIndex]?.answers;
                  const ansData = hasAnswersPayload ? rounds[recapModal.roundIndex].answers[q.id] : null;

                  return (
                    <Surface
                      key={q.id}
                      variant="raised"
                      className="p-5 bg-white/5 border border-white/10 flex items-start gap-4 rounded-2xl shadow-lg transition-transform hover:translate-x-1 duration-150"
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold font-mono text-base shrink-0 ${
                        recapModal.type === "answers" 
                          ? "bg-accent-success/15 text-accent-success border border-accent-success/20"
                          : "bg-accent-primary/15 text-accent-primary border border-accent-primary/20"
                      }`}>
                        {q.orderIndex}
                      </div>

                      <div className="overflow-hidden w-full flex flex-col gap-2">
                        <Body className="text-text-presentation font-bold text-base leading-snug font-sans">
                          {q.prompt}
                        </Body>

                        {/* If multiple choice question and recapType is questions, show options */}
                        {recapModal.type === "questions" && q.type === "multiple_choice" && q.options && (
                          <div className="flex flex-wrap gap-2.5 mt-1">
                            {q.options.map((o: any) => (
                              <span key={o.id} className="text-body-xs font-semibold px-2.5 py-1 bg-white/5 rounded-lg border border-white/10 text-text-secondary font-sans">
                                <span className="text-accent-primary font-mono font-bold mr-1.5">{o.label}</span>
                                {o.text}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Show answers only for answers recap type */}
                        {recapModal.type === "answers" && (
                          <div className="mt-2 flex items-center">
                            {ansData ? (
                              <div className="flex flex-col gap-1 w-full">
                                <span className="text-[10px] text-accent-success uppercase tracking-wider font-extrabold font-display font-sans">
                                  Correct Answer
                                </span>
                                <span className="text-accent-success font-bold text-base font-sans leading-none mt-0.5">
                                  {q.type === "multipoint" && ansData.answers ? (
                                    ansData.answers.join(" • ")
                                  ) : q.type === "multiple_choice" && ansData ? (
                                    `${ansData.correctOptionLabel} — ${ansData.correctOptionText}`
                                  ) : (
                                    ansData.answer || "N/A"
                                  )}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 px-3 py-1 bg-accent-warning/10 border border-accent-warning/20 rounded-lg text-accent-warning text-body-xs font-semibold select-none font-sans">
                                <span>🔒</span> Answers not yet unlocked by host
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </Surface>
                  );
                })}
              
              {(!rounds[recapModal.roundIndex]?.questions || rounds[recapModal.roundIndex].questions.length === 0) && (
                <div className="text-center text-text-secondary py-12 font-medium">
                  No questions in this round.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-white/10 pt-4 mt-6 flex justify-end">
              <Button onClick={() => setRecapModal(null)} variant="secondary">
                Close Recap
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
