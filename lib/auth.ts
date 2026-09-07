import crypto from "node:crypto";

export const SESSION_COOKIE_NAME = "flashycardy_session";
const SESSION_SECRET = process.env.AUTH_SECRET ?? "change-me-in-production";

export function hashPassword(password: string) {
  return crypto
    .pbkdf2Sync(password, "flashycardy-salt", 100000, 64, "sha512")
    .toString("hex");
}

export function verifyPassword(password: string, passwordHash: string) {
  return hashPassword(password) === passwordHash;
}

export function createSessionToken(userId: string) {
  const payload = JSON.stringify({ userId, issuedAt: Date.now() });
  const encodedPayload = Buffer.from(payload, "utf8").toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string | undefined) {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(encodedPayload)
    .digest("base64url");

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));

    return typeof payload.userId === "string" ? payload.userId : null;
  } catch {
    return null;
  }
}
