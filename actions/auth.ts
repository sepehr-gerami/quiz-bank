
"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, destroySession } from "@/lib/auth";

const usernameSchema = z
  .string()
  .min(4, "نام کاربری باید حداقل ۴ نویسه باشد.")
  .max(32, "نام کاربری حداکثر ۳۲ نویسه است.")
  .regex(
    /^[\w.]+$/,
    "نام کاربری فقط می‌تواند شامل حروف لاتین، عدد، «_» و «.» باشد.",
  );

const passwordSchema = z
  .string()
  .min(8, "گذرواژه باید حداقل ۸ نویسه باشد.")
  .max(72, "گذرواژه حداکثر ۷۲ نویسه است.");

const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "نام و نام خانوادگی الزامی است.")
    .max(120, "نام و نام خانوادگی حداکثر ۱۲۰ نویسه است."),

  username: usernameSchema,
  password: passwordSchema,

  // ثبت‌نام عمومی فقط اجازه انتخاب دانش‌آموز یا معلم را می‌دهد.
  role: z.enum(["user", "teacher"]).default("user"),
});

const loginSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

function backWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

function getRedirectPath(role: "admin" | "teacher" | "user"): string {
  if (role === "admin") return "/admin";
  if (role === "teacher") return "/teacher";
  return "/quizzes";
}

export async function registerAction(formData: FormData): Promise<void> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    username: formData.get("username"),
    password: formData.get("password"),
    role: formData.get("role") ?? undefined,
  });

  if (!parsed.success) {
    backWithError(
      "/register",
      parsed.error.issues[0]?.message ?? "اطلاعات واردشده معتبر نیست.",
    );
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, parsed.data.username))
    .limit(1);

  if (existing.length > 0) {
    backWithError("/register", "این نام کاربری قبلاً ثبت شده است.");
  }

  let createdUser: { id: string };

  try {
    const [created] = await db
      .insert(users)
      .values({
        username: parsed.data.username,
        fullName: parsed.data.fullName,
        passwordHash: await hashPassword(parsed.data.password),
        role: parsed.data.role,
      })
      .returning({ id: users.id });

    if (!created) {
      throw new Error("ساخت حساب کاربری انجام نشد.");
    }

    createdUser = created;
  } catch (error) {
    if (isUniqueViolation(error)) {
      backWithError("/register", "این نام کاربری قبلاً ثبت شده است.");
    }

    throw error;
  }

  await createSession(createdUser.id);

  redirect(getRedirectPath(parsed.data.role));
}

export async function loginAction(formData: FormData): Promise<void> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    backWithError(
      "/login",
      parsed.error.issues[0]?.message ?? "اطلاعات ورود معتبر نیست.",
    );
  }

  const rows = await db
    .select({
      id: users.id,
      passwordHash: users.passwordHash,
      role: users.role,
    })
    .from(users)
    .where(eq(users.username, parsed.data.username))
    .limit(1);

  const user = rows[0];

  if (!user) {
    backWithError("/login", "نام کاربری یا گذرواژه اشتباه است.");
  }

  const passwordIsValid = await verifyPassword(
    parsed.data.password,
    user.passwordHash,
  );

  if (!passwordIsValid) {
    backWithError("/login", "نام کاربری یا گذرواژه اشتباه است.");
  }

  await createSession(user.id);

  redirect(getRedirectPath(user.role));
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
