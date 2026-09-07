import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { DashboardShell } from "@/frontend/components/dashboard-shell";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/backend/lib/auth";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const userId = verifySessionToken(sessionValue);

  if (!userId) {
    redirect("/");
  }

  return <DashboardShell />;
}
