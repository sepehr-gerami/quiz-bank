import Link from "next/link";
import {
  GraduationCap,
  LayoutDashboard,
  LogIn,
  LogOut,
  UserRound,
} from "lucide-react";

import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";

import {
  MobileNavLinks,
  NavLinks,
  type NavItem,
} from "@/components/site-header";

import { ScrollHeader } from "@/components/scroll-header";

export default async function Header() {
  const user = await getCurrentUser();

  const items: NavItem[] = [
    { href: "/", label: "خانه" },
    { href: "/quizzes", label: "آزمون‌ها" },

    ...(user
      ? [
          { href: "/results", label: "نتایج من" },
          { href: "/requests", label: "درخواست‌ها" },
        ]
      : []),

    ...(user?.role === "admin"
      ? [{ href: "/admin", label: "پنل مدیریت" }]
      : []),
  ];

  return (
    <ScrollHeader>
      {/* لوگو و لینک‌های اصلی */}
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-6">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5"
          >
            <span className="grid size-10 place-items-center rounded-2xl bg-linear-to-br from-indigo-600 to-sky-600 text-white shadow-lg shadow-indigo-600/25">
              <GraduationCap className="size-5" />
            </span>

            <span className="text-lg font-extrabold tracking-tight text-stone-900">
              بانک سؤال
            </span>
          </Link>

          <NavLinks items={items} />
        </div>

        {/* حساب کاربری و دکمه‌ها */}
        <div className="flex shrink-0 items-center gap-2">
          {user ? (
            <>
              {user.role === "admin" ? (
                <Link
                  href="/admin"
                  className="btn-ghost hidden sm:inline-flex"
                  title="پنل مدیریت"
                  aria-label="پنل مدیریت"
                >
                  <LayoutDashboard className="size-4" />
                </Link>
              ) : null}

              <span className="hidden items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-stone-700 sm:inline-flex">
                <UserRound className="size-4 text-indigo-500" />
                {user.fullName || user.username}
              </span>

              <form action={logoutAction}>
                <button
                  type="submit"
                  className="btn-ghost"
                  title="خروج از حساب"
                >
                  <LogOut className="size-4" />
                  <span className="hidden sm:inline">
                    خروج
                  </span>
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">
                <LogIn className="size-4" />
                <span>ورود</span>
              </Link>

              <Link href="/register" className="btn-primary">
                ثبت‌نام
              </Link>
            </>
          )}
        </div>
      </div>

      {/* منوی موبایل */}
      <MobileNavLinks items={items} />
    </ScrollHeader>
  );
}