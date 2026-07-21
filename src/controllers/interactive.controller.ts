// FILE: src/controllers/interactive.controller.ts — GHI ĐÈ (LearnClick gaps + timer/giới hạn lượt)
// Bài tập tương tác — hỗ trợ cả mô hình GAP (LearnClick) lẫn questions cũ
// 2-phase (start→submit) CHỈ kích hoạt khi bài có timeLimit hoặc maxAttempts; bài cũ giữ luồng submit-thẳng.
import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { gradeGaps, normalizeGaps, stripGapAnswers } from "../utils/gradeGaps";
const prisma = new PrismaClient();
import { refreshStudyFlag } from "../lib/studentProgress";
function uid(req: Request): string | undefined {
  return (req as any).user?.userId;
}
// JWT chỉ có { userId, role } → phải lấy course từ DB (và HS chuyển lớp thì token cũ vẫn đúng)
async function studentCourse(req: Request): Promise<string | null> {
  const id = uid(req);
  if (!id) return null;
  const u = await prisma.user.findUnique({ where: { id }, select: { course: true } });
  return u?.course || null;
}
async function getVisibilityFilter(req: Request) {
  const user = (req as any).user;
  if (!user) return { visibility: "PUBLIC", isPublished: true };
  if (user.role === "ADMIN" || user.role === "TEACHER") return {};
  if (user.role === "STUDENT") {
    const course = await studentCourse(req);
    return {
      isPublished: true,
      OR: [
        { visibility: "PUBLIC" },
        { visibility: "STUDENT" },
        ...(course ? [{ visibility: "CLASS", visibleTo: { contains: course } }] : []),
      ],
    };
  }
  return { visibility: "PUBLIC", isPublished: true };
}
// Ẩn đáp án trong questions cũ (cho người đang làm)
function stripQuestionAnswers(questions: any, type?: string) {
  const arr = typeof questions === "string" ? JSON.parse(questions) : questions;
  if (!Array.isArray(arr)) return arr;
  if (type === "MATCHING") {
    const rights = arr.map((q: any) => q.right).sort(() => Math.random() - 0.5);
    return {
      pairs: arr.map((q: any) => ({ id: q.id, left: q.left })),
      choices: rights,
    };
  }
  return arr.map((q: any) => {
    const { correctAnswer, explanation, ...rest } = q;
    return rest;
  });
}
// Một bài là kiểu GAP nếu có gaps không rỗng
function isGapExercise(ex: any): boolean {
  if (!ex?.gaps) return false;
  const g = typeof ex.gaps === "string" ? JSON.parse(ex.gaps) : ex.gaps;
  return g && typeof g === "object" && Object.keys(g).length > 0;
}
// Bài có bật tính năng timer/giới hạn lượt?
function hasLimits(ex: any): boolean {
  return ex?.timeLimit != null || ex?.maxAttempts != null;
}
// ─── List exercises ───
export const listExercises = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { postId } = req.query;
    const where: any = await getVisibilityFilter(req);
    if (postId) where.postId = postId;
    const data = await prisma.interactiveExercise.findMany({
      where,
      orderBy: { orderIndex: "asc" },
      include: { creator: { select: { fullName: true } } },
    });
    const isStaff = user?.role === "ADMIN" || user?.role === "TEACHER";
    const safe = data.map((ex) => {
      const qs = typeof ex.questions === "string" ? JSON.parse(ex.questions as any) : ex.questions;
      const gapObj = ex.gaps ? (typeof ex.gaps === "string" ? JSON.parse(ex.gaps as any) : ex.gaps) : null;
      const gapCount = gapObj ? Object.keys(gapObj).length : 0;
      return {
        ...ex,
        questions: isStaff ? ex.questions : undefined,
        gaps: isStaff ? ex.gaps : undefined,
        content: isStaff ? ex.content : undefined,
        questionCount: gapCount > 0 ? gapCount : (Array.isArray(qs) ? qs.length : 0),
      };
    });
    return res.json({ success: true, data: safe });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
