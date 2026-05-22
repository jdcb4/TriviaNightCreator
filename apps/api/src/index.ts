import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { z } from "zod";
import {
  db,
  triviaNights,
  rounds,
  questions,
  teams,
  roundScores,
  bonusScores,
  tiebreakers,
  accessTokens,
  decorativeAssets,
  decorationSelections,
  eq,
  and,
  inArray,
  gt,
} from "@trivia/db";
import {
  calculateRoundMaxScore,
  calculateLeaderboards,
  derivePresentationRoundState,
} from "@trivia/domain";
import {
  renderAnswerSheetHtml,
  renderMarkingGuideHtml,
  generatePdfFromHtml,
  renderCombinedAnswerSheetsHtml,
  renderCombinedMarkingGuidesHtml,
} from "@trivia/pdf";
import { generateToken, hashToken } from "./utils/crypto";
import { requireEditToken, requirePresentOrEditToken } from "./middleware/auth";
import * as dotenv from "dotenv";

dotenv.config();

const app = new Hono<{
  Variables: {
    accessType: "edit" | "present";
  }
}>();

// Enable CORS
app.use(
  "/*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Trivia-Token"],
  })
);

// Health Check
app.get("/api/health", (c) => c.json({ status: "healthy", time: new Date().toISOString() }));

// ==========================================
// 1. TRIVIA NIGHTS ENDPOINTS
// ==========================================

const CreateTriviaNightSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  date: z.string().optional(),
  venue: z.string().optional(),
});

