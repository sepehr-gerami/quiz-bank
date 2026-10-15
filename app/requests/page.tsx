import { desc, eq } from "drizzle-orm";
import {
  ArrowUpLeft,
  CalendarDays,
  CheckCircle2,
  Inbox,
  Lightbulb,
  MessageSquareText,
  Send,
} from "lucide-react";

import { db } from "@/db";
import { requests } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { createRequestAction } from "@/actions/requests";
import { RequestTypeSelect } from "@/components/request-type-select";
import {
  Badge,
  EmptyState,
  Flash,
  PageHeader,
} from "@/components/ui";
import { faDate } from "@/lib/format";
import { first, type SearchParams } from "@/lib/queries";
import {
  REQUEST_STATUS_ICON,
  REQUEST_STATUS_LABEL,
  REQUEST_TYPE_LABEL,
} from "@/lib/constants";

export const metadata = {
  title: "درخواست‌های من",
};

const statusTone = {
  pending: "amber",
  approved: "emerald",
  rejected: "rose",
} as const;

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireUser();

  const sp = await searchParams;
  const error = first(sp.error);
  const ok = first(sp.ok) === "1";

  const rows = await db
    .select({
      id: requests.id,
      type: requests.type,
      title: requests.title,
      body: requests.body,
      status: requests.status,
      adminNote: requests.adminNote,
      createdAt: requests.createdAt,
    })
    .from(requests)
    .where(eq(requests.userId, user.id))
    .orderBy(desc(requests.createdAt))
    .limit(50);

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-slate-50/80">
      {/* Background decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-linear-to-b from-indigo-100/65 via-blue-50/35 to-transparent"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 right-[-100px] -z-10 size-80 rounded-full bg-blue-200/25 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-64 left-[-120px] -z-10 size-72 rounded-full bg-indigo-200/20 blur-3xl"
      />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:py-14">
        <PageHeader
          icon={Lightbulb}
          title="درخواست‌های من"
          subtitle="ایده‌ها و پیشنهادهای آموزشی خود را ثبت کنید و وضعیت بررسی آن‌ها را پیگیری کنید."
        />

        <div className="mt-6">
          <Flash
            error={error}
            ok={ok}
            okText="درخواست شما با موفقیت ثبت شد و در صف بررسی ادمین قرار گرفت."
          />
        </div>

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-8">
          {/* New request form */}
          <section className="min-w-0">
            <div className="overflow-visible rounded-3xl border border-white/80 bg-white/75 p-5 shadow-xl shadow-slate-200/50 backdrop-blur-2xl sm:p-7">
              {/* Form heading */}
              <div className="mb-7 flex items-start gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/20">
                  <MessageSquareText className="size-5" />
                </div>

                <div className="min-w-0 flex-1 pt-0.5">
                  <h2 className="text-lg font-black tracking-tight text-slate-900">
                    ثبت درخواست جدید
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    پیشنهادتان را با جزئیات بنویسید.
                  </p>
                </div>
              </div>

              <form action={createRequestAction} className="space-y-5">
                {/* Request type */}
                <div>
                  <label
                    htmlFor="type"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    نوع درخواست
                    <span className="mr-1 text-rose-500">*</span>
                  </label>

                  <RequestTypeSelect />
                </div>

                {/* Request title */}
                <div>
                  <label
                    htmlFor="title"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    عنوان درخواست
                    <span className="mr-1 text-rose-500">*</span>
                  </label>

                  <input
                    id="title"
                    name="title"
                    type="text"
                    required
                    minLength={3}
                    maxLength={200}
                    placeholder="مثلاً آزمون جامع ادبیات فارسی"
                    className="w-full rounded-2xl border border-slate-200/90 bg-white/65 px-4 py-3.5 text-sm text-slate-800 outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  />

                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    عنوانی کوتاه و واضح برای درخواست خود انتخاب کنید.
                  </p>
                </div>

                {/* Request description */}
                <div>
                  <label
                    htmlFor="body"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    توضیحات درخواست
                    <span className="mr-1 text-rose-500">*</span>
                  </label>

                  <textarea
                    id="body"
                    name="body"
                    rows={5}
                    required
                    minLength={10}
                    maxLength={5000}
                    placeholder="چه محتوایی نیاز دارید؟ موضوع، سرفصل‌ها و جزئیات موردنظرتان را بنویسید..."
                    className="w-full resize-y rounded-2xl border border-slate-200/90 bg-white/65 px-4 py-3.5 text-sm leading-7 text-slate-800 outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  />

                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    هرچه جزئیات بیشتری ارائه دهید، بررسی درخواست آسان‌تر می‌شود.
                  </p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-l from-indigo-600 to-blue-600 px-5 py-4 text-sm font-extrabold text-white shadow-lg shadow-indigo-500/20 transition duration-200 hover:-translate-y-0.5 hover:from-indigo-700 hover:to-blue-700 hover:shadow-xl hover:shadow-indigo-500/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/25 active:translate-y-0"
                >
                  <Send className="size-4 transition-transform duration-200 group-hover:-translate-x-1" />
                  ارسال درخواست
                  <ArrowUpLeft className="mr-auto size-4 opacity-70 transition-transform duration-200 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>

                <div className="flex items-start gap-2 rounded-xl border border-blue-100/80 bg-blue-50/65 px-3.5 py-3">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-blue-600" />

                  <p className="text-xs leading-6 text-slate-600">
                    درخواست شما پس از ثبت، توسط ادمین بررسی می‌شود.
                    وضعیت و توضیحات بررسی در همین صفحه نمایش داده خواهند شد.
                  </p>
                </div>
              </form>
            </div>
          </section>

          {/* Request history */}
          <section className="min-w-0">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black tracking-tight text-slate-900">
                  درخواست‌های ثبت‌شده
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  تاریخچه و وضعیت پیشنهادهای شما
                </p>
              </div>

              <span className="flex h-9 min-w-9 items-center justify-center rounded-xl border border-white bg-white/80 px-3 text-sm font-extrabold tabular-nums text-slate-700 shadow-sm backdrop-blur">
                {new Intl.NumberFormat("fa-IR").format(rows.length)}
              </span>
            </div>

            {rows.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300/80 bg-white/55 p-6 backdrop-blur-xl sm:p-8">
                <EmptyState
                  icon={Inbox}
                  title="هنوز درخواستی ثبت نکرده‌اید"
                  hint="اولین پیشنهاد خود را از طریق فرم ثبت کنید."
                />
              </div>
            ) : (
              <div className="space-y-4">
                {rows.map((r) => {
                  const StatusIcon = REQUEST_STATUS_ICON[r.status];

                  return (
                    <article
                      key={r.id}
                      className="group rounded-3xl border border-white/90 bg-white/75 p-4 shadow-sm shadow-slate-200/50 backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-indigo-100 hover:bg-white/95 hover:shadow-lg hover:shadow-slate-200/60 sm:p-5"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100/90 text-slate-500 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-600">
                          <Lightbulb className="size-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone="stone">
                              {REQUEST_TYPE_LABEL[r.type]}
                            </Badge>

                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                              <CalendarDays className="size-3.5" />
                              {faDate(r.createdAt)}
                            </span>
                          </div>

                          <h3 className="mt-3 wrap-break-word text-sm leading-7 font-extrabold text-slate-900 sm:text-base">
                            {r.title}
                          </h3>
                        </div>
                      </div>

                      <p className="mt-3 whitespace-pre-line wrap-break-word text-sm leading-7 text-slate-500">
                        {r.body}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                        <span className="text-xs font-medium text-slate-400">
                          وضعیت بررسی
                        </span>

                        <Badge tone={statusTone[r.status]}>
                          <StatusIcon className="size-3.5" />
                          {REQUEST_STATUS_LABEL[r.status]}
                        </Badge>
                      </div>

                      {r.adminNote ? (
                        <div className="mt-4 rounded-2xl border border-blue-100/80 bg-linear-to-br from-blue-50/80 to-indigo-50/50 p-4">
                          <div className="flex items-center gap-2 text-sm font-extrabold text-slate-800">
                            <MessageSquareText className="size-4 text-blue-600" />
                            پاسخ ادمین
                          </div>

                          <p className="mt-2 whitespace-pre-line wrap-break-word text-sm leading-7 text-slate-600">
                            {r.adminNote}
                          </p>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}