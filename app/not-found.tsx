import Link from "next/link";
import {
  ArrowLeft,
  CircleHelp,
  ClipboardList,
  GraduationCap,
  Home,
  Inbox,
  Search,
} from "lucide-react";
import { Card } from "@/components/ui";
import { faDigits } from "@/lib/format";

export default function NotFound() {
  const links = [
    {
      href: "/",
      label: "خانه",
      hint: "آمار پلتفرم و آزمون‌های تازه",
      icon: Home,
    },
    {
      href: "/quizzes",
      label: "آزمون‌ها",
      hint: "لیست آزمون‌های منتشرشده",
      icon: ClipboardList,
    },
    {
      href: "/results",
      label: "نتایج من",
      hint: "کارنامه‌ها و آزمون‌های ناتمام",
      icon: Search,
    },
    {
      href: "/requests",
      label: "درخواست‌ها",
      hint: "ثبت درخواست موضوع یا آزمون",
      icon: Inbox,
    },
  ];

  return (
    <main className="relative flex-1 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 pattern-tile-dark opacity-60" />
      <div className="pointer-events-none absolute -top-40 left-1/2 size-144 -translate-x-1/2 rounded-full bg-linear-to-br from-indigo-200/60 via-violet-200/50 to-fuchsia-200/40 blur-3xl" />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-4 py-16 sm:px-6 sm:py-24">
        <div className="animate-float relative">
          <div className="pattern-tile grid size-32 place-items-center rounded-4xl bg-linear-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-2xl shadow-indigo-600/30 sm:size-40">
            <GraduationCap className="size-14 sm:size-16" />
          </div>
          <span className="absolute -bottom-3 -left-3 grid size-14 place-items-center rounded-2xl border border-stone-200/80 bg-white text-2xl font-black text-indigo-700 shadow-lg shadow-indigo-600/10 sm:size-16 sm:text-3xl">
            {faDigits(404)}
          </span>
        </div>

        <div className="stagger mt-10 flex flex-col items-center text-center">
          <span className="badge border border-rose-200 bg-rose-50 text-rose-600">
            <CircleHelp className="size-3.5" />
            صفحه پیدا نشد
          </span>

          <h1 className="mt-4 text-2xl font-black text-stone-900 sm:text-3xl">
            این صفحه در بانک سؤال ثبت نشده است!
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-stone-500">
            ممکن است نشانی را اشتباه وارد کرده باشید، آزمون مورد نظر حذف یا
            منتشرنشده باشد، یا لینک قدیمی شده باشد. نگران نباشید — با یکی از
            مسیرهای زیر ادامه دهید.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href={"/"} className="btn-primary px-6 py-3 text-base">
              <Home className="size-5" />
              بازگشت به خانه
            </Link>
            <Link href={"/quizzes"} className="btn-secondary px-6 py-3 text-base">
              <ClipboardList className="size-5" />
              مشاهدهٔ آزمون‌ها
            </Link>
          </div>
        </div>

        <div className="stagger mt-12 grid w-full gap-4 sm:grid-cols-2">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="group">
              <Card className="flex h-full items-center gap-4 p-4 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-indigo-300 group-hover:shadow-lg group-hover:shadow-indigo-600/10">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <l.icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-extrabold text-stone-900 group-hover:text-indigo-700">
                    {l.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-stone-400">
                    {l.hint}
                  </span>
                </span>
                <ArrowLeft className="size-4 shrink-0 text-stone-300 group-hover:text-indigo-500" />
              </Card>
            </Link>
          ))}
        </div>

        <p className="mt-10 text-center text-xs leading-6 text-stone-400">
          اگر مطمئن هستید این نشانی درست است، موضوع را از بخش{" "}
          <Link href={"/requests"} className="font-bold text-indigo-600">
            درخواست‌ها
          </Link>{" "}
          اطلاع دهید تا بررسی شود.
        </p>
      </div>
    </main>
  );
}