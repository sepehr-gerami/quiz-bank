
import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";

import { db } from "@/db";
import { sessions, users } from "@/db/schema";

export const SESSION_COOKIE = "qb_session";

const SESSION_DAYS = 7;

export type UserRole = "admin" | "teacher" | "user";

export type SessionUser = {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
};

/**
 * دریافت کاربر فعلی براساس نشست معتبر و نقش ذخیره‌شده در دیتابیس.
 */
export const getCurrentUser = cache(
  async (): Promise<SessionUser | null> => {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;

    if (!token) {
      return null;
    }

    const rows = await db
      .select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        role: users.role,
      })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(
        and(
          eq(sessions.token, token),
          gt(sessions.expiresAt, new Date()),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  },
);

/**
 * ایجاد نشست جدید برای کاربر.
 */
export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");

  const expiresAt = new Date(
    Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  );

  await db.insert(sessions).values({
    token,
    userId,
    expiresAt,
  });

  const store = await cookies();

  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

/**
 * حذف نشست فعلی از دیتابیس و مرورگر.
 */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (token) {
    await db.delete(sessions).where(eq(sessions.token, token));
  }

  store.delete(SESSION_COOKIE);
}

/**
 * محافظ مسیرهایی که ورود برای آن‌ها کافی است.
 * این تابع به‌تنهایی نقش کاربر را محدود نمی‌کند.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

/**
 * محافظ پنل معلم.
 * معلم و ادمین مجاز هستند؛ دانش‌آموز اجازه ورود ندارد.
 */
export async function requireTeacherOrAdmin(): Promise<SessionUser> {
  const user = await requireUser();

  if (user.role !== "teacher" && user.role !== "admin") {
    redirect("/quizzes");
  }

  return user;
}

/**
 * محافظ مخصوص پنل مدیریت کل سایت.
 * معلم نمی‌تواند با این تابع به اختیارات ادمین دسترسی پیدا کند.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();

  if (user.role !== "admin") {
    redirect(user.role === "teacher" ? "/teacher" : "/quizzes");
  }

  return user;
}