// ─── Detail exercise ───
export const getExercise = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const ex = await prisma.interactiveExercise.findUnique({
      where: { id: String(req.params.id) },
      include: { creator: { select: { fullName: true } }, post: { select: { title: true, slug: true } } },
    });
    if (!ex) return res.status(404).json({ success: false, message: "Không tìm thấy" });
    if (!user && ex.visibility !== "PUBLIC") {
      return res.status(401).json({ success: false, message: "Vui lòng đăng nhập" });
    }
    if (user?.role === "STUDENT" && ex.visibility === "CLASS") {
      const course = await studentCourse(req);
      if (!course || !ex.visibleTo?.includes(course)) {
        return res.status(403).json({ success: false, message: "Bạn không có quyền xem bài này" });
      }
    }
    const isStaff = user?.role === "ADMIN" || user?.role === "TEACHER";
    if (isStaff) {
      return res.json({ success: true, data: ex });
    }
    // Người làm bài: ẩn đáp án (cả gaps lẫn questions)
    const data: any = {
      ...ex,
      questions: stripQuestionAnswers(ex.questions, ex.type),
      gaps: ex.gaps ? stripGapAnswers(typeof ex.gaps === "string" ? JSON.parse(ex.gaps as any) : ex.gaps) : ex.gaps,
    };
    // HS đăng nhập + bài có giới hạn lượt: kèm số lượt còn được chấm
    const studentId = uid(req);
    if (user?.role === "STUDENT" && studentId && ex.maxAttempts != null) {
      const gradedCount = await prisma.interactiveAttempt.count({
        where: { exerciseId: ex.id, studentId, status: "SUBMITTED", isGraded: true },
      });
      data.gradedCount = gradedCount;
      data.attemptsLeft = Math.max(0, ex.maxAttempts - gradedCount);
    }
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
// ─── Create exercise ───
export const createExercise = async (req: Request, res: Response) => {
  try {
    const userId = uid(req);
    const { postId, title, description, type, questions, content, gaps, distractors,
            visibility, visibleTo, isPublished, orderIndex, timeLimit, maxAttempts } = req.body;
    if (!title || !type) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc" });
    }
    const hasGaps = gaps && Object.keys(gaps).length > 0;
    if (!hasGaps && !questions) {
      return res.status(400).json({ success: false, message: "Bài tập cần có câu hỏi hoặc chỗ trống" });
    }
    const toIntOrNull = (v: any) =>
      v === undefined || v === null || v === "" ? null : parseInt(v);
    const ex = await prisma.interactiveExercise.create({
      data: {
        postId: postId || null,
        title, description, type,
        questions: questions ?? [],
        content: content ?? null,
        gaps: hasGaps ? (normalizeGaps(gaps) as any) : undefined,
        distractors: distractors ?? undefined,
        visibility: visibility || "PUBLIC",
        visibleTo: visibleTo || null,
        isPublished: isPublished || false,
        orderIndex: orderIndex || 0,
        timeLimit: toIntOrNull(timeLimit),      // phút; null = không giới hạn giờ
        maxAttempts: toIntOrNull(maxAttempts),  // null = không giới hạn lượt chấm
        createdBy: userId!,
      },
    });
    return res.status(201).json({ success: true, data: ex });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi tạo bài tập" });
  }
};
// ─── Update exercise ───
export const updateExercise = async (req: Request, res: Response) => {
  try {
    const { creator, post, attempts, createdBy, id: _id, createdAt, updatedAt,
            questionCount, gaps, timeLimit, maxAttempts,
            gradedCount, attemptsLeft, ...rest } = req.body;
    const data: any = { ...rest };
    if (gaps !== undefined) {
      data.gaps = gaps && Object.keys(gaps).length > 0 ? (normalizeGaps(gaps) as any) : Prisma.DbNull;
    }
    const toIntOrNull = (v: any) =>
      v === null || v === "" ? null : parseInt(v);
    if (timeLimit !== undefined) data.timeLimit = toIntOrNull(timeLimit);
    if (maxAttempts !== undefined) data.maxAttempts = toIntOrNull(maxAttempts);
    const ex = await prisma.interactiveExercise.update({
      where: { id: String(req.params.id) },
      data,
    });
    return res.json({ success: true, data: ex });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi cập nhật" });
  }
};
// ─── Delete exercise ───
export const deleteExercise = async (req: Request, res: Response) => {
  try {
    await prisma.interactiveExercise.delete({ where: { id: String(req.params.id) } });
    return res.json({ success: true, message: "Đã xoá" });
  } catch {
    return res.status(500).json({ success: false, message: "Lỗi xoá" });
  }
};
// Chấm 1 bài (dùng chung cho submit + check). Trả { score, correct, total, detail }
function gradeExercise(ex: any, answers: any) {
  if (isGapExercise(ex)) {
    const gaps = typeof ex.gaps === "string" ? JSON.parse(ex.gaps) : ex.gaps;
    const r = gradeGaps(gaps, answers);
    return {
      score: r.percent,
      correct: r.score,
      total: r.maxScore,
      detail: r.detail,
    };
  }
  const questions = typeof ex.questions === "string" ? JSON.parse(ex.questions) : ex.questions;
  let correct = 0, total = 0;
  const detail: any[] = [];
  if (ex.type === "MATCHING" && Array.isArray(questions)) {
    for (const q of questions) {
      total++;
      const studentAns = answers?.[q.id];
      const isCorrect = String(studentAns ?? "").trim() === String(q.right ?? "").trim();
      if (isCorrect) correct++;
      detail.push({
        id: q.id, content: q.left,
        studentAnswer: studentAns ?? null,
        correctAnswer: q.right, isCorrect, explanation: null,
      });
    }
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    return { score, correct, total, detail };
  }
  if (Array.isArray(questions)) {
    for (const q of questions) {
      total++;
      const studentAns = answers?.[q.id];
      const isCorrect = JSON.stringify(studentAns) === JSON.stringify(q.correctAnswer);
      if (isCorrect) correct++;
      detail.push({
        id: q.id, content: q.content,
        studentAnswer: studentAns ?? null,
        correctAnswer: q.correctAnswer, isCorrect,
        explanation: q.explanation || null,
      });
    }
  }
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  return { score, correct, total, detail };
}
// ─── Start (CHỈ dùng cho bài có timeLimit/maxAttempts) ───
// POST /api/interactive/:id/start
export const startExercise = async (req: Request, res: Response) => {
  try {
    const studentId = uid(req);
    if (!studentId) return res.status(401).json({ success: false, message: "Vui lòng đăng nhập" });
    const id = String(req.params.id);
    const ex = await prisma.interactiveExercise.findUnique({ where: { id } });
    if (!ex) return res.status(404).json({ success: false, message: "Không tìm thấy" });
    // Resume: nếu đang có phiên dở thì trả lại
    const existing = await prisma.interactiveAttempt.findFirst({
      where: { exerciseId: id, studentId, status: "IN_PROGRESS" },
    });
    if (existing) {
      return res.json({
        success: true,
        data: {
          attemptId: existing.id,
          isGraded: existing.isGraded,
          timeLimit: ex.timeLimit,
          maxAttempts: ex.maxAttempts,
          startTime: existing.startTime,
          resumed: true,
        },
      });
    }
    // Hết lượt chấm → lượt mới là ôn tập
    let willBeGraded = true;
    if (ex.maxAttempts != null) {
      const gradedCount = await prisma.interactiveAttempt.count({
        where: { exerciseId: id, studentId, status: "SUBMITTED", isGraded: true },
      });
      if (gradedCount >= ex.maxAttempts) willBeGraded = false;
    }
    const attempt = await prisma.interactiveAttempt.create({
      data: {
        exerciseId: id, studentId,
        status: "IN_PROGRESS", startTime: new Date(),
        isGraded: willBeGraded, answers: Prisma.DbNull,
      },
    });
    return res.status(201).json({
      success: true,
      data: {
        attemptId: attempt.id,
        isGraded: willBeGraded,   // false = lượt ôn tập, client hiện banner
        timeLimit: ex.timeLimit,
        maxAttempts: ex.maxAttempts,
        startTime: attempt.startTime,
        resumed: false,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi bắt đầu bài" });
  }
};

// POST /api/interactive/:id/view — ghi nhận HS MỞ bài (đếm mở-không-làm)
export const recordView = async (req: Request, res: Response) => {
  try {
    const studentId = uid(req);
    if (!studentId) return res.json({ success: true });
    const exerciseId = String(req.params.id);
    await prisma.exerciseView.create({ data: { studentId, exerciseId } });
    return res.json({ success: true });
  } catch {
    return res.json({ success: true });
  }
};

// ─── Student submit (CÓ lưu) — hỗ trợ cả 2-phase (kèm attemptId) lẫn one-shot cũ ───
export const submitExercise = async (req: Request, res: Response) => {
  try {
    const studentId = uid(req);
    const id = String(req.params.id);
    const { answers, attemptId } = req.body;
    const ex = await prisma.interactiveExercise.findUnique({ where: { id } });
    if (!ex) return res.status(404).json({ success: false, message: "Không tìm thấy" });
    // Đánh dấu đã tương tác thật cho lượt MỞ gần nhất (cơ chế đếm mở-không-làm)
    if (studentId) {
      try {
        const lastView = await prisma.exerciseView.findFirst({
          where: { studentId, exerciseId: id, interacted: false },
          orderBy: { openedAt: "desc" },
        });
        if (lastView) await prisma.exerciseView.update({ where: { id: lastView.id }, data: { interacted: true } });
      } catch {}
    }
    const result = gradeExercise(ex, answers);
    // ═══ Luồng 2-phase: có attemptId → finalize phiên đang mở ═══
    if (attemptId) {
      const attempt = await prisma.interactiveAttempt.findFirst({
        where: { id: String(attemptId), exerciseId: id, studentId: studentId!, status: "IN_PROGRESS" },
      });
      if (!attempt) {
        return res.status(404).json({ success: false, message: "Phiên làm bài không tồn tại hoặc đã nộp" });
      }
      // Kiểm giờ server-side
      let autoSubmitted = false;
      if (ex.timeLimit != null && attempt.startTime) {
        const GRACE_MS = 30 * 1000;
        const elapsed = Date.now() - new Date(attempt.startTime).getTime();
        if (elapsed > ex.timeLimit * 60 * 1000 + GRACE_MS) autoSubmitted = true;
      }
      const saved = await prisma.interactiveAttempt.update({
        where: { id: attempt.id },
        data: {
          status: "SUBMITTED", answers,
          score: result.score, totalScore: result.total,
          detail: result.detail, autoSubmitted,
          // isGraded giữ nguyên giá trị đã set lúc start
        },
      });
      // Chỉ lượt ĐƯỢC CHẤM mới tính vào tiến độ gỡ cờ
      if (studentId && saved.isGraded) { try { await refreshStudyFlag(studentId); } catch {} }
      return res.json({
        success: true,
        data: {
          ...saved,
          correct: result.correct, total: result.total, detail: result.detail,
          isGraded: saved.isGraded, autoSubmitted,
        },
      });
    }
    // ═══ Luồng cũ one-shot: không attemptId → tạo attempt SUBMITTED như trước ═══
    const attempt = await prisma.interactiveAttempt.create({
      data: {
        exerciseId: id, studentId: studentId!, answers,
        score: result.score, totalScore: result.total,
        detail: result.detail,   // status mặc định "SUBMITTED", isGraded mặc định true
      },
    });
    if (studentId) { try { await refreshStudyFlag(studentId); } catch {} }
    return res.json({
      success: true,
      data: { ...attempt, correct: result.correct, total: result.total, detail: result.detail },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi nộp bài" });
  }
};
// ─── Get student attempts ───
export const getMyAttempts = async (req: Request, res: Response) => {
  const studentId = uid(req);
  const data = await prisma.interactiveAttempt.findMany({
    where: { studentId, status: "SUBMITTED" },
    orderBy: { createdAt: "desc" },
    include: { exercise: { select: { title: true, type: true } } },
  });
  return res.json({ success: true, data });
};
// ─── Public check (KHÔNG lưu) ───
export const checkExercisePublic = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { answers } = req.body;
    const ex = await prisma.interactiveExercise.findUnique({ where: { id } });
    if (!ex) return res.status(404).json({ success: false, message: "Không tìm thấy" });
    if (ex.visibility !== "PUBLIC") {
      return res.status(403).json({ success: false, message: "Bài này yêu cầu đăng nhập" });
    }
    const result = gradeExercise(ex, answers);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi chấm bài" });
  }
};
// ─── Admin/Teacher: xem thống kê lượt làm của 1 bài ───
export const getExerciseAttempts = async (req: Request, res: Response) => {
  try {
    const exerciseId = String(req.params.id);
    const ex = await prisma.interactiveExercise.findUnique({
      where: { id: exerciseId },
      select: { id: true, title: true, type: true },
    });
    if (!ex) return res.status(404).json({ success: false, message: "Không tìm thấy bài tập" });
    const attempts = await prisma.interactiveAttempt.findMany({
      where: { exerciseId, status: "SUBMITTED" },
      orderBy: { createdAt: "desc" },
      include: { student: { select: { id: true, fullName: true, studentCode: true } } },
    });
    const seen = new Set<string>();
    const latest: any[] = [];
    for (const a of attempts) {
      const key = a.studentId || `guest-${a.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      latest.push({
        attemptId: a.id,
        studentId: a.studentId,
        studentName: a.student?.fullName || "(khách vãng lai)",
        studentCode: a.student?.studentCode || null,
        score: a.score,
        detail: a.detail,
        isGraded: a.isGraded,
        autoSubmitted: a.autoSubmitted,
        createdAt: a.createdAt,
      });
    }
    const scored = latest.filter((x) => typeof x.score === "number" && x.isGraded);
    const avg = scored.length ? Math.round(scored.reduce((s, x) => s + x.score, 0) / scored.length) : null;
    return res.json({
      success: true,
      data: {
        exercise: ex,
        totalAttempts: attempts.length,
        totalStudents: latest.length,
        avgScore: avg,
        students: latest,
      },
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
};