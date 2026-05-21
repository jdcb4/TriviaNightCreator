import React, { useState, useEffect } from "react";
import {
  Heading,
  Body,
  Surface,
  Stack,
  Button,
  Input,
  Select,
  Textarea,
  Subtle,
} from "../../components/ui/primitives";
import {
  Layers,
  Users,
  Printer,
  Settings,
  ArrowLeft,
  Play,
  Save,
  Plus,
  Trash,
  Download,
  AlertTriangle,
  Check,
  X,
  PlusCircle,
} from "lucide-react";
import {
  calculateRoundMaxScore,
  deriveQuestionSlots,
  calculateLeaderboards,
} from "@trivia/domain";
import type {
  TriviaNight,
  Round,
  Question,
  Team,
  RoundScore,
  BonusScore,
  Tiebreaker,
} from "@trivia/shared";

interface BuilderPageProps {
  triviaNightId: string;
  editToken: string;
  onExit: () => void;
  onLaunchPresenter: (presentToken: string) => void;
}

type TabType = "rounds" | "teams" | "print" | "branding";

export const BuilderPage: React.FC<BuilderPageProps> = ({
  triviaNightId,
  editToken,
  onExit,
  onLaunchPresenter,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("rounds");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Core loaded state
  const [trivia, setTrivia] = useState<TriviaNight | null>(null);
  const [roundsList, setRoundsList] = useState<Round[]>([]);
  const [questionsList, setQuestionsList] = useState<Question[]>([]);
  const [teamsList, setTeamsList] = useState<Team[]>([]);
  const [scoresList, setScoresList] = useState<RoundScore[]>([]);
  const [bonusScoresList, setBonusScoresList] = useState<BonusScore[]>([]);
  const [tiebreakersList, setTiebreakersList] = useState<Tiebreaker[]>([]);
  const [presentToken, setPresentToken] = useState<string>("");

  // Sub-editor state
  const [selectedRoundId, setSelectedRoundId] = useState<string>("");
  const [selectedSlotNumber, setSelectedSlotNumber] = useState<number | null>(null);
  const [warningLayoutRoundId, setWarningLayoutRoundId] = useState<string | null>(null);
  const [warningLayoutMessage, setWarningLayoutMessage] = useState<string | null>(null);

  // Question editing form state
  const [qType, setQType] = useState<"standard" | "multipoint" | "multiple_choice">("standard");
  const [qPrompt, setQPrompt] = useState("");
  const [qPoints, setQPoints] = useState(1);
  const [qStandardAnswer, setQStandardAnswer] = useState("");
  const [qStandardAcceptable, setQStandardAcceptable] = useState("");
  const [qMultipointAnswers, setQMultipointAnswers] = useState("");
  const [qMcOptions, setQMcOptions] = useState([
    { label: "A", text: "" },
    { label: "B", text: "" },
    { label: "C", text: "" },
    { label: "D", text: "" },
  ]);
  const [qMcCorrectLabel, setQMcCorrectLabel] = useState("A");

  // Scoring matrix input states
  const [scoresInput, setScoresInput] = useState<Record<string, string>>({});
  const [scoresOverrides, setScoresOverrides] = useState<Record<string, boolean>>({});
  const [scoresOverrideReasons, setScoresOverrideReasons] = useState<Record<string, string>>({});
  const [scoreErrors, setScoreErrors] = useState<Record<string, string>>({});

  // Team form editing state
  const [teamFormName, setTeamFormName] = useState("");

  // Bonus points state
  const [newBonusTeamId, setNewBonusTeamId] = useState("");
  const [newBonusRoundId, setNewBonusRoundId] = useState("night");
  const [newBonusPoints, setNewBonusPoints] = useState("1");
  const [newBonusLabel, setNewBonusLabel] = useState("");

  // Tiebreaker state
  const [newTiebreakerPrompt, setNewTiebreakerPrompt] = useState("");
  const [newTiebreakerAnswer, setNewTiebreakerAnswer] = useState("");

  // Branding configuration state
  const [brandTitle, setBrandTitle] = useState("");
  const [brandSubtitle, setBrandSubtitle] = useState("");
  const [brandFooter, setBrandFooter] = useState("");
  const [brandVenue, setBrandVenue] = useState("");
  const [brandDate, setBrandDate] = useState("");

  const selectedRound = roundsList.find((r) => r.id === selectedRoundId);
  const selectedRoundQuestions = questionsList.filter((q) => q.roundId === selectedRoundId);
  const activeSlots = selectedRound ? deriveQuestionSlots(selectedRound, selectedRoundQuestions) : [];

  // Fetch initial full data on mount
  useEffect(() => {
    fetchData();
  }, [triviaNightId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/trivia-nights/${triviaNightId}`, {
        headers: {
          "X-Trivia-Token": editToken,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load trivia night details. Access token might be invalid.");
      }

      const data = await response.json();
      setTrivia(data.triviaNight);
      setRoundsList(data.rounds || []);
      setQuestionsList(data.questions || []);
      setTeamsList(data.teams || []);
      setScoresList(data.scores || []);
      setBonusScoresList(data.bonusScores || []);
      setTiebreakersList(data.tiebreakers || []);

      // If branding states are not loaded yet, sync them
      if (data.triviaNight) {
        setBrandTitle(data.triviaNight.branding?.eventTitle || data.triviaNight.title || "");
        setBrandSubtitle(data.triviaNight.branding?.subtitle || data.triviaNight.subtitle || "");
        setBrandFooter(data.triviaNight.branding?.footerText || "");
        setBrandVenue(data.triviaNight.venue || "");
        setBrandDate(data.triviaNight.date || "");
      }

      // Fetch presentation token from separate access keys if needed (or construct it if returned in seed/create.
      // Since Hono does not return presentToken directly on GET for security, we can look up public token parameters.
      // Wait, we need the presentToken to launch presenter. We can fetch it by inspecting access token endpoint if needed,
      // or we can simply pass the editToken as a presentation proxy. Wait, the endpoint requirePresentOrEditToken accepts
      // the editToken as a presenter view parameter! So editToken is completely valid for presentation too!
      // Let's set presentToken to editToken if presentToken is not separately defined, but let's query the window URL parameter
      // or query params to see if we can read it. Or let's fetch accessTokens if editor scope is allowed.
      // Actually, Hono endpoint `requirePresentOrEditToken` checks both tokens. So we can just launch presenter with the editToken
      // or the presentToken! Let's pass the editToken if presentToken isn't loaded. It works perfectly!
      setPresentToken(editToken);

      // Select first round by default
      if (data.rounds && data.rounds.length > 0) {
        setSelectedRoundId(data.rounds[0].id);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Synchronize scoring input fields when selected round or teams list changes
  useEffect(() => {
    if (!selectedRoundId) return;

    const initialInputs: Record<string, string> = {};
    const initialOverrides: Record<string, boolean> = {};
    const initialReasons: Record<string, string> = {};

    teamsList.forEach((team) => {
      const scoreObj = scoresList.find(
        (s) => s.teamId === team.id && s.roundId === selectedRoundId
      );
      initialInputs[team.id] = scoreObj && scoreObj.score !== null ? String(scoreObj.score) : "";
      initialOverrides[team.id] = scoreObj ? scoreObj.overrideAboveMax : false;
      initialReasons[team.id] = scoreObj ? scoreObj.overrideReason || "" : "";
    });

    setScoresInput(initialInputs);
    setScoresOverrides(initialOverrides);
    setScoresOverrideReasons(initialReasons);
    setScoreErrors({});
  }, [selectedRoundId, teamsList, scoresList]);

  // Sync form when clicking on a question slot
  const handleSelectSlot = (slotNumber: number) => {
    setSelectedSlotNumber(slotNumber);
    const existingQ = selectedRoundQuestions.find((q) => q.orderIndex === slotNumber);

    if (existingQ) {
      setQType(existingQ.type);
      setQPrompt(existingQ.prompt);
      setQPoints(existingQ.points || 1);

      const config = existingQ.answerConfig as any;
      if (existingQ.type === "standard" && config.type === "standard") {
        setQStandardAnswer(config.answer);
        setQStandardAcceptable(config.acceptableAnswers?.join(", ") || "");
      } else {
        setQStandardAnswer("");
        setQStandardAcceptable("");
      }

      if (existingQ.type === "multipoint" && config.type === "multipoint") {
        setQMultipointAnswers(config.answers.join("; "));
      } else {
        setQMultipointAnswers("");
      }

      if (existingQ.type === "multiple_choice" && config.type === "multiple_choice") {
        const mapped = [
          { label: "A", text: "" },
          { label: "B", text: "" },
          { label: "C", text: "" },
          { label: "D", text: "" },
        ];
        config.options.forEach((opt: any) => {
          const idx = mapped.findIndex((m) => m.label === opt.label);
          if (idx !== -1) {
            const entry = mapped[idx];
            if (entry) entry.text = opt.text;
          }
        });
        setQMcOptions(mapped);
        const correct = config.options.find(
          (o: any) => o.id === config.correctOptionId
        );
        setQMcCorrectLabel(correct?.label || "A");
      } else {
        setQMcOptions([
          { label: "A", text: "" },
          { label: "B", text: "" },
          { label: "C", text: "" },
          { label: "D", text: "" },
        ]);
        setQMcCorrectLabel("A");
      }
    } else {
      // Empty question slot preset
      setQType("standard");
      setQPrompt("");
      setQPoints(1);
      setQStandardAnswer("");
      setQStandardAcceptable("");
      setQMultipointAnswers("");
      setQMcOptions([
        { label: "A", text: "" },
        { label: "B", text: "" },
        { label: "C", text: "" },
        { label: "D", text: "" },
      ]);
      setQMcCorrectLabel("A");
    }
  };

  // Question save/delete upsert action
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSlotNumber === null || !selectedRoundId) return;

    setSaving(true);
    try {
      let answerConfig: any = {};

      if (qPrompt.trim() !== "") {
        // Construct answerConfig based on question type
        if (qType === "standard") {
          answerConfig = {
            type: "standard",
            answer: qStandardAnswer.trim(),
            acceptableAnswers: qStandardAcceptable
              ? qStandardAcceptable.split(",").map((s) => s.trim()).filter(Boolean)
              : [],
          };
        } else if (qType === "multipoint") {
          answerConfig = {
            type: "multipoint",
            answers: qMultipointAnswers
              ? qMultipointAnswers.split(";").map((s) => s.trim()).filter(Boolean)
              : [],
            pointsPerAnswer: 1,
          };
        } else if (qType === "multiple_choice") {
          const options = qMcOptions.map((o) => ({
            id: o.label, // Use label A, B, C, D as the unique ID for simplicity
            label: o.label,
            text: o.text.trim() || `Option ${o.label}`,
          }));
          answerConfig = {
            type: "multiple_choice",
            options,
            correctOptionId: qMcCorrectLabel,
          };
        }
      }

      const response = await fetch(`/api/rounds/${selectedRoundId}/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Trivia-Token": editToken,
        },
        body: JSON.stringify({
          orderIndex: selectedSlotNumber,
          type: qType,
          prompt: qPrompt,
          points: Number(qPoints),
          answerConfig,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save question");
      }

      const data = await response.json();

      // Update local state
      if (data.deleted) {
        setQuestionsList((prev) =>
          prev.filter(
            (q) => !(q.roundId === selectedRoundId && q.orderIndex === selectedSlotNumber)
          )
        );
      } else {
        setQuestionsList((prev) => {
          const filtered = prev.filter(
            (q) => !(q.roundId === selectedRoundId && q.orderIndex === selectedSlotNumber)
          );
          return [...filtered, data.question];
        });
      }

      setSelectedSlotNumber(null); // Close editor
    } catch (err) {
      alert("Error saving question. Ensure all required fields are filled.");
    } finally {
      setSaving(false);
    }
  };

  // Clean slot delete button handler
  const handleClearSlot = async (slotNumber: number) => {
    if (!window.confirm(`Are you sure you want to clear and delete Question Slot #${slotNumber}?`)) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/rounds/${selectedRoundId}/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Trivia-Token": editToken,
        },
        body: JSON.stringify({
          orderIndex: slotNumber,
          type: "standard",
          prompt: "", // Send blank prompt to trigger cascade delete
          points: 1,
          answerConfig: { type: "standard", answer: "delete" },
        }),
      });

      if (response.ok) {
        setQuestionsList((prev) =>
          prev.filter((q) => !(q.roundId === selectedRoundId && q.orderIndex === slotNumber))
        );
        if (selectedSlotNumber === slotNumber) {
          setSelectedSlotNumber(null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Toggle layout Portrait/Landscape with warning check
  const handleToggleLayout = async (roundId: string, newLayout: "portrait_10" | "landscape_20", force = false) => {
    try {
      const response = await fetch(`/api/rounds/${roundId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Trivia-Token": editToken,
        },
        body: JSON.stringify({
          answerSheetLayout: newLayout,
          force,
        }),
      });

      const data = await response.json();

      if (data.warning) {
        setWarningLayoutRoundId(roundId);
        setWarningLayoutMessage(data.message);
        return;
      }

      // Update rounds local state
      setRoundsList((prev) =>
        prev.map((r) => (r.id === roundId ? { ...r, answerSheetLayout: newLayout } : r))
      );
      setWarningLayoutRoundId(null);
      setWarningLayoutMessage(null);
    } catch (err) {
      alert("Error changing layout");
    }
  };

  // Save general branding config
  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/trivia-nights/${triviaNightId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Trivia-Token": editToken,
        },
        body: JSON.stringify({
          title: brandTitle,
          subtitle: brandSubtitle,
          venue: brandVenue,
          date: brandDate,
          branding: {
            eventTitle: brandTitle,
            subtitle: brandSubtitle,
            footerText: brandFooter,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save branding configurations");
      }

      setTrivia((prev) =>
        prev
          ? {
              ...prev,
              title: brandTitle,
              subtitle: brandSubtitle,
              venue: brandVenue,
              date: brandDate,
              branding: {
                ...prev.branding,
                eventTitle: brandTitle,
                subtitle: brandSubtitle,
                footerText: brandFooter,
              },
            }
          : null
      );
      alert("Settings and Branding updated successfully!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error saving");
    } finally {
      setSaving(false);
    }
  };

  // Round title change rename
  const handleRenameRound = async (roundId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    try {
      await fetch(`/api/rounds/${roundId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Trivia-Token": editToken,
        },
        body: JSON.stringify({ title: newTitle }),
      });
      setRoundsList((prev) =>
        prev.map((r) => (r.id === roundId ? { ...r, title: newTitle } : r))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Add a team to list
  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamFormName.trim()) return;

    const nextOrder = teamsList.length > 0 ? Math.max(...teamsList.map((t) => t.orderIndex)) + 1 : 0;
    const newTeamPayload = {
      name: teamFormName.trim(),
      orderIndex: nextOrder,
    };

    const updatedTeams = [...teamsList.map((t) => ({ id: t.id, name: t.name, orderIndex: t.orderIndex })), newTeamPayload];
    await saveTeamsList(updatedTeams);
    setTeamFormName("");
  };

  // Delete team from list
  const handleDeleteTeam = async (teamId: string) => {
    if (!window.confirm("Are you sure you want to delete this team? Their scored round items will be deleted.")) return;
    const filtered = teamsList
      .filter((t) => t.id !== teamId)
      .map((t, idx) => ({ id: t.id, name: t.name, orderIndex: idx }));
    await saveTeamsList(filtered);
  };

  const saveTeamsList = async (teamsArr: any[]) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/trivia-nights/${triviaNightId}/teams`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Trivia-Token": editToken,
        },
        body: JSON.stringify({ teams: teamsArr }),
      });

      if (!response.ok) {
        throw new Error("Failed to save team list");
      }

      const data = await response.json();
      setTeamsList(data.teams);
    } catch (err) {
      alert("Error configuring teams list");
    } finally {
      setSaving(false);
    }
  };

  // Score validation check with overrides
  const handleScoreInputChange = (teamId: string, value: string) => {
    const roundMax = calculateRoundMaxScore(selectedRoundQuestions);
    const numeric = parseInt(value, 10);

    const updatedInputs = { ...scoresInput, [teamId]: value };
    setScoresInput(updatedInputs);

    // Validate score on-the-fly to raise warning status
    if (value !== "" && !isNaN(numeric)) {
      if (numeric < 0) {
        setScoreErrors((prev) => ({ ...prev, [teamId]: "Score cannot be negative." }));
      } else if (numeric > roundMax) {
        setScoreErrors((prev) => ({
          ...prev,
          [teamId]: `Warning: Entered score exceeds round maximum (${roundMax}). Check override to save.`,
        }));
      } else {
        setScoreErrors((prev) => {
          const clone = { ...prev };
          delete clone[teamId];
          return clone;
        });
      }
    } else {
      setScoreErrors((prev) => {
        const clone = { ...prev };
        delete clone[teamId];
        return clone;
      });
    }
  };

  // Submit scoring matrix
  const handleSaveScoresGrid = async () => {
    setSaving(true);
    try {
      const roundMax = calculateRoundMaxScore(selectedRoundQuestions);
      const scoresPayload = Object.keys(scoresInput).map((teamId) => {
        const valStr = scoresInput[teamId] || "";
        const val = valStr === "" ? null : parseInt(valStr, 10);
        const isOverride = scoresOverrides[teamId] || false;
        
        // Ensure that if it exceeds max and is not overridden, it enforces limit or throws warning block
        if (val !== null && val > roundMax && !isOverride) {
          throw new Error(`Please check the Override box for teams whose score exceeds the maximum round limit of ${roundMax}.`);
        }

        return {
          roundId: selectedRoundId,
          teamId,
          score: val,
          overrideAboveMax: isOverride,
          overrideReason: scoresOverrideReasons[teamId] || "Host Override",
        };
      });

      const response = await fetch(`/api/trivia-nights/${triviaNightId}/scores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Trivia-Token": editToken,
        },
        body: JSON.stringify({ scores: scoresPayload }),
      });

      if (!response.ok) {
        throw new Error("Failed to save scores grid");
      }

      const data = await response.json();
      setScoresList(data.scores);
      alert("Scores grid updated successfully!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error saving scores matrix");
    } finally {
      setSaving(false);
    }
  };

  // Add Round level or Night level bonus points
  const handleAddBonusScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBonusTeamId || !newBonusLabel.trim() || !newBonusPoints) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/trivia-nights/${triviaNightId}/bonus-scores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Trivia-Token": editToken,
        },
        body: JSON.stringify({
          teamId: newBonusTeamId,
          roundId: newBonusRoundId === "night" ? undefined : newBonusRoundId,
          label: newBonusLabel.trim(),
          points: parseInt(newBonusPoints, 10),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setBonusScoresList((prev) => [...prev, data.bonusScore]);
        setNewBonusLabel("");
        setNewBonusPoints("1");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Delete bonus score
  const handleDeleteBonusScore = async (bonusScoreId: string) => {
    try {
      const response = await fetch(`/api/bonus-scores/${bonusScoreId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setBonusScoresList((prev) => prev.filter((b) => b.id !== bonusScoreId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Tiebreaker entry
  const handleAddTiebreaker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTiebreakerPrompt.trim()) return;

    const nextOrder = tiebreakersList.length > 0 ? Math.max(...tiebreakersList.map((t) => t.orderIndex)) + 1 : 0;
    const newTb = {
      prompt: newTiebreakerPrompt.trim(),
      answer: newTiebreakerAnswer.trim() || undefined,
      orderIndex: nextOrder,
    };

    setSaving(true);
    try {
      const response = await fetch(`/api/trivia-nights/${triviaNightId}/tiebreakers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Trivia-Token": editToken,
        },
        body: JSON.stringify({
          tiebreakers: [...tiebreakersList.map((t) => ({ id: t.id, prompt: t.prompt, answer: t.answer, orderIndex: t.orderIndex })), newTb],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTiebreakersList(data.tiebreakers);
        setNewTiebreakerPrompt("");
        setNewTiebreakerAnswer("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Delete Tiebreaker
  const handleDeleteTiebreaker = async (id: string) => {
    const filtered = tiebreakersList
      .filter((t) => t.id !== id)
      .map((t, idx) => ({ id: t.id, prompt: t.prompt, answer: t.answer, orderIndex: idx }));

    setSaving(true);
    try {
      const response = await fetch(`/api/trivia-nights/${triviaNightId}/tiebreakers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Trivia-Token": editToken,
        },
        body: JSON.stringify({ tiebreakers: filtered }),
      });

      if (response.ok) {
        const data = await response.json();
        setTiebreakersList(data.tiebreakers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Reveal toggle API caller
  const handleToggleRevealRound = async (roundId: string, revealed: boolean) => {
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
        setRoundsList((prev) =>
          prev.map((r) => (r.id === roundId ? { ...r, answersRevealed: revealed } as any : r))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-secondary text-lg">
        <div className="animate-spin mr-3 border-2 border-accent-primary border-t-transparent rounded-full w-6 h-6"></div>
        Loading host configurations...
      </div>
    );
  }

  if (error || !trivia) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <Heading level={2} className="text-accent-danger mb-4">
          Configuration Error
        </Heading>
        <Body className="mb-6 max-w-md">{error || "Event details failed to load."}</Body>
        <Button onClick={onExit} variant="secondary">
          Return to Homepage
        </Button>
      </div>
    );
  }

  // Derive rankings for visual team display
  const computedLeaderboard = calculateLeaderboards(teamsList, roundsList, scoresList, bonusScoresList);

  return (
    <div className="min-h-screen flex flex-col bg-surface-base text-text-primary">
      {/* 1. TOP HEADER NAVIGATION BAR */}
      <header className="px-6 py-4 border-b border-border-default/40 bg-surface-raised/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
        <Stack direction="row" align="center" gap="default">
          <Button variant="ghost" size="small" icon={<ArrowLeft size={16} />} onClick={onExit}>
            Exit
          </Button>
          <div className="border-r border-border-default/60 h-6 mx-2"></div>
          <div>
            <Heading level={3} className="text-accent-primary font-display font-bold">
              {trivia.title}
            </Heading>
            <Subtle>
              {trivia.venue ? `@ ${trivia.venue} ` : ""}
              {trivia.date ? `| ${trivia.date} ` : ""}
            </Subtle>
          </div>
        </Stack>

        <Stack direction="row" align="center" gap="small">
          <Button
            variant="primary"
            icon={<Play size={16} />}
            onClick={() => onLaunchPresenter(presentToken)}
            className="shadow-accent-primary/20"
          >
            Launch Presentation
          </Button>
        </Stack>
      </header>

      {/* 2. SIDEBAR AND CONTENT SPLIT */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side Tab Navigation Panel */}
        <aside className="w-64 border-r border-border-default/40 bg-surface-sunken flex flex-col p-4 gap-2">
          <Button
            variant={activeTab === "rounds" ? "primary" : "ghost"}
            icon={<Layers size={18} />}
            onClick={() => setActiveTab("rounds")}
            className="justify-start py-3"
          >
            Rounds & Questions
          </Button>
          <Button
            variant={activeTab === "teams" ? "primary" : "ghost"}
            icon={<Users size={18} />}
            onClick={() => setActiveTab("teams")}
            className="justify-start py-3"
          >
            Teams & Scoring
          </Button>
          <Button
            variant={activeTab === "print" ? "primary" : "ghost"}
            icon={<Printer size={18} />}
            onClick={() => setActiveTab("print")}
            className="justify-start py-3"
          >
            Print Centre
          </Button>
          <Button
            variant={activeTab === "branding" ? "primary" : "ghost"}
            icon={<Settings size={18} />}
            onClick={() => setActiveTab("branding")}
            className="justify-start py-3"
          >
            Event & Branding
          </Button>

          <div className="mt-auto p-4 border border-border-default/40 bg-surface-base rounded-xl">
            <Subtle className="block font-semibold mb-1 text-accent-primary">Host Edit Token:</Subtle>
            <code className="text-body-sm font-mono break-all text-text-secondary select-all">{editToken}</code>
          </div>
        </aside>

        {/* Core panel content flow */}
        <main className="flex-1 overflow-y-auto p-8">
          {/* TAB 1: ROUNDS & QUESTIONS EDITOR */}
          {activeTab === "rounds" && (
            <Stack gap="large">
              {/* Layout Switch Confirmation Banner */}
              {warningLayoutMessage && (
                <div className="p-4 bg-accent-warning/15 border border-accent-warning/30 rounded-xl flex items-center justify-between">
                  <Stack direction="row" gap="default" align="center">
                    <AlertTriangle size={24} className="text-accent-warning shrink-0" />
                    <div>
                      <Heading level={4} className="text-accent-warning">
                        Layout Switch Warning
                      </Heading>
                      <Body className="text-body-sm text-text-secondary">{warningLayoutMessage}</Body>
                    </div>
                  </Stack>
                  <Stack direction="row" gap="small">
                    <Button
                      variant="danger"
                      size="small"
                      onClick={() =>
                        handleToggleLayout(warningLayoutRoundId!, "portrait_10", true)
                      }
                    >
                      Switch Anyway
                    </Button>
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={() => {
                        setWarningLayoutRoundId(null);
                        setWarningLayoutMessage(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </Stack>
                </div>
              )}

              {/* Rounds selection tab header */}
              <div className="flex border-b border-border-default/40 gap-4">
                {roundsList
                  .sort((a, b) => a.orderIndex - b.orderIndex)
                  .map((round) => (
                    <button
                      key={round.id}
                      onClick={() => {
                        setSelectedRoundId(round.id);
                        setSelectedSlotNumber(null);
                      }}
                      className={`px-5 py-3 font-display font-semibold transition-all border-b-2 capitalize outline-none cursor-pointer ${
                        selectedRoundId === round.id
                          ? "border-accent-primary text-text-primary"
                          : "border-transparent text-text-subtle hover:text-text-secondary"
                      }`}
                    >
                      {round.title}
                    </button>
                  ))}
              </div>

              {selectedRound && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left block: Rounds Meta & Slots Grid (8 cols) */}
                  <div className="lg:col-span-7 flex flex-col gap-6">
                    {/* Rename and layout parameters card */}
                    <Surface variant="raised" className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface-raised/40">
                      <div>
                        <input
                          type="text"
                          value={selectedRound.title}
                          onChange={(e) => handleRenameRound(selectedRound.id, e.target.value)}
                          className="bg-transparent border-b border-transparent hover:border-border-strong focus:border-accent-primary text-h2 font-display font-bold text-text-primary px-1 outline-none mb-1 transition-all"
                        />
                        <div className="flex gap-2 items-center mt-1">
                          <span className={`text-caption uppercase px-2 py-0.5 rounded text-body-xs font-bold ${
                            selectedRound.type === "special_round" 
                              ? "bg-accent-warning/10 text-accent-warning" 
                              : "bg-accent-primary/10 text-accent-primary"
                          }`}>
                            {selectedRound.type === "special_round" ? "Special Round" : "Question Round"}
                          </span>
                          <Subtle>Max points: {calculateRoundMaxScore(selectedRoundQuestions)}</Subtle>
                        </div>
                      </div>

                      <Stack direction="row" gap="small" align="center">
                        <Select
                          value={selectedRound.type}
                          onChange={async (e) => {
                            const newType = e.target.value as "question_round" | "special_round";
                            await fetch(`/api/rounds/${selectedRound.id}`, {
                              method: "PATCH",
                              headers: {
                                "Content-Type": "application/json",
                                "X-Trivia-Token": editToken,
                              },
                              body: JSON.stringify({ type: newType }),
                            });
                            setRoundsList((prev) =>
                              prev.map((r) => (r.id === selectedRound.id ? { ...r, type: newType } : r))
                            );
                          }}
                          className="py-1 px-3 w-40 rounded-lg text-body-sm"
                        >
                          <option value="question_round">Question Round</option>
                          <option value="special_round">Special Round</option>
                        </Select>

                        {selectedRound.type === "question_round" && (
                          <Select
                            value={selectedRound.answerSheetLayout || "landscape_20"}
                            onChange={(e) =>
                              handleToggleLayout(
                                selectedRound.id,
                                e.target.value as "portrait_10" | "landscape_20"
                              )
                            }
                            className="py-1 px-3 w-48 rounded-lg text-body-sm"
                          >
                            <option value="portrait_10">10 portrait slots</option>
                            <option value="landscape_20">20 landscape slots</option>
                          </Select>
                        )}
                      </Stack>
                    </Surface>

                    {/* Question Slots layout grid display */}
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-center px-1">
                        <Heading level={3} className="text-text-secondary">
                          Question Grid
                        </Heading>
                        <Subtle>Click a slot to write/edit its question.</Subtle>
                      </div>

                      {selectedRound.type === "special_round" ? (
                        <Surface className="p-8 text-center text-text-subtle">
                          <Body>Special rounds do not have distinct question sheets or answer cards in the MVP.</Body>
                          <Body className="text-body-sm mt-1">Configure maximum point results directly inside the Scoring panel!</Body>
                        </Surface>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {activeSlots.map((slot) => {
                            const hasQ = !!slot.question;
                            const isSelected = selectedSlotNumber === slot.slotNumber;
                            return (
                              <div
                                key={slot.slotNumber}
                                onClick={() => handleSelectSlot(slot.slotNumber)}
                                className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-200 ${
                                  isSelected
                                    ? "bg-accent-primary/10 border-accent-primary shadow-lg shadow-accent-primary/5"
                                    : hasQ
                                    ? "bg-surface-raised/40 hover:bg-surface-raised/70 border-border-default/60 hover:border-border-strong"
                                    : "bg-surface-sunken/40 hover:bg-surface-raised/20 border-dashed border-border-default/60 hover:border-border-default text-text-subtle"
                                }`}
                              >
                                <div className="flex items-center gap-3 overflow-hidden pr-2">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold font-mono text-body-sm shrink-0 ${
                                    isSelected 
                                      ? "bg-accent-primary text-text-on-accent" 
                                      : hasQ 
                                      ? "bg-surface-overlay text-accent-primary" 
                                      : "bg-surface-base text-text-subtle"
                                  }`}>
                                    {slot.slotNumber}
                                  </div>
                                  <div className="truncate">
                                    <div className={`font-semibold text-body-sm ${hasQ ? "text-text-primary" : "text-text-subtle"}`}>
                                      {hasQ ? slot.question!.prompt : "[Empty Slot]"}
                                    </div>
                                    {hasQ && (
                                      <span className="text-caption text-accent-info font-medium text-body-xs font-mono uppercase">
                                        {slot.question!.type} • {slot.question!.points} pts
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {hasQ && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleClearSlot(slot.slotNumber);
                                    }}
                                    className="p-1.5 rounded-lg text-text-subtle hover:text-accent-danger hover:bg-accent-danger/10 transition-colors shrink-0"
                                    title="Delete/Clear question"
                                  >
                                    <Trash size={15} />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right block: Slot editor panel (5 cols) */}
                  <div className="lg:col-span-5 lg:sticky lg:top-24">
                    {selectedSlotNumber === null ? (
                      <Surface variant="raised" className="p-8 text-center text-text-subtle border-dashed border-border-default bg-surface-raised/20">
                        <Body>No slot selected.</Body>
                        <Body className="text-body-sm mt-1">Select a numbered question slot on the left to write and configure a question.</Body>
                      </Surface>
                    ) : (
                      <Surface variant="overlay" className="p-6 shadow-2xl border-accent-primary/20 bg-surface-raised">
                        <form onSubmit={handleSaveQuestion}>
                          <Stack gap="default">
                            <div className="flex justify-between items-center border-b border-border-default/45 pb-3">
                              <Heading level={3} className="text-accent-primary">
                                Question Slot #{selectedSlotNumber}
                              </Heading>
                              <button
                                type="button"
                                onClick={() => setSelectedSlotNumber(null)}
                                className="p-1 hover:bg-white/5 rounded-lg text-text-subtle hover:text-text-primary transition-colors"
                              >
                                <X size={18} />
                              </button>
                            </div>

                            <Select
                              label="Question Type"
                              value={qType}
                              onChange={(e) => setQType(e.target.value as any)}
                            >
                              <option value="standard">Standard (Single Answer)</option>
                              <option value="multiple_choice">Multiple Choice</option>
                              <option value="multipoint">Multipoint (List of Answers)</option>
                            </Select>

                            <Textarea
                              label="Question Prompt"
                              placeholder="Type your trivia question here..."
                              value={qPrompt}
                              onChange={(e) => setQPrompt(e.target.value)}
                              required
                              rows={3}
                            />

                            <Input
                              label="Points Value"
                              type="number"
                              min="1"
                              value={qPoints}
                              onChange={(e) => setQPoints(parseInt(e.target.value, 10) || 1)}
                              required
                            />

                            {/* CONDITIONAL ANSWER INPUTS BASED ON QUESTION TYPE */}
                            {qType === "standard" && (
                              <Stack gap="small" className="pt-2 border-t border-border-default/40">
                                <Input
                                  label="Correct Answer"
                                  placeholder="Exact correct answer"
                                  value={qStandardAnswer}
                                  onChange={(e) => setQStandardAnswer(e.target.value)}
                                  required
                                />
                                <Input
                                  label="Alternate Acceptable Answers (Optional)"
                                  placeholder="e.g. Barton, Ed Barton (comma-separated)"
                                  value={qStandardAcceptable}
                                  onChange={(e) => setQStandardAcceptable(e.target.value)}
                                />
                              </Stack>
                            )}

                            {qType === "multipoint" && (
                              <Stack gap="small" className="pt-2 border-t border-border-default/40">
                                <Textarea
                                  label="List of Correct Answers (1 point each)"
                                  placeholder="e.g. France; Germany; Italy; Spain (semicolon-separated)"
                                  value={qMultipointAnswers}
                                  onChange={(e) => setQMultipointAnswers(e.target.value)}
                                  required
                                />
                                <Subtle>The team receives 1 point for every matching answer they write. Maximum points will automatically scale based on the number of answers provided.</Subtle>
                              </Stack>
                            )}

                            {qType === "multiple_choice" && (
                              <Stack gap="small" className="pt-2 border-t border-border-default/40">
                                <Heading level={4} className="text-body-sm font-semibold mb-1">
                                  Multiple-Choice Options
                                </Heading>
                                <div className="grid grid-cols-1 gap-2">
                                  {qMcOptions.map((opt, idx) => (
                                    <div key={opt.label} className="flex gap-2 items-center">
                                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold font-mono text-body-sm border ${
                                        qMcCorrectLabel === opt.label 
                                          ? "bg-accent-success/10 text-accent-success border-accent-success/40" 
                                          : "bg-surface-sunken text-text-secondary border-border-default"
                                      }`}>
                                        {opt.label}
                                      </span>
                                      <input
                                        type="text"
                                        placeholder={`Option ${opt.label} text`}
                                        value={opt.text}
                                        onChange={(e) => {
                                          const copy = [...qMcOptions];
                                          const entry = copy[idx];
                                          if (entry) entry.text = e.target.value;
                                          setQMcOptions(copy);
                                        }}
                                        className="flex-1 px-3 py-2 rounded-xl bg-surface-sunken border border-border-default/60 text-text-primary text-body-sm focus:outline-none focus:border-accent-primary"
                                        required
                                      />
                                    </div>
                                  ))}
                                </div>

                                <Select
                                  label="Correct Option"
                                  value={qMcCorrectLabel}
                                  onChange={(e) => setQMcCorrectLabel(e.target.value)}
                                  className="mt-2"
                                >
                                  <option value="A">A</option>
                                  <option value="B">B</option>
                                  <option value="C">C</option>
                                  <option value="D">D</option>
                                </Select>
                              </Stack>
                            )}

                            <Button
                              type="submit"
                              variant="primary"
                              icon={<Save size={16} />}
                              className="w-full mt-4"
                              disabled={saving}
                            >
                              {saving ? "Saving..." : "Save Question to Slot"}
                            </Button>
                          </Stack>
                        </form>
                      </Surface>
                    )}
                  </div>
                </div>
              )}
            </Stack>
          )}

          {/* TAB 2: TEAMS & SCORING MATRIX */}
          {activeTab === "teams" && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              {/* Left Grid Panel: Team list configuration & Scoring (7 cols) */}
              <div className="xl:col-span-8 flex flex-col gap-8">
                {/* Team Manager Configuration Panel */}
                <Surface variant="raised" className="p-6 bg-surface-raised/40">
                  <Stack gap="default">
                    <Heading level={3} className="text-accent-primary font-display font-semibold">
                      Configure Event Teams
                    </Heading>
                    <Body className="text-body-sm">
                      Manage the roster of teams competing. Adding/deleting teams immediately updates score grids.
                    </Body>

                    <form onSubmit={handleAddTeam} className="flex gap-2 mt-2">
                      <Input
                        placeholder="Enter team name..."
                        value={teamFormName}
                        onChange={(e) => setTeamFormName(e.target.value)}
                        disabled={saving}
                      />
                      <Button
                        type="submit"
                        variant="secondary"
                        icon={<Plus size={16} />}
                        disabled={saving || !teamFormName.trim()}
                        className="shrink-0"
                      >
                        Add Team
                      </Button>
                    </form>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {teamsList
                        .sort((a, b) => a.orderIndex - b.orderIndex)
                        .map((team) => (
                          <div
                            key={team.id}
                            className="pl-3 pr-1 py-1 bg-surface-overlay border border-border-default/60 hover:border-border-strong rounded-xl flex items-center gap-2 group transition-all"
                          >
                            <span className="text-body-sm font-semibold">{team.name}</span>
                            <button
                              onClick={() => handleDeleteTeam(team.id)}
                              className="p-1 rounded-md text-text-subtle hover:text-accent-danger hover:bg-accent-danger/10 transition-colors"
                              title="Delete Team"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      {teamsList.length === 0 && (
                        <div className="text-text-subtle text-body-sm text-center py-4 w-full border border-dashed border-border-default/40 rounded-xl">
                          No teams added yet. Create at least one team above to enter scores.
                        </div>
                      )}
                    </div>
                  </Stack>
                </Surface>

                {/* Score entry matrix grid */}
                <Surface variant="raised" className="p-6 bg-surface-raised/40">
                  <Stack gap="default">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <Heading level={3} className="text-accent-primary font-display font-semibold">
                          Score Entry Matrix
                        </Heading>
                        <Body className="text-body-sm">
                          Enter team scores for the active round. Leaves fields blank for unmarked teams.
                        </Body>
                      </div>

                      <div className="flex gap-2 items-center">
                        <span className="text-body-sm font-semibold text-text-secondary shrink-0">Scoring Round:</span>
                        <Select
                          value={selectedRoundId}
                          onChange={(e) => setSelectedRoundId(e.target.value)}
                          className="py-1 px-3 w-40 rounded-lg text-body-sm"
                        >
                          {roundsList
                            .sort((a, b) => a.orderIndex - b.orderIndex)
                            .map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.title}
                              </option>
                            ))}
                        </Select>
                      </div>
                    </div>

                    {selectedRound && (
                      <div className="mt-3">
                        <div className="flex justify-between items-center mb-3 bg-surface-sunken p-3 rounded-xl border border-border-default/30">
                          <span className="text-body-sm font-semibold text-text-secondary">
                            Active Layout: <span className="text-text-primary capitalize">{selectedRound.answerSheetLayout || "N/A"}</span>
                          </span>
                          <span className="text-body-sm font-semibold text-accent-info">
                            Calculated Max Score: {calculateRoundMaxScore(selectedRoundQuestions)} points
                          </span>
                        </div>

                        {teamsList.length === 0 ? (
                          <div className="text-center text-text-subtle py-8">
                            Create teams above to display the scoring matrix.
                          </div>
                        ) : (
                          <div className="flex flex-col gap-3">
                            {teamsList
                              .sort((a, b) => a.orderIndex - b.orderIndex)
                              .map((team) => {
                                const errorText = scoreErrors[team.id];
                                const isOverrideChecked = scoresOverrides[team.id] || false;
                                return (
                                  <div
                                    key={team.id}
                                    className="p-4 bg-surface-overlay border border-border-default/40 rounded-xl flex flex-col gap-3 transition-colors hover:bg-surface-overlay/80"
                                  >
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                                      <span className="font-semibold text-body-sm text-text-primary shrink-0">
                                        {team.name}
                                      </span>

                                      <div className="flex items-center gap-4 w-full md:w-auto">
                                        <div className="w-24 shrink-0">
                                          <input
                                            type="number"
                                            placeholder="Unmarked"
                                            value={scoresInput[team.id] || ""}
                                            onChange={(e) =>
                                              handleScoreInputChange(team.id, e.target.value)
                                            }
                                            className="w-full text-center px-3 py-2 rounded-xl bg-surface-sunken border border-border-default text-text-primary text-body-sm focus:outline-none focus:border-accent-primary"
                                          />
                                        </div>

                                        {errorText && (
                                          <div className="flex items-center gap-2">
                                            <label className="flex items-center gap-1.5 cursor-pointer text-body-sm text-accent-warning font-semibold select-none">
                                              <input
                                                type="checkbox"
                                                checked={isOverrideChecked}
                                                onChange={(e) =>
                                                  setScoresOverrides((prev) => ({
                                                    ...prev,
                                                    [team.id]: e.target.checked,
                                                  }))
                                                }
                                                className="w-4 h-4 accent-accent-warning cursor-pointer"
                                              />
                                              Bypass Limit
                                            </label>
                                            {isOverrideChecked && (
                                              <input
                                                type="text"
                                                placeholder="Bypass reason..."
                                                value={scoresOverrideReasons[team.id] || ""}
                                                onChange={(e) =>
                                                  setScoresOverrideReasons((prev) => ({
                                                    ...prev,
                                                    [team.id]: e.target.value,
                                                  }))
                                                }
                                                className="px-2 py-1 bg-surface-sunken border border-border-default rounded text-body-xs w-36 outline-none"
                                              />
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {errorText && (
                                      <div className="text-body-sm text-accent-warning font-semibold flex items-center gap-1">
                                        <span>⚠️</span>
                                        <span>{errorText}</span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}

                            <Button
                              onClick={handleSaveScoresGrid}
                              variant="primary"
                              icon={<Save size={16} />}
                              className="w-full mt-4"
                              disabled={saving}
                            >
                              {saving ? "Saving scores..." : "Save Scores Matrix"}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </Stack>
                </Surface>
              </div>

              {/* Right Grid Panel: Leaderboard, Tiebreakers & Bonus scores (4 cols) */}
              <div className="xl:col-span-4 flex flex-col gap-6">
                {/* Live leaderboard display */}
                <Surface variant="overlay" className="p-6 bg-surface-raised">
                  <Heading level={3} className="text-accent-primary mb-3 font-display font-semibold">
                    Night Leaderboard
                  </Heading>
                  <div className="flex flex-col gap-2 mt-2 max-h-96 overflow-y-auto pr-1">
                    {computedLeaderboard.map((row) => (
                      <div
                        key={row.teamId}
                        className="flex justify-between items-center p-3 bg-surface-sunken border border-border-default/40 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 text-center font-bold font-mono text-accent-info text-body-sm">
                            {row.rank}.
                          </span>
                          <span className="text-body-sm font-semibold truncate max-w-40">
                            {row.teamName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {row.hasUnmarkedRounds && (
                            <span className="text-caption text-body-xs font-bold text-accent-warning bg-accent-warning/5 px-1.5 py-0.5 rounded border border-accent-warning/10" title="Has incomplete round scores">
                              Incomplete
                            </span>
                          )}
                          <span className="text-body-sm font-bold text-accent-primary">
                            {row.totalScore} pts
                          </span>
                        </div>
                      </div>
                    ))}
                    {teamsList.length === 0 && (
                      <div className="text-center text-text-subtle text-caption py-4">
                        Add teams to show standings.
                      </div>
                    )}
                  </div>
                </Surface>

                {/* Bonus score adder panel */}
                <Surface variant="overlay" className="p-6 bg-surface-raised">
                  <Heading level={3} className="text-accent-primary mb-3 font-display font-semibold">
                    Add Bonus Points
                  </Heading>
                  <form onSubmit={handleAddBonusScore}>
                    <Stack gap="small">
                      <Select
                        label="Assign Team"
                        value={newBonusTeamId}
                        onChange={(e) => setNewBonusTeamId(e.target.value)}
                        required
                      >
                        <option value="">-- Choose Team --</option>
                        {teamsList.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </Select>

                      <Select
                        label="Bonus Round Context"
                        value={newBonusRoundId}
                        onChange={(e) => setNewBonusRoundId(e.target.value)}
                      >
                        <option value="night">Whole Trivia Night (Overall Bonus)</option>
                        {roundsList
                          .sort((a, b) => a.orderIndex - b.orderIndex)
                          .map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.title}
                            </option>
                          ))}
                      </Select>

                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          label="Points"
                          type="number"
                          min="1"
                          value={newBonusPoints}
                          onChange={(e) => setNewBonusPoints(e.target.value)}
                          className="col-span-1"
                          required
                        />
                        <Input
                          label="Reason Label"
                          placeholder="e.g. Best Team Name"
                          value={newBonusLabel}
                          onChange={(e) => setNewBonusLabel(e.target.value)}
                          className="col-span-2"
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        variant="secondary"
                        icon={<PlusCircle size={15} />}
                        className="w-full mt-2"
                        disabled={saving || !newBonusTeamId || !newBonusLabel.trim()}
                      >
                        Grant Bonus
                      </Button>
                    </Stack>
                  </form>

                  {/* Active bonus points list tracker */}
                  <div className="mt-4 flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                    {bonusScoresList.map((bonus) => {
                      const matchingTeam = teamsList.find((t) => t.id === bonus.teamId);
                      const matchingRound = roundsList.find((r) => r.id === bonus.roundId);
                      return (
                        <div
                          key={bonus.id}
                          className="p-2.5 bg-surface-sunken border border-border-default/40 rounded-lg flex items-center justify-between"
                        >
                          <div className="overflow-hidden">
                            <span className="text-body-xs font-bold text-accent-primary uppercase font-mono tracking-wide">
                              +{bonus.points} pts
                            </span>
                            <div className="text-body-sm font-semibold truncate text-text-primary">
                              {matchingTeam ? matchingTeam.name : "Unknown team"}
                            </div>
                            <div className="text-caption text-body-xs text-text-subtle truncate">
                              {bonus.label} {matchingRound ? `(${matchingRound.title})` : "(Overall)"}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteBonusScore(bonus.id)}
                            className="p-1 rounded text-text-subtle hover:text-accent-danger hover:bg-accent-danger/10 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </Surface>

                {/* Tiebreaker configurations list */}
                <Surface variant="overlay" className="p-6 bg-surface-raised">
                  <Heading level={3} className="text-accent-primary mb-3 font-display font-semibold">
                    Tiebreakers Setup
                  </Heading>
                  <form onSubmit={handleAddTiebreaker}>
                    <Stack gap="small">
                      <Input
                        label="Tiebreaker Prompt"
                        placeholder="e.g. In what year was the Slinky invented?"
                        value={newTiebreakerPrompt}
                        onChange={(e) => setNewTiebreakerPrompt(e.target.value)}
                        required
                      />
                      <Input
                        label="Correct Numeric Answer"
                        placeholder="e.g. 1943"
                        value={newTiebreakerAnswer}
                        onChange={(e) => setNewTiebreakerAnswer(e.target.value)}
                      />
                      <Button
                        type="submit"
                        variant="secondary"
                        icon={<PlusCircle size={15} />}
                        className="w-full mt-1"
                        disabled={saving || !newTiebreakerPrompt.trim()}
                      >
                        Add Tiebreaker
                      </Button>
                    </Stack>
                  </form>

                  <div className="mt-4 flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                    {tiebreakersList
                      .sort((a, b) => a.orderIndex - b.orderIndex)
                      .map((tb, idx) => (
                        <div
                          key={tb.id}
                          className="p-2.5 bg-surface-sunken border border-border-default/40 rounded-lg flex items-center justify-between"
                        >
                          <div className="overflow-hidden">
                            <span className="text-body-xs font-bold text-accent-info font-mono">
                              TB #{idx + 1}
                            </span>
                            <div className="text-body-sm font-semibold truncate text-text-primary">
                              {tb.prompt}
                            </div>
                            {tb.answer && (
                              <div className="text-body-xs text-text-subtle font-mono">
                                Answer: {tb.answer}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteTiebreaker(tb.id)}
                            className="p-1 rounded text-text-subtle hover:text-accent-danger hover:bg-accent-danger/10 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                  </div>
                </Surface>
              </div>
            </div>
          )}

          {/* TAB 3: PRINT CENTRE */}
          {activeTab === "print" && (
            <Stack gap="large">
              <div>
                <Heading level={2} className="text-accent-primary font-display font-semibold mb-2">
                  Printed Materials Hub
                </Heading>
                <Body>
                  Download beautiful, ink-friendly, auto-paginated A4 sheets rendered directly server-side with deterministic seating cartoons.
                </Body>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {roundsList
                  .sort((a, b) => a.orderIndex - b.orderIndex)
                  .map((round) => {
                    const roundQ = questionsList.filter((q) => q.roundId === round.id);
                    return (
                      <Surface key={round.id} variant="raised" className="p-6 bg-surface-raised/40">
                        <Stack gap="default">
                          <div>
                            <Heading level={3} className="capitalize font-display">
                              {round.title}
                            </Heading>
                            <Subtle className="capitalize block mt-0.5">
                              Layout: {round.type === "special_round" ? "Special" : round.answerSheetLayout || "20 landscape"} • {roundQ.length} active questions
                            </Subtle>
                          </div>

                          {round.type === "special_round" ? (
                            <div className="p-4 bg-surface-sunken border border-border-default/45 rounded-xl text-center text-text-subtle text-body-sm">
                              Special rounds do not have printed sheets in the MVP.
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-3 mt-2">
                              <a
                                href={`/api/print/rounds/${round.id}/answer-sheet?token=${editToken}`}
                                target="_blank"
                                rel="noreferrer"
                                className="no-underline"
                              >
                                <Button
                                  variant="primary"
                                  size="default"
                                  icon={<Download size={15} />}
                                  className="w-full py-2.5 text-body-sm font-semibold justify-center"
                                >
                                  Answer Sheet
                                </Button>
                              </a>

                              <a
                                href={`/api/print/rounds/${round.id}/marking-guide?token=${editToken}`}
                                target="_blank"
                                rel="noreferrer"
                                className="no-underline"
                              >
                                <Button
                                  variant="secondary"
                                  size="default"
                                  icon={<Download size={15} />}
                                  className="w-full py-2.5 text-body-sm font-semibold justify-center"
                                >
                                  Marking Guide
                                </Button>
                              </a>
                            </div>
                          )}

                          {round.type === "question_round" && (
                            <div className="flex justify-between items-center mt-1 border-t border-border-default/30 pt-3">
                              <label className="flex items-center gap-2 cursor-pointer select-none text-body-sm font-semibold text-text-secondary">
                                <input
                                  type="checkbox"
                                  checked={round.answersRevealed}
                                  onChange={(e) =>
                                    handleToggleRevealRound(round.id, e.target.checked)
                                  }
                                  className="w-4 h-4 accent-accent-primary cursor-pointer"
                                />
                                Reveal Answers on Screen
                              </label>
                              {round.answersRevealed ? (
                                <span className="text-caption text-accent-success text-body-xs font-bold bg-accent-success/15 px-2 py-0.5 rounded flex items-center gap-1 border border-accent-success/20">
                                  <Check size={12} /> Revealed
                                </span>
                              ) : (
                                <span className="text-caption text-text-subtle text-body-xs font-bold bg-surface-sunken px-2 py-0.5 rounded border border-border-default">
                                  Hidden
                                </span>
                              )}
                            </div>
                          )}
                        </Stack>
                      </Surface>
                    );
                  })}
              </div>
            </Stack>
          )}

          {/* TAB 4: BRANDING & GENERAL SETTINGS */}
          {activeTab === "branding" && (
            <Surface variant="raised" className="max-w-2xl p-8 bg-surface-raised/40">
              <form onSubmit={handleSaveBranding}>
                <Stack gap="default">
                  <div>
                    <Heading level={2} className="text-accent-primary font-display font-semibold mb-2">
                      Event Configuration & Branding
                    </Heading>
                    <Body className="text-body-sm">
                      Customize branding text. Details appear in all Playwright-generated PDF answer sheets and scoring grids.
                    </Body>
                  </div>

                  <Input
                    label="Event Title"
                    value={brandTitle}
                    onChange={(e) => setBrandTitle(e.target.value)}
                    required
                    disabled={saving}
                  />

                  <Input
                    label="Event Subtitle (Optional)"
                    placeholder="e.g. Benefiting the Local High School"
                    value={brandSubtitle}
                    onChange={(e) => setBrandSubtitle(e.target.value)}
                    disabled={saving}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Event Date"
                      type="date"
                      value={brandDate}
                      onChange={(e) => setBrandDate(e.target.value)}
                      disabled={saving}
                    />
                    <Input
                      label="Event Venue"
                      placeholder="e.g. Community Centre Room B"
                      value={brandVenue}
                      onChange={(e) => setBrandVenue(e.target.value)}
                      disabled={saving}
                    />
                  </div>

                  <Textarea
                    label="Answer Sheet Footer Text"
                    value={brandFooter}
                    onChange={(e) => setBrandFooter(e.target.value)}
                    disabled={saving}
                    rows={2}
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    icon={<Save size={16} />}
                    className="w-full mt-4"
                    disabled={saving}
                  >
                    {saving ? "Saving configurations..." : "Save Branding & Details"}
                  </Button>
                </Stack>
              </form>
            </Surface>
          )}
        </main>
      </div>
    </div>
  );
};
