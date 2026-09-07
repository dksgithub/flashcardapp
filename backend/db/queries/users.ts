import { desc, eq } from "drizzle-orm";

import { db } from "@/backend/db/client";
import { users } from "@/backend/db/schema";
import { verifyPassword } from "@/backend/lib/auth";

export async function getUserById(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  return user ?? null;
}

export async function getUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  return user ?? null;
}

export async function getAllUsers() {
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function createUser(input: {
  email: string;
  name: string;
  passwordHash: string;
  accountType?: "free" | "pro";
  subscriptionStatus?: "active" | "inactive";
  monthlyFee?: number;
}) {
  const accountType = input.accountType ?? "free";
  const [user] = await db
    .insert(users)
    .values({
      email: input.email,
      name: input.name,
      passwordHash: input.passwordHash,
      accountType,
      subscriptionStatus: input.subscriptionStatus ?? (accountType === "pro" ? "active" : "inactive"),
      monthlyFee: input.monthlyFee ?? (accountType === "pro" ? 20 : 0),
    })
    .returning();

  return user ?? null;
}

export async function updateUserPlan(userId: string, input: { accountType: "free" | "pro"; monthlyFee?: number }) {
  const [user] = await db
    .update(users)
    .set({
      accountType: input.accountType,
      subscriptionStatus: input.accountType === "pro" ? "active" : "inactive",
      monthlyFee: input.monthlyFee ?? (input.accountType === "pro" ? 20 : 0),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  return user ?? null;
}

export async function verifyUserCredentials(input: { email: string; password: string }) {
  const user = await getUserByEmail(input.email.toLowerCase());

  if (!user) {
    return null;
  }

  return verifyPassword(input.password, user.passwordHash) ? user : null;
}
