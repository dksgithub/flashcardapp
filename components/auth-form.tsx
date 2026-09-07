"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function AuthForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const endpoint = mode === "signin" ? "/api/auth/signin" : "/api/auth/signup";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Authentication failed.");
      }

      window.location.href = "/dashboard";
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/20 backdrop-blur">
      <div className="mb-5 flex gap-2 rounded-full border border-white/10 bg-slate-950/50 p-1">
        <button
          type="button"
          className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
            mode === "signin" ? "bg-white text-slate-900" : "text-slate-300 hover:text-white"
          }`}
          onClick={() => setMode("signin")}
        >
          Sign In
        </button>
        <button
          type="button"
          className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
            mode === "signup" ? "bg-white text-slate-900" : "text-slate-300 hover:text-white"
          }`}
          onClick={() => setMode("signup")}
        >
          Sign Up
        </button>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {mode === "signup" ? (
          <div>
            <label htmlFor="name" className="mb-2 block text-sm text-slate-200">
              Full name
            </label>
            <input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Jane Doe"
              className="w-full rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-2 text-slate-50 outline-none ring-0 transition focus:border-sky-400"
              required
            />
          </div>
        ) : null}

        <div>
          <label htmlFor="email" className="mb-2 block text-sm text-slate-200">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-2 text-slate-50 outline-none ring-0 transition focus:border-sky-400"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm text-slate-200">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-2 text-slate-50 outline-none ring-0 transition focus:border-sky-400"
            required
          />
        </div>

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
        </Button>
      </form>
    </div>
  );
}
