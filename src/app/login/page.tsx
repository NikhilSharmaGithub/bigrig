import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign In" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/account");

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-3xl font-bold uppercase text-steel-900">
        Sign In
      </h1>
      <p className="mt-1 text-steel-500">
        Access your orders, returns, and saved vehicles.
      </p>
      <div className="mt-8 rounded-xl border border-border bg-white p-6 shadow-sm">
        <AuthForm mode="login" />
      </div>
    </div>
  );
}
