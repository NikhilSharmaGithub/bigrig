import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

const COOKIE = "brc_session";
const THIRTY_DAYS = 60 * 60 * 24 * 30;
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-insecure-secret-change-me",
);

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createSession(userId: string): Promise<void> {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);

  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function getSession(): Promise<{ userId: string } | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return typeof payload.sub === "string" ? { userId: payload.sub } : null;
  } catch {
    return null;
  }
}

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: "customer" | "pro" | "admin";
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session) return null;
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.userId),
    columns: { id: true, email: true, name: true, role: true },
  });
  return user ?? null;
}

/** For protected pages: returns the user or redirects to /login. */
export async function requireUser(redirectTo = "/login"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(redirectTo);
  return user;
}

/** Emails allowed into the admin panel (owner allowlist). */
function adminEmailAllowlist(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Is this email on the admin owner allowlist? */
export function isAdminEmail(email: string): boolean {
  return adminEmailAllowlist().includes(email.trim().toLowerCase());
}

/**
 * Is this user an admin? If ADMIN_EMAILS is set, ONLY those emails qualify
 * (the role column is ignored), so a stray `role='admin'` row can't grant
 * access. If the allowlist is empty, fall back to the role check.
 */
export function isUserAdmin(user: Pick<SessionUser, "email" | "role">): boolean {
  const allowlist = adminEmailAllowlist();
  if (allowlist.length > 0) {
    return allowlist.includes(user.email.toLowerCase());
  }
  return user.role === "admin";
}

/** For admin pages: requires the owner (per ADMIN_EMAILS allowlist). */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin-login");
  if (!isUserAdmin(user)) redirect("/");
  return user;
}
