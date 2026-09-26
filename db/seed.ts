// Database seed: admin/demo users, categories, sample questions of all three
// types, three published quizzes, several sample submissions (test results)
// for the demo user and a few user requests.
// Run with: npm run seed
import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { pool } from "./index";
import { drizzle } from "drizzle-orm/node-postgres";
import {
  aiReviews,
  answers,
  categories,
  options,
  questions,
  quizQuestions,
  quizzes,
  requests,
  sessions,
  submissions,
  users,
} from "./schema";
import { hashPassword } from "../lib/password";

const db = drizzle(pool);

async function main() {
  console.log("Seeding…");

  // Clean slate (order matters because of FKs)
  await db.delete(aiReviews);
  await db.delete(answers);
  await db.delete(submissions);
  await db.delete(quizQuestions);
  await db.delete(quizzes);
  await db.delete(options);
  await db.delete(questions);
  await db.delete(requests);
  await db.delete(sessions);
  await db.delete(users);
  await db.delete(categories);

  // --- users ---------------------------------------------------------------
  const adminUsername = process.env.ADMIN_USERNAME ?? "admin";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin123456";
  const [admin] = await db
    .insert(users)
    .values({
      username: adminUsername,
      fullName: "مدیر سامانه",
      passwordHash: await hashPassword(adminPassword),
      role: "admin",
    })
    .returning({ id: users.id });

  const [demo] = await db
    .insert(users)
    .values({
      username: "demo",
      fullName: "کاربر نمایشی",
      passwordHash: await hashPassword("User12345"),
      role: "user",
    })
    .returning({ id: users.id });

  // --- categories ----------------------------------------------------------
  const catNames = [
    "ریاضیات",
    "علوم تجربی",
    "تاریخ و تمدن",
    "زبان و ادبیات فارسی",
    "اطلاعات عمومی",
  ];
  const catRows = await db
    .insert(categories)
    .values(catNames.map((name) => ({ name })))
    .returning({ id: categories.id, name: categories.name });
  const cat = Object.fromEntries(catRows.map((c) => [c.name, c.id]));

  // --- helpers for seeding sample test results (submissions) -------------------
  const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);

  async function correctOptionIdOf(questionId: string): Promise<string> {
    const rows = await db
      .select({ id: options.id })
      .from(options)
      .where(and(eq(options.questionId, questionId), eq(options.isCorrect, true)))
      .limit(1);
    if (!rows[0]) throw new Error(`No correct option for ${questionId}`);
    return rows[0].id;
  }

  async function wrongOptionIdOf(questionId: string): Promise<string> {
    const rows = await db
      .select({ id: options.id })
      .from(options)
      .where(
        and(eq(options.questionId, questionId), eq(options.isCorrect, false)),
      )
      .limit(1);
    if (!rows[0]) throw new Error(`No wrong option for ${questionId}`);
    return rows[0].id;
  }

  type SubmissionSpec = {
    quizId: string;
    startedMinutesAgo: number;
    durationMinutes: number;
    inProgress?: boolean;
    answers: {
      questionId: string;
      points: number;
      mode: "correct" | "wrong" | "ai" | "pending";
      text?: string;
      aiScore?: number;
      aiFeedback?: string;
      manualScore?: number;
      manualFeedback?: string;
    }[];
  };

  async function seedSubmission(spec: SubmissionSpec): Promise<void> {
    const inProgress = spec.inProgress === true;
    const submittedAt = inProgress
      ? null
      : minutesAgo(spec.startedMinutesAgo - spec.durationMinutes);
    const gradedAt =
      spec.answers.some((a) => a.mode === "pending") ? null : submittedAt;

    const answerRows: (typeof answers.$inferInsert)[] = await Promise.all(
      spec.answers.map(async (a) => {
        if (a.mode === "pending") {
          // Written answer waiting for manual review by an admin.
          return {
            submissionId: "",
            questionId: a.questionId,
            selectedOptionId: null,
            answerText: a.text ?? "",
            isCorrect: null,
            score: null,
            maxPoints: a.points,
            gradingStatus: "pending" as const,
            feedback: null,
            gradedById: null,
            gradedAt: null,
          };
        }

        if (a.mode === "ai") {
          // Written answer scored by the AI provider. If manualScore is set,
          // the admin later re-graded it by hand (final override).
          const aiScore = a.aiScore ?? 0;
          const manuallyReGraded = a.manualScore !== undefined;
          return {
            submissionId: "",
            questionId: a.questionId,
            selectedOptionId: null,
            answerText: a.text ?? "",
            isCorrect: manuallyReGraded ? null : aiScore >= 60,
            score: manuallyReGraded
              ? a.manualScore
              : Math.round(((a.points * aiScore) / 100) * 100) / 100,
            maxPoints: a.points,
            gradingStatus: manuallyReGraded ? "graded" : "ai_scored",
            aiScore: manuallyReGraded ? null : aiScore,
            feedback: manuallyReGraded
              ? (a.manualFeedback ?? a.aiFeedback ?? null)
              : (a.aiFeedback ?? null),
            gradedById: manuallyReGraded ? admin.id : null,
            gradedAt: submittedAt,
          };
        }

        const correct = a.mode === "correct";
        return {
          submissionId: "",
          questionId: a.questionId,
          selectedOptionId: correct
            ? await correctOptionIdOf(a.questionId)
            : await wrongOptionIdOf(a.questionId),
          answerText: null,
          isCorrect: correct,
          score: correct ? a.points : 0,
          maxPoints: a.points,
          gradingStatus: "auto" as const,
          aiScore: null,
          feedback: null,
          gradedById: null,
          gradedAt: submittedAt,
        };
      }),
    );

    const totalScore = answerRows.reduce(
      (sum, r) => sum + (Number(r.score) || 0),
      0,
    );
    const status = inProgress
      ? "in_progress"
      : spec.answers.some((a) => a.mode === "pending")
        ? "awaiting_grading"
        : "graded";

    const [sub] = await db
      .insert(submissions)
      .values({
        quizId: spec.quizId,
        userId: demo.id,
        status,
        totalScore: inProgress ? 0 : totalScore,
        maxScore: spec.answers.reduce((sum, a) => sum + a.points, 0),
        startedAt: minutesAgo(spec.startedMinutesAgo),
        submittedAt: inProgress ? null : submittedAt,
        gradedAt: inProgress ? null : gradedAt,
      })
      .returning({ id: submissions.id });

    // "submissionId" is only known after the submission insert — patch it in.
    for (const r of answerRows) r.submissionId = sub.id;

    const inserted = await db
      .insert(answers)
      .values(answerRows)
      .returning({ id: answers.id, questionId: answers.questionId });

    const idByQuestion = new Map(
      inserted.map((r) => [r.questionId, r.id] as const),
    );

    const reviewRows = spec.answers
      .filter((a) => a.mode === "ai")
      .map((a) => ({
        answerId: idByQuestion.get(a.questionId)!,
        provider: "mock",
        model: "heuristic-fa-v1",
        score: a.aiScore ?? 0,
        feedback: a.aiFeedback ?? "",
        latencyMs: 300 + Math.floor(Math.random() * 500),
      }));

    if (reviewRows.length > 0) {
      await db.insert(aiReviews).values(reviewRows);
    }

    console.log(
      `  submission ${status} (score ${totalScore}) for quiz ${spec.quizId}`,
    );
  }

  // --- questions -------------------------------------------------------------
  type QSeed = {
    cat: string;
    type: "mcq" | "true_false" | "written";
    text: string;
    difficulty: "easy" | "medium" | "hard";
    explanation?: string;
    referenceAnswer?: string;
    options?: { text: string; isCorrect: boolean }[];
  };

  const seeds: QSeed[] = [
    {
      cat: "ریاضیات",
      type: "mcq",
      text: "حاصل ۱۲ × ۸ کدام است؟",
      difficulty: "easy",
      explanation: "۱۲ × ۸ = ۹۶",
      options: [
        { text: "۸۶", isCorrect: false },
        { text: "۹۶", isCorrect: true },
        { text: "۱۰۶", isCorrect: false },
        { text: "۹۸", isCorrect: false },
      ],
    },
    {
      cat: "ریاضیات",
      type: "mcq",
      text: "مشتق تابع f(x) = x² کدام است؟",
      difficulty: "medium",
      explanation: "طبق قاعدهٔ توان، مشتق x² برابر 2x است.",
      options: [
        { text: "x", isCorrect: false },
        { text: "2x", isCorrect: true },
        { text: "x²/2", isCorrect: false },
        { text: "2", isCorrect: false },
      ],
    },
    {
      cat: "ریاضیات",
      type: "true_false",
      text: "هر عدد اول بزرگ‌تر از ۲، عددی فرد است.",
      difficulty: "easy",
      explanation: "اگر عددی زوج باشد بر ۲ بخش‌پذیر است و نمی‌تواند اول باشد.",
      options: [
        { text: "صحیح", isCorrect: true },
        { text: "غلط", isCorrect: false },
      ],
    },
    {
      cat: "علوم تجربی",
      type: "mcq",
      text: "فرمول شیمیایی آب کدام است؟",
      difficulty: "easy",
      explanation: "آب از دو اتم هیدروژن و یک اتم اکسیژن تشکیل شده است.",
      options: [
        { text: "CO₂", isCorrect: false },
        { text: "H₂O", isCorrect: true },
        { text: "O₂", isCorrect: false },
        { text: "NaCl", isCorrect: false },
      ],
    },
    {
      cat: "علوم تجربی",
      type: "written",
      text: "فرایند فتوسنتز را توضیح دهید و مواد اولیه و محصولات آن را نام ببرید.",
      difficulty: "medium",
      explanation:
        "فتوسنتز فرایند تولید گلوکز و اکسیژن از آب و کربن‌دی‌اکسید در حضور نور است.",
      referenceAnswer:
        "فتوسنتز فرایندی است که در آن گیاهان با استفاده از انرژی نور خورشید، کربن‌دی‌اکسید و آب را به گلوکز و اکسیژن تبدیل می‌کنند. مواد اولیه: کربن‌دی‌اکسید و آب. محصولات: گلوکز (قند) و اکسیژن. این واکنش در کلروپلاست و با رنگ‌دانهٔ کلروفیل انجام می‌شود.",
    },
    {
      cat: "علوم تجربی",
      type: "true_false",
      text: "نور در خلأ حرکت می‌کند.",
      difficulty: "easy",
      explanation:
        "نور موج الکترومغناطیسی است و برای انتشار به محیط مادی نیاز ندارد.",
      options: [
        { text: "صحیح", isCorrect: true },
        { text: "غلط", isCorrect: false },
      ],
    },
    {
      cat: "تاریخ و تمدن",
      type: "mcq",
      text: "کوروش بزرگ بنیان‌گذار کدام دودمان بود؟",
      difficulty: "easy",
      explanation:
        "کوروش دوم، سلسلهٔ هخامنشی را حدود ۵۵۰ پیش از میلاد بنیان گذاشت.",
      options: [
        { text: "اشکانیان", isCorrect: false },
        { text: "ساسانیان", isCorrect: false },
        { text: "هخامنشیان", isCorrect: true },
        { text: "صفویان", isCorrect: false },
      ],
    },
    {
      cat: "تاریخ و تمدن",
      type: "written",
      text: "پیامدهای اصلاحات رضاشاه بر نوسازی ایران را در دو یا سه محور توضیح دهید.",
      difficulty: "hard",
      referenceAnswer:
        "اصلاحات رضاشاه در چند محور مهم بود: اول، نوسازی زیرساخت‌ها شامل ساخت راه‌آهن سراسری، جاده‌ها و تأسیس دانشگاه تهران؛ دوم، اصلاحات اداری و حقوقی مانند تشکیل ارتش متمرکز، تدوین قوانین مدنی جدید و ثبت اسناد و احوال شخصیه؛ سوم، تحولات اجتماعی از جمله گسترش آموزش همگانی، کشف حجاب و ترویج پوشش و سبک زندگی مدرن. این اقدامات دولت مدرن متمرکز را شکل داد هرچند با رویکردی اقتدارگرایانه همراه بود.",
    },
    {
      cat: "زبان و ادبیات فارسی",
      type: "mcq",
      text: "سرایندهٔ «بنی‌آدم اعضای یک پیکرند» کیست؟",
      difficulty: "easy",
      explanation: "این مصرع معروف از سعدی شیرازی در باب اول گلستان است.",
      options: [
        { text: "حافظ", isCorrect: false },
        { text: "فردوسی", isCorrect: false },
        { text: "مولوی", isCorrect: false },
        { text: "سعدی", isCorrect: true },
      ],
    },
    {
      cat: "زبان و ادبیات فارسی",
      type: "true_false",
      text: "شاهنامهٔ فردوسی به نظم مسموط سروده شده است.",
      difficulty: "medium",
      explanation:
        "شاهنامه در وزن «فعولن فعولن فعولن فعل» به بحر متقارب سروده شده است.",
      options: [
        { text: "صحیح", isCorrect: false },
        { text: "غلط", isCorrect: true },
      ],
    },
    {
      cat: "اطلاعات عمومی",
      type: "mcq",
      text: "پایتخت استرالیا کدام شهر است؟",
      difficulty: "medium",
      explanation: "پایتخت استرالیا کانبرا است، نه سیدنی یا ملبورن.",
      options: [
        { text: "سیدنی", isCorrect: false },
        { text: "ملبورن", isCorrect: false },
        { text: "کانبرا", isCorrect: true },
        { text: "پرت", isCorrect: false },
      ],
    },
    {
      cat: "اطلاعات عمومی",
      type: "written",
      text: "سه مورد از مزایای مطالعهٔ منظم کتاب را بنویسید.",
      difficulty: "easy",
      referenceAnswer:
        "مطالعهٔ منظم دانش و اطلاعات عمومی را افزایش می‌دهد، دایرهٔ واژگان و قدرت بیان را تقویت می‌کند، تمرکز و توان تفکر انتقادی را بهبود می‌بخشد، استرس را کاهش می‌دهد و مهارت نوشتن را بالا می‌برد.",
    },
  ];

  const questionIds: Record<string, string> = {};
  for (const s of seeds) {
    const [q] = await db
      .insert(questions)
      .values({
        categoryId: cat[s.cat],
        type: s.type,
        text: s.text,
        difficulty: s.difficulty,
        explanation: s.explanation ?? "",
        referenceAnswer: s.referenceAnswer ?? "",
        createdById: admin.id,
      })
      .returning({ id: questions.id });
    questionIds[s.text] = q.id;
    if (s.options) {
      await db.insert(options).values(
        s.options.map((o, i) => ({
          questionId: q.id,
          text: o.text,
          isCorrect: o.isCorrect,
          orderIndex: i,
        })),
      );
    }
  }

  // --- quizzes -----------------------------------------------------------------
  const [mathQuiz] = await db
    .insert(quizzes)
    .values({
      title: "آزمون جامع ریاضیات",
      description:
        "ارزیابی مفاهیم پایهٔ ریاضی شامل حساب، حساب دیفرانسیل و منطق.",
      categoryId: cat["ریاضیات"],
      gradingMode: "ai",
      timeLimitMinutes: 10,
      published: true,
      createdById: admin.id,
    })
    .returning({ id: quizzes.id });

  await db.insert(quizQuestions).values([
    {
      quizId: mathQuiz.id,
      questionId: questionIds["حاصل ۱۲ × ۸ کدام است؟"],
      orderIndex: 0,
      points: 2,
    },
    {
      quizId: mathQuiz.id,
      questionId: questionIds["مشتق تابع f(x) = x² کدام است؟"],
      orderIndex: 1,
      points: 3,
    },
    {
      quizId: mathQuiz.id,
      questionId: questionIds["هر عدد اول بزرگ‌تر از ۲، عددی فرد است."],
      orderIndex: 2,
      points: 1,
    },
  ]);

  const [mixedQuiz] = await db
    .insert(quizzes)
    .values({
      title: "آزمون استعداد و دانش عمومی (تصحیح دستی)",
      description:
        "ترکیبی از سؤالات چهارگزینه‌ای، صحیح/غلط و تشریحی؛ پاسخ‌های تشریحی توسط ادمین بررسی می‌شوند.",
      categoryId: cat["اطلاعات عمومی"],
      gradingMode: "manual",
      timeLimitMinutes: 20,
      published: true,
      createdById: admin.id,
    })
    .returning({ id: quizzes.id });

  await db.insert(quizQuestions).values([
    {
      quizId: mixedQuiz.id,
      questionId: questionIds["فرمول شیمیایی آب کدام است؟"],
      orderIndex: 0,
      points: 1,
    },
    {
      quizId: mixedQuiz.id,
      questionId: questionIds["سرایندهٔ «بنی‌آدم اعضای یک پیکرند» کیست؟"],
      orderIndex: 1,
      points: 1,
    },
    {
      quizId: mixedQuiz.id,
      questionId: questionIds["پایتخت استرالیا کدام شهر است؟"],
      orderIndex: 2,
      points: 2,
    },
    {
      quizId: mixedQuiz.id,
      questionId: questionIds["نور در خلأ حرکت می‌کند."],
      orderIndex: 3,
      points: 1,
    },
    {
      quizId: mixedQuiz.id,
      questionId:
        questionIds[
          "فرایند فتوسنتز را توضیح دهید و مواد اولیه و محصولات آن را نام ببرید."
        ],
      orderIndex: 4,
      points: 5,
    },
    {
      quizId: mixedQuiz.id,
      questionId:
        questionIds["سه مورد از مزایای مطالعهٔ منظم کتاب را بنویسید."],
      orderIndex: 5,
      points: 4,
    },
  ]);

  const [scienceQuiz] = await db
    .insert(quizzes)
    .values({
      title: "آزمون علوم تجربی",
      description:
        "پوشش مفاهیم پایهٔ علوم تجربی؛ پاسخ‌های تشریحی با هوش مصنوعی نمره‌دهی می‌شوند.",
      categoryId: cat["علوم تجربی"],
      gradingMode: "ai",
      timeLimitMinutes: 15,
      published: true,
      createdById: admin.id,
    })
    .returning({ id: quizzes.id });

  await db.insert(quizQuestions).values([
    {
      quizId: scienceQuiz.id,
      questionId: questionIds["فرمول شیمیایی آب کدام است؟"],
      orderIndex: 0,
      points: 2,
    },
    {
      quizId: scienceQuiz.id,
      questionId: questionIds["نور در خلأ حرکت می‌کند."],
      orderIndex: 1,
      points: 2,
    },
    {
      quizId: scienceQuiz.id,
      questionId:
        questionIds[
          "فرایند فتوسنتز را توضیح دهید و مواد اولیه و محصولات آن را نام ببرید."
        ],
      orderIndex: 2,
      points: 6,
    },
  ]);

  // --- sample submissions (test results) for the demo user ----------------------
  // A mix of statuses and scores so /results and result details show variety:
  // fully auto-graded, AI-scored written answers, manual admin re-grade,
  // pending manual grading and an in-progress attempt.
  const mathQ = {
    multiply: questionIds["حاصل ۱۲ × ۸ کدام است؟"],
    derivative: questionIds["مشتق تابع f(x) = x² کدام است؟"],
    primes: questionIds["هر عدد اول بزرگ‌تر از ۲، عددی فرد است."],
  };
  const mixedQ = {
    water: questionIds["فرمول شیمیایی آب کدام است؟"],
    poet: questionIds["سرایندهٔ «بنی‌آدم اعضای یک پیکرند» کیست؟"],
    capital: questionIds["پایتخت استرالیا کدام شهر است؟"],
    light: questionIds["نور در خلأ حرکت می‌کند."],
    photosynthesis: questionIds[
      "فرایند فتوسنتز را توضیح دهید و مواد اولیه و محصولات آن را نام ببرید."
    ],
    reading: questionIds["سه مورد از مزایای مطالعهٔ منظم کتاب را بنویسید."],
  };

  await seedSubmission({
    quizId: mathQuiz.id,
    startedMinutesAgo: 6 * 24 * 60,
    durationMinutes: 6,
    answers: [
      { questionId: mathQ.multiply, points: 2, mode: "correct" },
      { questionId: mathQ.derivative, points: 3, mode: "correct" },
      { questionId: mathQ.primes, points: 1, mode: "correct" },
    ],
  });

  await seedSubmission({
    quizId: mixedQuiz.id,
    startedMinutesAgo: 4 * 24 * 60,
    durationMinutes: 14,
    answers: [
      { questionId: mixedQ.water, points: 1, mode: "correct" },
      { questionId: mixedQ.poet, points: 1, mode: "correct" },
      { questionId: mixedQ.capital, points: 2, mode: "wrong" },
      { questionId: mixedQ.light, points: 1, mode: "correct" },
      {
        questionId: mixedQ.photosynthesis,
        points: 5,
        mode: "ai",
        aiScore: 82,
        text: "فتوسنتز فرایندی است که گیاهان با استفاده از نور خورشید، آب و کربن‌دی‌اکسید را به گلوکز و اکسیژن تبدیل می‌کنند. مواد اولیه آب و کربن‌دی‌اکسید و محصولات گلوکز و اکسیژن است.",
        aiFeedback:
          "پاسخ شما دقیق و کامل است؛ مواد اولیه و محصولات به‌درستی ذکر شده و روند فرایند روان توضیح داده شده است.",
      },
      {
        questionId: mixedQ.reading,
        points: 4,
        mode: "ai",
        aiScore: 55,
        text: "مطالعهٔ کتاب به آدمی آرامش می‌دهد و حواسش را جمع می‌کند.",
        aiFeedback:
          "تنها به بخشی از مزایا اشاره کرده‌اید؛ پرداختن به تقویت دایرهٔ واژگان و تفکر انتقادی پاسخ را کامل‌تر می‌کند.",
      },
    ],
  });

  await seedSubmission({
    quizId: scienceQuiz.id,
    startedMinutesAgo: 2 * 24 * 60,
    durationMinutes: 9,
    answers: [
      { questionId: mixedQ.water, points: 2, mode: "correct" },
      { questionId: mixedQ.light, points: 2, mode: "wrong" },
      {
        questionId: mixedQ.photosynthesis,
        points: 6,
        mode: "ai",
        aiScore: 78,
        text: "گیاهان با انرژی نور، کربن‌دی‌اکسید و آب را در برگ‌ها به گلوکز تبدیل می‌کنند و اکسیژن آزاد می‌شود. این کار در کلروپلاست و با کمک کلروفیل انجام می‌شود.",
        aiFeedback:
          "مفاهیم اصلی درست بیان شده‌اند؛ اشارهٔ صریح به مواد اولیه و محصولات امتیاز بیشتری برای شما به همراه می‌آورد.",
      },
    ],
  });

  await seedSubmission({
    quizId: mixedQuiz.id,
    startedMinutesAgo: 26 * 60,
    durationMinutes: 18,
    answers: [
      { questionId: mixedQ.water, points: 1, mode: "correct" },
      { questionId: mixedQ.poet, points: 1, mode: "wrong" },
      { questionId: mixedQ.capital, points: 2, mode: "correct" },
      { questionId: mixedQ.light, points: 1, mode: "correct" },
      {
        questionId: mixedQ.photosynthesis,
        points: 5,
        mode: "ai",
        aiScore: 46,
        manualScore: 3,
        manualFeedback:
          "بخش تولید گلوکز را درست نوشته‌اید اما مواد اولیه را فراموش کرده بودید؛ نمرهٔ دستی بین AI و کامل در نظر گرفته شد.",
        text: "فتوسنتز یعنی گیاه نور را می‌گیرد و غذا می‌سازد.",
      },
      {
        questionId: mixedQ.reading,
        points: 4,
        mode: "ai",
        aiScore: 40,
        manualScore: 2.5,
        manualFeedback:
          "دو مورد از سه مزیت خواسته‌شده را آورده‌اید؛ نمره متناسب با همان دو مورد داده شد.",
        text: "کتاب خواندن معلومات را زیاد می‌کند و آدم را باهوش‌تر می‌کند.",
      },
    ],
  });

  await seedSubmission({
    quizId: mixedQuiz.id,
    startedMinutesAgo: 90,
    durationMinutes: 11,
    answers: [
      { questionId: mixedQ.water, points: 1, mode: "correct" },
      { questionId: mixedQ.poet, points: 1, mode: "correct" },
      { questionId: mixedQ.capital, points: 2, mode: "wrong" },
      { questionId: mixedQ.light, points: 1, mode: "correct" },
      {
        questionId: mixedQ.photosynthesis,
        points: 5,
        mode: "pending",
        text: "فتوسنتز به گیاه کمک می‌کند تا با نور خورشید انرژی بسازد.",
      },
      {
        questionId: mixedQ.reading,
        points: 4,
        mode: "pending",
        text: "حوصله‌سربرگی کم می‌شود و برای رشد شخصی خوب است.",
      },
    ],
  });

  await seedSubmission({
    quizId: scienceQuiz.id,
    startedMinutesAgo: 20,
    durationMinutes: 5,
    inProgress: true,
    answers: [
      { questionId: mixedQ.water, points: 2, mode: "correct" },
      { questionId: mixedQ.light, points: 2, mode: "correct" },
    ],
  });

  // --- sample requests ---------------------------------------------------------
  await db.insert(requests).values([
    {
      userId: demo.id,
      type: "topic",
      title: "موضوع هوش مصنوعی و یادگیری ماشین",
      body: "پیشنهاد می‌کنم دسته‌ای برای مفاهیم پایهٔ هوش مصنوعی، شبکه‌های عصبی و کاربردهای آن اضافه شود.",
      status: "pending",
    },
    {
      userId: demo.id,
      type: "quiz",
      title: "آزمون جامع شاهنامهٔ فردوسی",
      body: "آزمونی با تمرکز بر داستان‌های شاهنامه، شخصیت‌ها و بیت‌های معروف بسیار آموزنده خواهد بود.",
      status: "pending",
    },
  ]);

  console.log("Seed completed.");
  console.log(`Admin: ${adminUsername} / ${adminPassword}`);
  console.log("Demo user: demo / User12345");
  console.log(
    "Demo submissions seeded: graded / awaiting_grading / in_progress results.",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());