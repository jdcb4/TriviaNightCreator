import { createHash, randomBytes } from "crypto";

/**
 * Hashes a raw token with SHA-256 to ensure safe storage in the database.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Generates a high-entropy raw token with the specified prefix.
 */
export function generateToken(prefix: "edit" | "present"): string {
  return `${prefix}_${randomBytes(24).toString("hex")}`;
}
