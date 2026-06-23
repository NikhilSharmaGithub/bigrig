import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Logo } from "@/components/brand/Logo";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { getCurrentUser, isUserAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Admin Sign In",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const user = await getCurrentUser();
  if (user && isUserAdmin(user)) redirect("/admin");

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-steel-950 px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo variant="light" />
        </div>
        <div className="rounded-xl border border-steel-800 bg-steel-900 p-8 shadow-2xl">
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-white">
            Admin Access
          </h1>
          <p className="mt-1 text-sm text-steel-400">
            Owner only. This area is restricted to authorized accounts.
          </p>
          <div className="mt-6">
            <AdminLoginForm />
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-steel-500">
          Not an admin?{" "}
          <a href="/" className="text-steel-400 hover:text-white">
            Return to store
          </a>
        </p>
      </div>
    </div>
  );
}
