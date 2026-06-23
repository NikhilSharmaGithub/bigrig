"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  loginAction,
  registerAction,
  type AuthState,
} from "@/app/actions/auth";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      {mode === "register" && (
        <Field label="Full name">
          <input
            name="name"
            type="text"
            autoComplete="name"
            className="input"
            placeholder="Jane Driver"
          />
        </Field>
      )}

      <Field label="Email">
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="input"
          placeholder="you@fleet.com"
        />
      </Field>

      <Field label="Password">
        <input
          name="password"
          type="password"
          required
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className="input"
          placeholder="••••••••"
        />
      </Field>

      {state.error && (
        <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-brand px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-dark disabled:bg-steel-400"
      >
        {pending
          ? "Please wait…"
          : mode === "login"
            ? "Sign In"
            : "Create Account"}
      </button>

      <p className="text-center text-sm text-steel-500">
        {mode === "login" ? (
          <>
            New to Big Rig?{" "}
            <Link href="/register" className="font-semibold text-brand hover:underline">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-brand hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.375rem;
          border: 1px solid var(--color-border);
          background: #fff;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          color: var(--color-steel-900);
        }
        .input:focus { outline: none; box-shadow: 0 0 0 2px var(--color-brand); }
      `}</style>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-steel-700">
        {label}
      </span>
      {children}
    </label>
  );
}
