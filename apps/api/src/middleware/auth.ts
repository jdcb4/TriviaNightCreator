import type { Context, Next } from "hono";
import { db, accessTokens, rounds, eq, and } from "@trivia/db";
import { hashToken } from "../utils/crypto.js";

/**
 * Resolves the triviaNightId from the request context.
 * Queries the rounds table if only roundId or a rounds route ID is available.
 */
async function getTriviaNightId(c: Context): Promise<string | null> {
  const triviaNightId = c.req.param("triviaNightId");
  if (triviaNightId) return triviaNightId;

  const id = c.req.param("id");
  const roundId = c.req.param("roundId");
  const path = c.req.path;

  if (roundId) {
    const [round] = await db
      .select({ triviaNightId: rounds.triviaNightId })
      .from(rounds)
      .where(eq(rounds.id, roundId))
      .limit(1);
    return round?.triviaNightId || null;
  }

  if (id) {
    if (path.includes("/rounds/")) {
      const [round] = await db
        .select({ triviaNightId: rounds.triviaNightId })
        .from(rounds)
        .where(eq(rounds.id, id))
        .limit(1);
      return round?.triviaNightId || null;
    }
    return id;
  }

  return null;
}

/**
 * Validates the access token in headers (X-Trivia-Token) or query params (?token).
 * Returns the matching access token type or null.
 */
async function getValidatedToken(c: Context, triviaNightId: string): Promise<string | null> {
  const token = c.req.header("X-Trivia-Token") || c.req.query("token");
  if (!token) return null;

  const hashed = hashToken(token);
  
  // Find in DB
  const [tokenRecord] = await db
    .select()
    .from(accessTokens)
    .where(
      and(
        eq(accessTokens.triviaNightId, triviaNightId),
        eq(accessTokens.tokenHash, hashed)
      )
    )
    .limit(1);

  if (!tokenRecord || tokenRecord.revokedAt) {
    return null;
  }

  return tokenRecord.accessType;
}

/**
 * Middleware ensuring the client holds an "edit" access token.
 */
export async function requireEditToken(c: Context, next: Next) {
  const triviaNightId = await getTriviaNightId(c);
  if (!triviaNightId) {
    return c.json({ error: "Missing trivia night ID context" }, 400);
  }

  const accessType = await getValidatedToken(c, triviaNightId);
  if (accessType !== "edit") {
    return c.json({ error: "Unauthorized: Requires write access token" }, 401);
  }

  await next();
}

/**
 * Middleware ensuring the client holds either an "edit" or a "present" access token.
 */
export async function requirePresentOrEditToken(c: Context, next: Next) {
  const triviaNightId = await getTriviaNightId(c);
  if (!triviaNightId) {
    return c.json({ error: "Missing trivia night ID context" }, 400);
  }

  const accessType = await getValidatedToken(c, triviaNightId);
  if (accessType !== "edit" && accessType !== "present") {
    return c.json({ error: "Unauthorized: Requires presentation or edit access token" }, 401);
  }

  // Set the validated access scope on context so routes can check if they are in editor mode
  c.set("accessType", accessType);

  await next();
}

