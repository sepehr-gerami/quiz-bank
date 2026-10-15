import Link from "next/link";
import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { ClipboardList, FileQuestion, Timer } from "lucide-react";

import { db } from "@/db";
import { categories, quizzes } from "@/db/schema";
import {
    getCategories,
    buildQuery,
    first,
    pageOf,
    type SearchParams,
} from "@/lib/queries";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import SearchInput from "@/components/search-input";
import CategoryFilters from "../../components/category-filters";
import Pagination from "@/components/pagination";
import { faDigits, faDuration } from "@/lib/format";
import { GRADING_MODE_LABEL, PAGE_SIZE } from "@/lib/constants";

const QuizzesPage = async ({
    searchParams,
}: {
    searchParams: SearchParams;
}) => {
    const sp = await searchParams;

    const q = first(sp.q)?.trim();
    const cat = Number(first(sp.cat)) || undefined;
    const page = pageOf(first(sp.page));

    const where = and(
        eq(quizzes.published, true),
        q ? ilike(quizzes.title, `%${q}%`) : undefined,
        cat ? eq(quizzes.categoryId, cat) : undefined,
    );

    const [rows, countRows, cats] = await Promise.all([
        db
            .select({
                id: quizzes.id,
                title: quizzes.title,
                description: quizzes.description,
                gradingMode: quizzes.gradingMode,
                timeLimitMinutes: quizzes.timeLimitMinutes,
                categoryName: categories.name,
                questionCount: sql<number>`
                    (
                        select count(*)::int
                        from quiz_questions
                        where quiz_id = ${quizzes.id}
                    )
                `,
            })
            .from(quizzes)
            .leftJoin(
                categories,
                eq(categories.id, quizzes.categoryId),
            )
            .where(where)
            .orderBy(desc(quizzes.updatedAt))
            .limit(PAGE_SIZE)
            .offset((page - 1) * PAGE_SIZE),

        db
            .select({
                count: sql<number>`count(*)::int`,
            })
            .from(quizzes)
            .where(where),

        getCategories(),
    ]);

    const total = countRows[0]?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    // پارامترهای فعلی جستجو و دسته‌بندی
    const params: Record<string, string | undefined> = {
        q,
        cat: cat ? String(cat) : undefined,
    };

    // گزینه‌های فیلتر در سرور ساخته می‌شوند
    const filterItems = [
        {
            id: "all",
            name: "همه",
            href: buildQuery(params, {
                cat: undefined,
                page: undefined,
            }),
            active: !cat,
        },
        ...cats.map((c) => ({
            id: `cat-${c.id}`,
            name: c.name,
            href: buildQuery(params, {
                cat: c.id,
                page: undefined,
            }),
            active: cat === Number(c.id),
        })),
    ];

    return (
        <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <PageHeader
                icon={ClipboardList}
                title="آزمون‌ها"
                subtitle={`${faDigits(total)} آزمون فعال`}
            />


            {/* Filters */}

            <section className="mb-6 rounded-2xl border border-stone-200 bg-stone-50 p-3 sm:p-4">
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <h2 className="text-sm font-bold text-stone-800">
                            پیدا کردن آزمون
                        </h2>

                        <p className="text-xs text-stone-500">
                            عنوان آزمون را جستجو کنید یا دسته‌بندی را انتخاب کنید.
                        </p>
                    </div>

                    <div className="w-full sm:max-w-xs">
                        <SearchInput
                            placeholder="جستجوی عنوان آزمون…"
                            className="w-full bg-white"
                        />
                    </div>
                </div>

                <div className="border-t border-stone-200 pt-3">
                    <CategoryFilters items={filterItems} />
                </div>
            </section>

            {/* Quiz list */}
            {rows.length === 0 ? (
                <EmptyState
                    title="آزمونی پیدا نشد"
                    hint="عبارت جستجو یا دسته‌بندی را تغییر دهید."
                />
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {rows.map((quiz) => (
                        <Link
                            key={quiz.id}
                            href={`/quizzes/${quiz.id}`}
                            className="group"
                        >
                            <Card className="flex h-full flex-col p-5 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-indigo-300 group-hover:shadow-lg group-hover:shadow-indigo-600/10">
                                <div className="mb-3 flex flex-wrap items-center gap-2">
                                    {quiz.categoryName ? (
                                        <Badge tone="sky">
                                            {quiz.categoryName}
                                        </Badge>
                                    ) : null}

                                    <Badge
                                        tone={
                                            quiz.gradingMode === "ai"
                                                ? "violet"
                                                : "amber"
                                        }
                                    >
                                        {GRADING_MODE_LABEL[quiz.gradingMode]}
                                    </Badge>
                                </div>

                                <h3 className="font-extrabold text-stone-900 group-hover:text-indigo-700">
                                    {quiz.title}
                                </h3>

                                <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-7 text-stone-500">
                                    {quiz.description || "بدون توضیحات"}
                                </p>

                                <div className="mt-4 flex items-center gap-4 border-t border-stone-100 pt-3 text-xs text-stone-400">
                                    <span className="inline-flex items-center gap-1">
                                        <FileQuestion className="size-3.5" />
                                        {faDigits(quiz.questionCount)} سؤال
                                    </span>

                                    <span className="inline-flex items-center gap-1">
                                        <Timer className="size-3.5" />
                                        {faDuration(quiz.timeLimitMinutes)}
                                    </span>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}

            {/* Pagination */}
            <Pagination
                page={page}
                totalPages={totalPages}
                params={params}
            />
        </main>
    );
};

export default QuizzesPage;