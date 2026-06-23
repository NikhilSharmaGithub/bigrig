"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  createSession,
  destroySession,
  hashPassword,
  isAdminEmail,
  verifyPassword,
} from "@/lib/auth";
import { mergeGuestCartIntoUser } from "@/lib/cart";
import { sendWelcomeEmail } from "@/lib/email";

export type AuthState = { error?: string };

function clean(v: FormDataEntryValue | null): string {
  return String(v ?? "").trim();
}

export async function registerAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const name = clean(formData.get("name"));
  const email = clean(formData.get("email")).toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: { id: true },
  });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const [user] = await db
    .insert(users)
    .values({
      email,
      name: name || null,
      passwordHash: await hashPassword(password),
    })
    .returning({ id: users.id });

  await createSession(user.id);
  await mergeGuestCartIntoUser(user.id);
  void sendWelcomeEmail(email, name || null);
  redirect("/account");
}

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = clean(formData.get("email")).toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: { id: true, passwordHash: true },
  });
  if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Invalid email or password." };
  }

  await createSession(user.id);
  await mergeGuestCartIntoUser(user.id);
  redirect("/account");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}

/**
 * Admin entrance. Only emails on the ADMIN_EMAILS allowlist may proceed.
 * First time the owner signs in (no account yet), this creates their admin
 * account with the password they enter — so nobody else can ever get in.
 */
export async function adminLoginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = clean(formData.get("email")).toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }
  // Don't reveal whether an account exists — non-owners are simply rejected.
  if (!isAdminEmail(email)) {
    return { error: "This account is not authorized for admin access." };
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existing) {
    if (
      !existing.passwordHash ||
      !(await verifyPassword(password, existing.passwordHash))
    ) {
      return { error: "Invalid email or password." };
    }
    if (existing.role !== "admin") {
      await db
        .update(users)
        .set({ role: "admin" })
        .where(eq(users.id, existing.id));
    }
    await createSession(existing.id);
  } else {
    if (password.length < 8) {
      return { error: "Choose a password with at least 8 characters." };
    }
    const [created] = await db
      .insert(users)
      .values({
        email,
        name: "Owner",
        role: "admin",
        passwordHash: await hashPassword(password),
      })
      .returning({ id: users.id });
    await createSession(created.id);
  }

  redirect("/admin");
}
