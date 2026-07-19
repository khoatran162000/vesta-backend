// FILE: src/controllers/interactive.controller.ts — GHI ĐÈ (LearnClick gaps)
// Bài tập tương tác — hỗ trợ cả mô hình GAP (LearnClick) lẫn questions cũ
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
    // Giữ left + id, ẩn right (đáp án). Trộn thứ tự "right" để học viên nối.
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
    const data = {
      ...ex,
      questions: stripQuestionAnswers(ex.questions, ex.type),
      gaps: ex.gaps ? stripGapAnswers(typeof ex.gaps === "string" ? JSON.parse(ex.gaps as any) : ex.gaps) : ex.gaps,
    };
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
            visibility, visibleTo, isPublished, orderIndex } = req.body;
    if (!title || !type) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc" });
    }
    // Phải có HOẶC questions HOẶC gaps
    const hasGaps = gaps && Object.keys(gaps).length > 0;
    if (!hasGaps && !questions) {
      return res.status(400).json({ success: false, message: "Bài tập cần có câu hỏi hoặc chỗ trống" });
    }
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
            questionCount, gaps, ...rest } = req.body;
    const data: any = { ...rest };
    // Nếu có gaps trong body thì chuẩn hoá lại trước khi lưu
    if (gaps !== undefined) {
      data.gaps = gaps && Object.keys(gaps).length > 0 ? (normalizeGaps(gaps) as any) : Prisma.DbNull;
    }
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

// Chấm 1 bài (dùng chung cho submit + check). Trả { score, maxScore, percent, detail }
function gradeExercise(ex: any, answers: any) {
  if (isGapExercise(ex)) {
    const gaps = typeof ex.gaps === "string" ? JSON.parse(ex.gaps) : ex.gaps;
    const r = gradeGaps(gaps, answers);
    return {
      score: r.percent,        // % để đồng nhất thang điểm cũ
      correct: r.score,
      total: r.maxScore,
      detail: r.detail,
    };
  }
  // Bài cũ kiểu questions
  const questions = typeof ex.questions === "string" ? JSON.parse(ex.questions) : ex.questions;
  let correct = 0, total = 0;
  const detail: any[] = [];

  // MATCHING: mỗi cặp {id, left, right}; answers[pairId] = giá trị "right" học viên nối
  if (ex.type === "MATCHING" && Array.isArray(questions)) {
    for (const q of questions) {
      total++;
      const studentAns = answers?.[q.id];
      const isCorrect = String(studentAns ?? "").trim() === String(q.right ?? "").trim();
      if (isCorrect) correct++;
      detail.push({
        id: q.id,
        content: q.left,
        studentAnswer: studentAns ?? null,
        correctAnswer: q.right,
        isCorrect,
        explanation: null,
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
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation || null,
      });
    }
  }
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  return { score, correct, total, detail };
}

// ─── Student submit (CÓ lưu) ───
export const submitExercise = async (req: Request, res: Response) => {
  try {
    const studentId = uid(req);
    const id = String(req.params.id);
    const { answers } = req.body;
    const ex = await prisma.interactiveExercise.findUnique({ where: { id } });
    if (!ex) return res.status(404).json({ success: false, message: "Không tìm thấy" });
    const result = gradeExercise(ex, answers);
    const attempt = await prisma.interactiveAttempt.create({
      data: {
        exerciseId: id, studentId: studentId!, answers,
        score: result.score, totalScore: result.total,
        detail: result.detail,
      },
    });
    // Vừa nộp bài — nếu đủ 4 bài ≥85% thì gỡ cờ/khoá NGAY (không đợi cron CN)
    if (studentId) { try { await refreshStudyFlag(studentId); } catch {} }
    return res.json({ success: true, data: { ...attempt, correct: result.correct, total: result.total, detail: result.detail } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi nộp bài" });
  }
};

// ─── Get student attempts ───
export const getMyAttempts = async (req: Request, res: Response) => {
  const studentId = uid(req);
  const data = await prisma.interactiveAttempt.findMany({
    where: { studentId },
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
      where: { exerciseId },
      orderBy: { createdAt: "desc" },
      include: { student: { select: { id: true, fullName: true, studentCode: true } } },
    });

    // Gộp theo HV: giữ lượt MỚI NHẤT của mỗi học viên (đã sort desc nên gặp đầu là mới nhất)
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
        createdAt: a.createdAt,
      });
    }

    const scored = latest.filter((x) => typeof x.score === "number");
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