app.post("/api/trivia-nights", async (c) => {
  try {
    const body = await c.req.json();
    const validated = CreateTriviaNightSchema.parse(body);

    const triviaNightId = crypto.randomUUID();
    const now = new Date();
    const nowStr = now.toISOString();

    const newTrivia = {
      id: triviaNightId,
      title: validated.title,
      subtitle: validated.subtitle || "",
      date: validated.date || "",
      venue: validated.venue || "",
      status: "draft" as const,
      branding: {
        eventTitle: validated.title,
        subtitle: validated.subtitle || "",
        footerText: "Please write clearly. Hand this sheet in at the end of the round.",
      },
      settings: {
        allowLateTeamRegistration: true,
        showLiveLeaderboard: true,
      },
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    // 1. Insert Trivia Night
    await db.insert(triviaNights).values({
      ...newTrivia,
      createdAt: now,
      updatedAt: now,
    });

    // 2. Insert Default 3 Rounds x 20 Landscape Slots
    const round1Id = crypto.randomUUID();
    const round2Id = crypto.randomUUID();
    const round3Id = crypto.randomUUID();

    await db.insert(rounds).values([
      {
        id: round1Id,
        triviaNightId,
        title: "Round 1",
        orderIndex: 1,
        type: "question_round",
        answerSheetLayout: "landscape_20",
        answersRevealed: false,
      },
      {
        id: round2Id,
        triviaNightId,
        title: "Round 2",
        orderIndex: 2,
        type: "question_round",
        answerSheetLayout: "landscape_20",
        answersRevealed: false,
      },
      {
        id: round3Id,
        triviaNightId,
        title: "Round 3",
        orderIndex: 3,
        type: "question_round",
        answerSheetLayout: "landscape_20",
        answersRevealed: false,
      },
    ]);

    // 3. Generate Tokens
    const rawEditToken = generateToken("edit");
    const rawPresentToken = generateToken("present");

    await db.insert(accessTokens).values([
      {
        id: crypto.randomUUID(),
        triviaNightId,
        tokenHash: hashToken(rawEditToken),
        accessType: "edit",
        createdAt: now,
      },
      {
        id: crypto.randomUUID(),
        triviaNightId,
        tokenHash: hashToken(rawPresentToken),
        accessType: "present",
        createdAt: now,
      },
    ]);

    return c.json({
      triviaNight: newTrivia,
      editToken: rawEditToken,
      presentToken: rawPresentToken,
    }, 201);
  } catch (error) {
    console.error("Create trivia error:", error);
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors }, 400);
    }
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

app.get("/api/trivia-nights/:id", requirePresentOrEditToken, async (c) => {
  const triviaNightId = c.req.param("id") as string;
  const accessType = c.get("accessType") as "edit" | "present";

  try {
    const [trivia] = await db
      .select()
      .from(triviaNights)
      .where(eq(triviaNights.id, triviaNightId))
      .limit(1);

    if (!trivia) {
      return c.json({ error: "Trivia Night not found" }, 404);
    }

    // Refresh last accessed timestamp
    await db
      .update(triviaNights)
      .set({ lastAccessedAt: new Date() })
      .where(eq(triviaNights.id, triviaNightId));

    // Fetch related records
    const allRounds = await db
      .select()
      .from(rounds)
      .where(eq(rounds.triviaNightId, triviaNightId));

    const roundIds = allRounds.map((r) => r.id);

    const allQuestions = roundIds.length > 0
      ? await db.select().from(questions).where(inArray(questions.roundId, roundIds))
      : [];

    const allTeams = await db
      .select()
      .from(teams)
      .where(eq(teams.triviaNightId, triviaNightId));

    const allScores = await db
      .select()
      .from(roundScores)
      .where(eq(roundScores.triviaNightId, triviaNightId));

    const allBonuses = await db
      .select()
      .from(bonusScores)
      .where(eq(bonusScores.triviaNightId, triviaNightId));

    const allTiebreakers = await db
      .select()
      .from(tiebreakers)
      .where(eq(tiebreakers.triviaNightId, triviaNightId));

    if (accessType === "present") {
      // Return presentation-safe state (hide answers/correct options unless round revealed)
      const presentationRounds = allRounds
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((r) => {
          const roundQ = allQuestions.filter((q) => q.roundId === r.id);
          return derivePresentationRoundState(r as any, roundQ as any, r.answersRevealed);
        });

      return c.json({
        triviaNight: {
          id: trivia.id,
          title: trivia.title,
          subtitle: trivia.subtitle,
          date: trivia.date,
          venue: trivia.venue,
          status: trivia.status,
          branding: trivia.branding,
        },
        rounds: presentationRounds,
        teams: allTeams.map((t) => ({ id: t.id, name: t.name, orderIndex: t.orderIndex })),
        tiebreakers: allTiebreakers.map((t) => ({ id: t.id, prompt: t.prompt, orderIndex: t.orderIndex })),
      });
    }

    // Full editor view
    return c.json({
      triviaNight: trivia,
      rounds: allRounds,
      questions: allQuestions,
      teams: allTeams,
      scores: allScores,
      bonusScores: allBonuses,
      tiebreakers: allTiebreakers,
    });
  } catch (error) {
    console.error("Get trivia error:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

app.patch("/api/trivia-nights/:id", requireEditToken, async (c) => {
  const triviaNightId = c.req.param("id") as string;
  try {
    const body = await c.req.json();
    const now = new Date();

    const updateFields: any = {
      updatedAt: now,
    };
    if (body.title !== undefined) updateFields.title = body.title;
    if (body.subtitle !== undefined) updateFields.subtitle = body.subtitle;
    if (body.date !== undefined) updateFields.date = body.date;
    if (body.venue !== undefined) updateFields.venue = body.venue;
    if (body.status !== undefined) updateFields.status = body.status;
    if (body.branding !== undefined) updateFields.branding = body.branding;
    if (body.settings !== undefined) updateFields.settings = body.settings;

    await db
      .update(triviaNights)
      .set(updateFields)
      .where(eq(triviaNights.id, triviaNightId));

    return c.json({ success: true });
  } catch (error) {
    console.error("Update trivia error:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// ==========================================
// 2. ROUNDS ENDPOINTS
// ==========================================

app.patch("/api/rounds/:id", requireEditToken, async (c) => {
  const roundId = c.req.param("id") as string;
  try {
    const body = await c.req.json();
    
    // Check if changing layout from landscape_20 to portrait_10
    if (body.answerSheetLayout === "portrait_10" && !body.force) {
      const activeHighSlots = await db
        .select()
        .from(questions)
        .where(
          and(
            eq(questions.roundId, roundId),
            gt(questions.orderIndex, 10)
          )
        );

      if (activeHighSlots.length > 0) {
        // Return warning headers but DO NOT delete them
        return c.json({
          warning: true,
          message: `This round contains ${activeHighSlots.length} questions in slots 11-20. Changing layout to 10-Question Portrait will hide them from printed sheets and recap grids unless restored.`,
        });
      }
    }

    const updateFields: any = {};
    if (body.title !== undefined) updateFields.title = body.title;
    if (body.type !== undefined) updateFields.type = body.type;
    if (body.answerSheetLayout !== undefined) updateFields.answerSheetLayout = body.answerSheetLayout;
    if (body.description !== undefined) updateFields.description = body.description;
    if (body.specialRoundConfig !== undefined) updateFields.specialRoundConfig = body.specialRoundConfig;

    await db.update(rounds).set(updateFields).where(eq(rounds.id, roundId));
    return c.json({ success: true });
  } catch (error) {
    console.error("Update round error:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

app.post("/api/rounds/:roundId/reveal", requireEditToken, async (c) => {
  const roundId = c.req.param("roundId") as string;
  try {
    const body = await c.req.json();
    await db
      .update(rounds)
      .set({ answersRevealed: !!body.revealed })
      .where(eq(rounds.id, roundId));
    return c.json({ success: true, answersRevealed: !!body.revealed });
  } catch (error) {
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// ==========================================
// 3. QUESTIONS ENDPOINTS (UPSERT)
// ==========================================

const UpsertQuestionSchema = z.object({
  orderIndex: z.number().int().positive(),
  type: z.enum(["standard", "multipoint", "multiple_choice"]),
  prompt: z.string(),
  points: z.number().int().positive().default(1),
  answerConfig: z.any(),
});

app.post("/api/rounds/:roundId/questions", requireEditToken, async (c) => {
  const roundId = c.req.param("roundId") as string;
  try {
    const body = await c.req.json();
    const validated = UpsertQuestionSchema.parse(body);

    const now = new Date();

    // Check if prompt is blank -> Purge empty slots from the DB
    if (!validated.prompt.trim()) {
      await db
        .delete(questions)
        .where(
          and(
            eq(questions.roundId, roundId),
            eq(questions.orderIndex, validated.orderIndex)
          )
        );
      return c.json({ deleted: true });
    }

    // Upsert
    const [existing] = await db
      .select()
      .from(questions)
      .where(
        and(
          eq(questions.roundId, roundId),
          eq(questions.orderIndex, validated.orderIndex)
        )
      )
      .limit(1);

    if (existing) {
      await db
        .update(questions)
        .set({
          type: validated.type,
          prompt: validated.prompt,
          points: validated.points,
          answerConfig: validated.answerConfig,
          updatedAt: now,
        })
        .where(eq(questions.id, existing.id));
      
      const [updated] = await db.select().from(questions).where(eq(questions.id, existing.id));
      return c.json({ question: updated });
    } else {
      const qId = crypto.randomUUID();
      await db.insert(questions).values({
        id: qId,
        roundId,
        orderIndex: validated.orderIndex,
        type: validated.type,
        prompt: validated.prompt,
        points: validated.points,
        answerConfig: validated.answerConfig,
        createdAt: now,
        updatedAt: now,
      } as any);

      const [inserted] = await db.select().from(questions).where(eq(questions.id, qId));
      return c.json({ question: inserted }, 201);
    }
  } catch (error) {
    console.error("Upsert question error:", error);
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors }, 400);
    }
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// ==========================================
// 4. TEAMS ENDPOINTS
// ==========================================

const TeamUpsertSchema = z.object({
  teams: z.array(
    z.object({
      id: z.string().uuid().optional(),
      name: z.string().min(1),
      orderIndex: z.number().int(),
    })
  ),
});

app.post("/api/trivia-nights/:id/teams", requireEditToken, async (c) => {
  const triviaNightId = c.req.param("id") as string;
  try {
    const body = await c.req.json();
    const validated = TeamUpsertSchema.parse(body);

    const keptIds: string[] = [];

    for (const teamItem of validated.teams) {
      if (teamItem.id) {
        // Update
        await db
          .update(teams)
          .set({
            name: teamItem.name,
            orderIndex: teamItem.orderIndex,
          })
          .where(
            and(
              eq(teams.id, teamItem.id),
              eq(teams.triviaNightId, triviaNightId)
            )
          );
        keptIds.push(teamItem.id);
      } else {
        // Insert
        const tId = crypto.randomUUID();
        await db.insert(teams).values({
          id: tId,
          triviaNightId,
          name: teamItem.name,
          orderIndex: teamItem.orderIndex,
        } as any);
        keptIds.push(tId);
      }
    }

    // Delete teams not in body (cascade deletes score files)
    if (keptIds.length > 0) {
      const allCurrent = await db.select().from(teams).where(eq(teams.triviaNightId, triviaNightId));
      const idsToDelete = allCurrent.filter(c => !keptIds.includes(c.id)).map(c => c.id);
      if (idsToDelete.length > 0) {
        await db.delete(teams).where(inArray(teams.id, idsToDelete));
      }
    } else {
      await db.delete(teams).where(eq(teams.triviaNightId, triviaNightId));
    }

    const updatedTeams = await db
      .select()
      .from(teams)
      .where(eq(teams.triviaNightId, triviaNightId))
      .orderBy(teams.orderIndex);

    return c.json({ teams: updatedTeams });
  } catch (error) {
    console.error("Teams configuration error:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// ==========================================
// 5. SCORING MATRIX ENDPOINTS
// ==========================================

const ScoreBulkSaveSchema = z.object({
  scores: z.array(
    z.object({
      roundId: z.string().uuid(),
      teamId: z.string().uuid(),
      score: z.number().int().nonnegative().nullable(), // null means unmarked
      overrideAboveMax: z.boolean().default(false),
      overrideReason: z.string().optional(),
    })
  ),
});

app.post("/api/trivia-nights/:id/scores", requireEditToken, async (c) => {
  const triviaNightId = c.req.param("id") as string;
  try {
    const body = await c.req.json();
    const validated = ScoreBulkSaveSchema.parse(body);

    for (const scoreItem of validated.scores) {
      // Upsert score
      const [existing] = await db
        .select()
        .from(roundScores)
        .where(
          and(
            eq(roundScores.teamId, scoreItem.teamId),
            eq(roundScores.roundId, scoreItem.roundId)
          )
        )
        .limit(1);

      if (existing) {
        await db
          .update(roundScores)
          .set({
            score: scoreItem.score,
            overrideAboveMax: scoreItem.overrideAboveMax,
            overrideReason: scoreItem.overrideReason || "",
            updatedAt: new Date(),
          })
          .where(eq(roundScores.id, existing.id));
      } else {
        await db.insert(roundScores).values({
          id: crypto.randomUUID(),
          triviaNightId,
          roundId: scoreItem.roundId,
          teamId: scoreItem.teamId,
          score: scoreItem.score,
          overrideAboveMax: scoreItem.overrideAboveMax,
          overrideReason: scoreItem.overrideReason || "",
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);
      }
    }

    const updatedScores = await db
      .select()
      .from(roundScores)
      .where(eq(roundScores.triviaNightId, triviaNightId));

    return c.json({ scores: updatedScores });
  } catch (error) {
    console.error("Bulk save scores error:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// ==========================================
// 6. BONUS POINTS ENDPOINTS
// ==========================================

const CreateBonusScoreSchema = z.object({
  teamId: z.string().uuid(),
  roundId: z.string().uuid().optional(),
  label: z.string().min(1),
  points: z.number().int().nonnegative(),
});

app.post("/api/trivia-nights/:id/bonus-scores", requireEditToken, async (c) => {
  const triviaNightId = c.req.param("id");
  try {
    const body = await c.req.json();
    const validated = CreateBonusScoreSchema.parse(body);

    const bId = crypto.randomUUID();
    await db.insert(bonusScores).values({
      id: bId,
      triviaNightId,
      teamId: validated.teamId,
      roundId: validated.roundId || null,
      label: validated.label,
      points: validated.points,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const [inserted] = await db.select().from(bonusScores).where(eq(bonusScores.id, bId));
    return c.json({ bonusScore: inserted }, 201);
  } catch (error) {
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

app.delete("/api/bonus-scores/:bonusScoreId", async (c) => {
  const bonusScoreId = c.req.param("bonusScoreId");
  try {
    // We bypass requireEditToken directly in middleware for single delete (usually query param verification)
    await db.delete(bonusScores).where(eq(bonusScores.id, bonusScoreId));
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// ==========================================
// 7. LEADERBOARDS ENDPOINTS
// ==========================================

app.get("/api/trivia-nights/:id/leaderboards", requirePresentOrEditToken, async (c) => {
  const triviaNightId = c.req.param("id") as string;
  try {
    const allRounds = await db.select().from(rounds).where(eq(rounds.triviaNightId, triviaNightId));
    const allTeams = await db.select().from(teams).where(eq(teams.triviaNightId, triviaNightId));
    const allScores = await db.select().from(roundScores).where(eq(roundScores.triviaNightId, triviaNightId));
    const allBonuses = await db.select().from(bonusScores).where(eq(bonusScores.triviaNightId, triviaNightId));

    const leaderboard = calculateLeaderboards(allTeams as any, allRounds as any, allScores as any, allBonuses as any);
    return c.json({ leaderboard, scores: allScores, bonusScores: allBonuses });
  } catch (error) {
    console.error("Leaderboard calculation error:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// ==========================================
// 8. TIEBREAKERS ENDPOINTS
// ==========================================

const TiebreakerBulkSchema = z.object({
  tiebreakers: z.array(
    z.object({
      id: z.string().uuid().optional(),
      prompt: z.string().min(1),
      answer: z.string().optional(),
      orderIndex: z.number().int(),
    })
  ),
});

app.post("/api/trivia-nights/:id/tiebreakers", requireEditToken, async (c) => {
  const triviaNightId = c.req.param("id") as string;
  try {
    const body = await c.req.json();
    const validated = TiebreakerBulkSchema.parse(body);

    const keptIds: string[] = [];

    for (const tb of validated.tiebreakers) {
      if (tb.id) {
        await db
          .update(tiebreakers)
          .set({
            prompt: tb.prompt,
            answer: tb.answer || "",
            orderIndex: tb.orderIndex,
          })
          .where(eq(tiebreakers.id, tb.id));
        keptIds.push(tb.id);
      } else {
        const tbId = crypto.randomUUID();
        await db.insert(tiebreakers).values({
          id: tbId,
          triviaNightId,
          prompt: tb.prompt,
          answer: tb.answer || "",
          orderIndex: tb.orderIndex,
        } as any);
        keptIds.push(tbId);
      }
    }

    const allCurrent = await db.select().from(tiebreakers).where(eq(tiebreakers.triviaNightId, triviaNightId));
    const idsToDelete = allCurrent.filter((t) => !keptIds.includes(t.id)).map((t) => t.id);
    if (idsToDelete.length > 0) {
      await db.delete(tiebreakers).where(inArray(tiebreakers.id, idsToDelete));
    }

    const updated = await db
      .select()
      .from(tiebreakers)
      .where(eq(tiebreakers.triviaNightId, triviaNightId))
      .orderBy(tiebreakers.orderIndex);

    return c.json({ tiebreakers: updated });
  } catch (error) {
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// ==========================================
// 9. PRINT AND PDF ENDPOINTS
// ==========================================

app.get("/api/print/rounds/:roundId/answer-sheet", async (c) => {
  const roundId = c.req.param("roundId");
  
  try {
    const [round] = await db.select().from(rounds).where(eq(rounds.id, roundId)).limit(1);
    if (!round) return c.json({ error: "Round not found" }, 404);

    const [trivia] = await db.select().from(triviaNights).where(eq(triviaNights.id, round.triviaNightId)).limit(1);
    if (!trivia) return c.json({ error: "Trivia Night not found" }, 404);

    const roundQ = await db.select().from(questions).where(eq(questions.roundId, roundId));
    const maxScore = calculateRoundMaxScore(roundQ as any);

    // PERSIST SELECTIONS FOR DETERMINISTIC REPRINTS
    let selections = await db
      .select({
        slotId: decorationSelections.slotId,
        fileUrl: decorativeAssets.fileUrl,
        sizeCategory: decorativeAssets.sizeCategory,
      })
      .from(decorationSelections)
      .innerJoin(decorativeAssets, eq(decorationSelections.assetId, decorativeAssets.id))
      .where(eq(decorationSelections.roundId, roundId));

    if (selections.length === 0) {
      // Allocate random cartoon assets matching required size limits
      const allAssets = await db.select().from(decorativeAssets);
      
      if (allAssets.length > 0) {
        const slots: ("header" | "side" | "footer")[] = ["header", "side", "footer"];
        
        for (const slot of slots) {
          // Select size
          const targetSize = slot === "header" ? "small" : slot === "side" ? "medium" : "large";
          const matching = allAssets.filter((a) => a.sizeCategory === targetSize);
          const poolArr = matching.length > 0 ? matching : allAssets;
          const randomAsset = poolArr[Math.floor(Math.random() * poolArr.length)];

          if (randomAsset) {
            await db.insert(decorationSelections).values({
              id: crypto.randomUUID(),
              roundId,
              slotId: slot,
              assetId: randomAsset.id,
              createdAt: new Date(),
            });
          }
        }

        // Fetch again
        selections = await db
          .select({
            slotId: decorationSelections.slotId,
            fileUrl: decorativeAssets.fileUrl,
            sizeCategory: decorativeAssets.sizeCategory,
          })
          .from(decorationSelections)
          .innerJoin(decorativeAssets, eq(decorationSelections.assetId, decorativeAssets.id))
          .where(eq(decorationSelections.roundId, roundId));
      }
    }

    const html = renderAnswerSheetHtml(round as any, trivia.branding, maxScore, selections as any);
    const isLandscape = round.answerSheetLayout === "landscape_20";
    const pdfBuffer = await generatePdfFromHtml(html, isLandscape);

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="answer-sheet-${round.title.replace(/\s+/g, "-").toLowerCase()}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return c.json({ error: "PDF Generation Failed: " + (error as Error).message }, 500);
  }
});

app.get("/api/print/rounds/:roundId/marking-guide", async (c) => {
  const roundId = c.req.param("roundId");
  try {
    const [round] = await db.select().from(rounds).where(eq(rounds.id, roundId)).limit(1);
    if (!round) return c.json({ error: "Round not found" }, 404);

    const [trivia] = await db.select().from(triviaNights).where(eq(triviaNights.id, round.triviaNightId)).limit(1);
    if (!trivia) return c.json({ error: "Trivia Night not found" }, 404);

    const roundQ = await db.select().from(questions).where(eq(questions.roundId, roundId));
    const maxScore = calculateRoundMaxScore(roundQ as any);

    const html = renderMarkingGuideHtml(round as any, trivia.branding, roundQ as any, maxScore);
    const pdfBuffer = await generatePdfFromHtml(html, false); // Marking guide is always portrait

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="marking-guide-${round.title.replace(/\s+/g, "-").toLowerCase()}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return c.json({ error: "PDF Generation Failed: " + (error as Error).message }, 500);
  }
});

app.get("/api/print/trivia-nights/:id/answer-sheets", async (c) => {
  const triviaNightId = c.req.param("id");
  try {
    const [trivia] = await db.select().from(triviaNights).where(eq(triviaNights.id, triviaNightId)).limit(1);
    if (!trivia) return c.json({ error: "Trivia Night not found" }, 404);

    const allRounds = await db
      .select()
      .from(rounds)
      .where(eq(rounds.triviaNightId, triviaNightId))
      .orderBy(rounds.orderIndex);

    const activeRounds = allRounds.filter((r) => r.type === "question_round");
    if (activeRounds.length === 0) return c.json({ error: "No printable rounds configured" }, 400);

    const roundsData = [];
    for (const round of activeRounds) {
      const roundQ = await db.select().from(questions).where(eq(questions.roundId, round.id));
      const maxScore = calculateRoundMaxScore(roundQ as any);

      // Fetch or allocate decorations
      let selections = await db
        .select({
          slotId: decorationSelections.slotId,
          fileUrl: decorativeAssets.fileUrl,
          sizeCategory: decorativeAssets.sizeCategory,
        })
        .from(decorationSelections)
        .innerJoin(decorativeAssets, eq(decorationSelections.assetId, decorativeAssets.id))
        .where(eq(decorationSelections.roundId, round.id));

      if (selections.length === 0) {
        const allAssets = await db.select().from(decorativeAssets);
        if (allAssets.length > 0) {
          const slots: ("header" | "side" | "footer")[] = ["header", "side", "footer"];
          for (const slot of slots) {
            const targetSize = slot === "header" ? "small" : slot === "side" ? "medium" : "large";
            const matching = allAssets.filter((a) => a.sizeCategory === targetSize);
            const poolArr = matching.length > 0 ? matching : allAssets;
            const randomAsset = poolArr[Math.floor(Math.random() * poolArr.length)];

            if (randomAsset) {
              await db.insert(decorationSelections).values({
                id: crypto.randomUUID(),
                roundId: round.id,
                slotId: slot,
                assetId: randomAsset.id,
                createdAt: new Date(),
              });
            }
          }
          // Fetch again
          selections = await db
            .select({
              slotId: decorationSelections.slotId,
              fileUrl: decorativeAssets.fileUrl,
              sizeCategory: decorativeAssets.sizeCategory,
            })
            .from(decorationSelections)
            .innerJoin(decorativeAssets, eq(decorationSelections.assetId, decorativeAssets.id))
            .where(eq(decorationSelections.roundId, round.id));
        }
      }

      roundsData.push({
        round: round as any,
        branding: trivia.branding as any,
        maxScore,
        decorations: selections as any,
      });
    }

    const html = renderCombinedAnswerSheetsHtml(roundsData);
    const isLandscape = activeRounds.length > 0 && activeRounds[0]?.answerSheetLayout === "landscape_20";
    const pdfBuffer = await generatePdfFromHtml(html, isLandscape);

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="answer-sheets-package-${trivia.title.replace(/\s+/g, "-").toLowerCase()}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF package generation error:", error);
    return c.json({ error: "PDF Generation Failed: " + (error as Error).message }, 500);
  }
});

app.get("/api/print/trivia-nights/:id/marking-guides", async (c) => {
  const triviaNightId = c.req.param("id");
  try {
    const [trivia] = await db.select().from(triviaNights).where(eq(triviaNights.id, triviaNightId)).limit(1);
    if (!trivia) return c.json({ error: "Trivia Night not found" }, 404);

    const allRounds = await db
      .select()
      .from(rounds)
      .where(eq(rounds.triviaNightId, triviaNightId))
      .orderBy(rounds.orderIndex);

    const activeRounds = allRounds.filter((r) => r.type === "question_round");
    if (activeRounds.length === 0) return c.json({ error: "No printable rounds configured" }, 400);

    const roundsData = [];
    for (const round of activeRounds) {
      const roundQ = await db.select().from(questions).where(eq(questions.roundId, round.id));
      const maxScore = calculateRoundMaxScore(roundQ as any);

      roundsData.push({
        round: round as any,
        branding: trivia.branding as any,
        questions: roundQ as any,
        maxScore,
      });
    }

    const html = renderCombinedMarkingGuidesHtml(roundsData);
    const pdfBuffer = await generatePdfFromHtml(html, false); // Marking guides package is portrait

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="marking-guides-package-${trivia.title.replace(/\s+/g, "-").toLowerCase()}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF package generation error:", error);
    return c.json({ error: "PDF Generation Failed: " + (error as Error).message }, 500);
  }
});

// Start Server
const port = 3001;
console.log(`Hono API Server starting on port ${port}...`);
serve({
  fetch: app.fetch,
  port,
});
