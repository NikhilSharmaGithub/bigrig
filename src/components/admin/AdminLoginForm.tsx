"use client";

import { useActionState } from "react";
import { adminLoginAction, type AuthState } from "@/app/actions/auth";

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    adminLoginAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-steel-300">
          Admin email
        </span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-md border border-steel-700 bg-steel-800 px-3 py-2.5 text-sm text-white placeholder:text-steel-500 focus:outline-none focus:ring-2 focus:ring-brand"
          placeholder="you@yourcompany.com"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-steel-300">
          Password
        </span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-md border border-steel-700 bg-steel-800 px-3 py-2.5 text-sm text-white placeholder:text-steel-500 focus:outline-none focus:ring-2 focus:ring-brand"
          placeholder="••••••••"
        />
      </label>

      {state.error && (
        <p className="rounded-md bg-danger/15 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-brand px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-dark disabled:bg-steel-600"
      >
        {pending ? "Verifying…" : "Enter Admin Panel"}
      </button>
    </form>
  );
}
