// FILE: src/controllers/student.controller.ts — API cho Student Portal
import { Request, Response } from "express";
import prisma from "../config/database";
import * as api from "../utils/apiResponse";
import { computeStudentProgress } from "../lib/studentProgress";
type Params = { [key: string]: string };
// ═══════════════════════ DASHBOARD ═══════════════════════
// GET /api/student/dashboard
export async function getDashboard(req: Request, res: Response) {
  try {
    const studentId = req.user!.userId;
    const [totalAttempts, submittedAttempts, avgScore, recentAttempts, unreadNotifications] = await Promise.all([
      prisma.examAttempt.count({ where: { studentId } }),
      prisma.examAttempt.count({ where: { studentId, status: "SUBMITTED" } }),
      prisma.examAttempt.aggregate({
        // Chỉ tính điểm các lượt ĐƯỢC CHẤM (isGraded) vào điểm trung bình
        where: { studentId, status: "SUBMITTED", isGraded: true, score: { not: null } },
        _avg: { score: true },
      }),
      prisma.examAttempt.findMany({
        where: { studentId, status: "SUBMITTED", isGraded: true },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { exam: { select: { title: true, totalScore: true } } },
      }),
      prisma.notification.count({ where: { userId: studentId, isRead: false } }),
    ]);
    // Dữ liệu cho biểu đồ tiến độ (10 bài gần nhất, chỉ lượt được chấm)
    const chartData = recentAttempts.reverse().map((a, i) => ({
      label: `Bài ${i + 1}`,
      examTitle: a.exam.title,
      score: a.score,
      totalScore: a.exam.totalScore,
      date: a.createdAt,
    }));
    return api.success(res, {
      stats: {
        totalAttempts,
        submittedAttempts,
        averageScore: avgScore._avg.score ? Math.round(avgScore._avg.score * 100) / 100 : null,
      },
      chartData,
      unreadNotifications,
    });
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}
// GET /api/student/progress — Bảng tiến độ HS tự xem (hệ thống tự điền %)
export async function getProgress(req: Request, res: Response) {
  try {
    const studentId = req.user!.userId;
    const data = await computeStudentProgress(studentId);
    return api.success(res, data);
  } catch (err) {
    console.error("Get progress error:", err);
    return api.error(res, "Lỗi server", 500);
  }
}
// ═══════════════════════ EXAM BROWSING ═══════════════════════
// GET /api/student/categories — Danh mục đề thi
export async function getCategories(req: Request, res: Response) {
  try {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: {
            children: {
              include: { _count: { select: { exams: true } } },
            },
            _count: { select: { exams: true } },
          },
        },
        _count: { select: { exams: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    return api.success(res, categories);
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}
// GET /api/student/exams?categoryId=xxx — Đề thi Published trong 1 category
export async function getExams(req: Request, res: Response) {
  try {
    const categoryId = req.query.categoryId as string;
    const where: any = { status: "PUBLISHED" };
    if (categoryId) where.categoryId = categoryId;
    const exams = await prisma.exam.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true } },
        _count: { select: { questions: true } },
      },
    });
    // Thêm info: học viên đã làm bao nhiêu lần (chấm) + best score
    const studentId = req.user!.userId;
    const examsWithAttempts = await Promise.all(
      exams.map(async (exam) => {
        // Số lượt ĐÃ CHẤM (dùng để so với maxAttempts)
        const gradedCount = await prisma.examAttempt.count({
          where: { examId: exam.id, studentId, status: "SUBMITTED", isGraded: true },
        });
        const attemptCount = await prisma.examAttempt.count({
          where: { examId: exam.id, studentId },
        });
        const bestScore = await prisma.examAttempt.aggregate({
          where: { examId: exam.id, studentId, status: "SUBMITTED", isGraded: true },
          _max: { score: true },
        });
        const attemptsLeft =
          exam.maxAttempts != null ? Math.max(0, exam.maxAttempts - gradedCount) : null;
        return {
          ...exam,
          attemptCount,
          gradedCount,
          attemptsLeft,           // null = không giới hạn; 0 = hết lượt chấm (làm tiếp = ôn tập)
          bestScore: bestScore._max.score,
        };
      })
    );
    return api.success(res, examsWithAttempts);
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}
// ═══════════════════════ EXAM ENGINE ═══════════════════════
// POST /api/student/exams/:examId/start — Bắt đầu làm bài
export async function startExam(req: Request<Params>, res: Response) {
  try {
    const examId = req.params.examId as string;
    const studentId = req.user!.userId;
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { questions: { orderBy: { orderIndex: "asc" } } },
    });
    if (!exam) return api.error(res, "Đề thi không tồn tại", 404);
    if (exam.status !== "PUBLISHED") return api.error(res, "Đề thi chưa được xuất bản", 400);
    // Kiểm tra có bài đang làm dở không
    const existingAttempt = await prisma.examAttempt.findFirst({
      where: { examId, studentId, status: "IN_PROGRESS" },
    });
    if (existingAttempt) {
      // Trả về bài đang làm dở (resume)
      return api.success(res, {
        attemptId: existingAttempt.id,
        isGraded: existingAttempt.isGraded,
        exam: {
          id: exam.id, title: exam.title, duration: exam.duration, totalScore: exam.totalScore,
          maxAttempts: exam.maxAttempts,
          questions: exam.questions.map((q) => ({
            id: q.id, type: q.type, content: q.content, mediaUrl: q.mediaUrl,
            options: q.options, score: q.score, orderIndex: q.orderIndex,
            // KHÔNG trả correctAnswer và explanation khi đang làm bài
          })),
        },
        startTime: existingAttempt.startTime,
        answers: existingAttempt.answers || {},
        studentNotes: existingAttempt.studentNotes || {},
        resumed: true,
      });
    }
    // Đếm số lượt ĐÃ CHẤM để quyết định lượt mới có được chấm không
    let willBeGraded = true;
    if (exam.maxAttempts != null) {
      const gradedCount = await prisma.examAttempt.count({
        where: { examId, studentId, status: "SUBMITTED", isGraded: true },
      });
      if (gradedCount >= exam.maxAttempts) willBeGraded = false; // hết lượt → lượt ôn tập
    }
    // Tạo lượt thi mới
    const attempt = await prisma.examAttempt.create({
      data: { studentId, examId, startTime: new Date(), status: "IN_PROGRESS", isGraded: willBeGraded },
    });
    return api.created(res, {
      attemptId: attempt.id,
      isGraded: willBeGraded,   // false = lượt ôn tập, client hiện banner "không tính điểm"
      exam: {
        id: exam.id, title: exam.title, duration: exam.duration, totalScore: exam.totalScore,
        maxAttempts: exam.maxAttempts,
        questions: exam.questions.map((q) => ({
          id: q.id, type: q.type, content: q.content, mediaUrl: q.mediaUrl,
          options: q.options, score: q.score, orderIndex: q.orderIndex,
        })),
      },
      startTime: attempt.startTime,
      answers: {},
      studentNotes: {},
      resumed: false,
    });
  } catch (err) {
    console.error("Start exam error:", err);
    return api.error(res, "Lỗi server", 500);
  }
}
// GET /api/student/attempts/:attemptId — Lấy lại bài đang làm dở (F5 / mất mạng / đóng nhầm tab)
export async function getAttempt(req: Request<Params>, res: Response) {
  try {
    const attemptId = req.params.attemptId as string;
    const studentId = req.user!.userId;
    const attempt = await prisma.examAttempt.findFirst({
      where: { id: attemptId, studentId },   // chỉ lấy bài CỦA CHÍNH HS này
      include: { exam: { include: { questions: { orderBy: { orderIndex: "asc" } } } } },
    });
    if (!attempt) return api.error(res, "Không tìm thấy lượt thi", 404);
    if (attempt.status !== "IN_PROGRESS") return api.error(res, "Bài thi này đã nộp", 400);
    return api.success(res, {
      attemptId: attempt.id,
      isGraded: attempt.isGraded,
      exam: {
        id: attempt.exam.id, title: attempt.exam.title,
        duration: attempt.exam.duration, totalScore: attempt.exam.totalScore,
        maxAttempts: attempt.exam.maxAttempts,
        questions: attempt.exam.questions.map((q) => ({
          id: q.id, type: q.type, content: q.content, mediaUrl: q.mediaUrl,
          options: q.options, score: q.score, orderIndex: q.orderIndex,
          // KHÔNG trả correctAnswer và explanation khi đang làm bài
        })),
      },
      startTime: attempt.startTime,
      answers: attempt.answers || {},
      studentNotes: attempt.studentNotes || {},
      resumed: true,
    });
  } catch (err) {
    console.error("Get attempt error:", err);
    return api.error(res, "Lỗi server", 500);
  }
}
// PUT /api/student/attempts/:attemptId/save — Auto-save mỗi 30s
export async function saveAnswers(req: Request<Params>, res: Response) {
  try {
    const attemptId = req.params.attemptId as string;
    const studentId = req.user!.userId;
    const { answers, studentNotes } = req.body;
    const attempt = await prisma.examAttempt.findFirst({
      where: { id: attemptId, studentId, status: "IN_PROGRESS" },
    });
    if (!attempt) return api.error(res, "Lượt thi không tồn tại hoặc đã nộp", 404);
    await prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        answers: answers || attempt.answers,
        studentNotes: studentNotes || attempt.studentNotes,
      },
    });
    return api.success(res, { saved: true }, "Đã lưu");
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}
// POST /api/student/attempts/:attemptId/submit — Nộp bài
export async function submitExam(req: Request<Params>, res: Response) {
  try {
    const attemptId = req.params.attemptId as string;
    const studentId = req.user!.userId;
    const { answers, studentNotes } = req.body;
    const attempt = await prisma.examAttempt.findFirst({
      where: { id: attemptId, studentId, status: "IN_PROGRESS" },
      include: {
        exam: { include: { questions: { orderBy: { orderIndex: "asc" } } } },
      },
    });
    if (!attempt) return api.error(res, "Lượt thi không tồn tại hoặc đã nộp", 404);
    const studentAnswers = answers || attempt.answers || {};
    // ── Kiểm giờ SERVER-SIDE (chống gian lận đồng hồ client) ──
    // Quá (duration phút + 30s grace) tính là hết giờ → đánh dấu autoSubmitted, VẪN chấm.
    const GRACE_MS = 30 * 1000;
    const elapsedMs = Date.now() - new Date(attempt.startTime).getTime();
    const limitMs = attempt.exam.duration * 60 * 1000 + GRACE_MS;
    const overtime = elapsedMs > limitMs;
    // Chấm điểm tự động (trừ Essay)
    let totalScore = 0;
    for (const q of attempt.exam.questions) {
      if (q.type === "ESSAY") continue;
      const studentAnswer = (studentAnswers as Record<string, any>)[q.id];
      if (studentAnswer === undefined || studentAnswer === null || studentAnswer === "") continue;
      const correct = typeof q.correctAnswer === "string" ? q.correctAnswer : JSON.stringify(q.correctAnswer);
      const student = typeof studentAnswer === "string" ? studentAnswer : JSON.stringify(studentAnswer);
      if (correct.toLowerCase().trim() === student.toLowerCase().trim()) {
        totalScore += q.score;
      }
    }
    const updated = await prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        status: "SUBMITTED",
        endTime: new Date(),
        answers: studentAnswers,
        studentNotes: studentNotes || attempt.studentNotes,
        score: Math.round(totalScore * 100) / 100,
        autoSubmitted: overtime,   // true nếu nộp quá giờ (client auto-nộp hoặc trễ)
        // isGraded giữ nguyên giá trị đã set lúc startExam
      },
      include: { exam: { select: { title: true, totalScore: true } } },
    });
    return api.success(res, {
      attemptId: updated.id,
      score: updated.score,
      totalScore: updated.exam.totalScore,
      examTitle: updated.exam.title,
      isGraded: updated.isGraded,       // false = lượt ôn tập, không tính vào điểm chính thức
      autoSubmitted: updated.autoSubmitted,
    }, updated.isGraded ? "Nộp bài thành công!" : "Đã nộp (lượt ôn tập — không tính điểm)");
  } catch (err) {
    console.error("Submit exam error:", err);
    return api.error(res, "Lỗi server", 500);
  }
}
// ═══════════════════════ HISTORY & REVIEW ═══════════════════════
// GET /api/student/history — Lịch sử thi
export async function getHistory(req: Request, res: Response) {
  try {
    const studentId = req.user!.userId;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = 20;
    const skip = (page - 1) * limit;
    const [attempts, total] = await Promise.all([
      prisma.examAttempt.findMany({
        where: { studentId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        // isGraded + autoSubmitted trả về để UI ghi nhãn "lượt ôn tập" / "hết giờ tự nộp"
        include: { exam: { select: { id: true, title: true, totalScore: true, duration: true } } },
      }),
      prisma.examAttempt.count({ where: { studentId } }),
    ]);
    return api.paginated(res, attempts, total, page, limit);
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}
// GET /api/student/history/:attemptId — Xem lại chi tiết bài làm (SAU KHI NỘP)
export async function getAttemptReview(req: Request<Params>, res: Response) {
  try {
    const attemptId = req.params.attemptId as string;
    const studentId = req.user!.userId;
    const attempt = await prisma.examAttempt.findFirst({
      where: { id: attemptId, studentId, status: "SUBMITTED" },
      include: {
        exam: { include: { questions: { orderBy: { orderIndex: "asc" } } } },
      },
    });
    if (!attempt) return api.error(res, "Không tìm thấy bài làm", 404);
    const studentAnswers = (attempt.answers || {}) as Record<string, any>;
    const notes = (attempt.studentNotes || {}) as Record<string, any>;
    const questions = attempt.exam.questions.map((q, i) => {
      const studentAnswer = studentAnswers[q.id] ?? null;
      let isCorrect: boolean | null = null;
      if (q.type !== "ESSAY" && studentAnswer !== null && studentAnswer !== "") {
        const correct = typeof q.correctAnswer === "string" ? q.correctAnswer : JSON.stringify(q.correctAnswer);
        const student = typeof studentAnswer === "string" ? studentAnswer : JSON.stringify(studentAnswer);
        isCorrect = correct.toLowerCase().trim() === student.toLowerCase().trim();
      }
      return {
        questionNumber: i + 1, id: q.id, type: q.type, content: q.content,
        mediaUrl: q.mediaUrl, options: q.options, correctAnswer: q.correctAnswer,
        explanation: q.explanation, score: q.score,
        studentAnswer, isCorrect, studentNote: notes[q.id] || null,
      };
    });
    return api.success(res, {
      id: attempt.id,
      exam: { title: attempt.exam.title, totalScore: attempt.exam.totalScore, duration: attempt.exam.duration },
      startTime: attempt.startTime, endTime: attempt.endTime,
      score: attempt.score,
      isGraded: attempt.isGraded,
      autoSubmitted: attempt.autoSubmitted,
      questions,
    });
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}
// ═══════════════════════ NOTIFICATIONS ═══════════════════════
// GET /api/student/notifications
export async function getNotifications(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const [notifications, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);
    return res.json({ success: true, data: notifications, unreadCount: unread });
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}
// PATCH /api/student/notifications/read-all
export async function markAllRead(req: Request, res: Response) {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.userId, isRead: false },
      data: { isRead: true },
    });
    return api.success(res, null, "Đã đọc tất cả");
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}