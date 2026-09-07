import { desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { users } from "@/db/schema";
import { verifyPassword } from "@/lib/auth";

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
}) {
  const [user] = await db
    .insert(users)
    .values({
      email: input.email,
      name: input.name,
      passwordHash: input.passwordHash,
    })
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
