import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ADMIN_SESSION_COOKIE_NAME } from "@/lib/admin-auth-constants";

const SESSION_LIFETIME_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = {
  sub: "owner";
  exp: number;
};

function getSessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? "";
}

function getPasswordHash(): string {
  return process.env.ADMIN_PASSWORD_HASH ?? "";
}

function signPayload(payloadBase64: string, secret: string): string {
  return createHmac("sha256", secret).update(payloadBase64).digest("base64url");
}

function createSessionToken(): string {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET ist nicht gesetzt.");
  }

  const payload: SessionPayload = {
    sub: "owner",
    exp: Math.floor(Date.now() / 1000) + SESSION_LIFETIME_SECONDS,
  };
  const payloadBase64 = Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url");
  const signature = signPayload(payloadBase64, secret);
  return `${payloadBase64}.${signature}`;
}

function verifySessionToken(token: string): boolean {
  const secret = getSessionSecret();
  if (!secret) {
    return false;
  }

  const [payloadBase64, signature] = token.split(".");
  if (!payloadBase64 || !signature) {
    return false;
  }

  const expected = signPayload(payloadBase64, secret);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }
  if (!timingSafeEqual(actualBuffer, expectedBuffer)) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadBase64, "base64url").toString("utf-8")) as SessionPayload;
    if (payload.sub !== "owner") {
      return false;
    }
    return payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function isAdminSessionTokenValid(token: string | undefined): boolean {
  if (!token) {
    return false;
  }
  return verifySessionToken(token);
}

export async function verifyOwnerPassword(password: string): Promise<boolean> {
  const hash = getPasswordHash();
  if (!hash) {
    return false;
  }
  return bcrypt.compare(password, hash);
}

export async function createAdminSession(): Promise<void> {
  const token = createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set({
    name: ADMIN_SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_LIFETIME_SECONDS,
  });
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE_NAME);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  return isAdminSessionTokenValid(token);
}

export async function requireAdminAuth(): Promise<void> {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    redirect("/admin/login");
  }
}
