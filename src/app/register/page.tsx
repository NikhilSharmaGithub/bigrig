import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Create Account" };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/account");

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-3xl font-bold uppercase text-steel-900">
        Create Account
      </h1>
      <p className="mt-1 text-steel-500">
        Faster checkout, order tracking, and fleet pricing with BRC Pro.
      </p>
      <div className="mt-8 rounded-xl border border-border bg-white p-6 shadow-sm">
        <AuthForm mode="register" />
      </div>
    </div>
  );
}
