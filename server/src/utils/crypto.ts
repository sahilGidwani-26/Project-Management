import crypto from "crypto";

export function generateRawToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}
