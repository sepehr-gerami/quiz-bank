// lib/roles.ts  (بدون server-only، که کلاینت هم بتونه import کنه)
export type UserRole = "admin" | "teacher" | "user";

export const HOME_BY_ROLE: Record<UserRole, string> = {
  admin: "/admin",
  teacher: "/admin", // اگه بعداً پنل جدا خواستی فقط همین خط عوض میشه
  user: "/quizzes",
};