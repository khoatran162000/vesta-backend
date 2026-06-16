// FILE: src/controllers/interactive.controller.ts — GHI ĐÈ (LearnClick gaps)
// Bài tập tương tác — hỗ trợ cả mô hình GAP (LearnClick) lẫn questions cũ
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { gradeGaps, normalizeGaps, stripGapAnswers } from "../utils/gradeGaps";
const prisma = new PrismaClient();

function uid(req: Request): string | undefined {
  return (req as any).user?.userId;
}

function getVisibilityFilter(user: any) {
  if (!user) return { visibility: "PUBLIC", isPublished: true };
  if (user.role === "ADMIN" || user.role === "TEACHER") return {};
  if (user.role === "STUDENT") {
    return {
      isPublished: true,
      OR: [
        { visibility: "PUBLIC" },
        { visibility: "STUDENT" },
        ...(user.course ? [{ visibility: "CLASS", visibleTo: { contains: user.course } }] : []),
      ],
    };
  }
  return { visibility: "PUBLIC", isPublished: true };
}

// Ẩn đáp án trong questions cũ (cho người đang làm)
function stripQuestionAnswers(questions: any) {
  const arr = typeof questions === "string" ? JSON.parse(questions) : questions;
  if (!Array.isArray(arr)) return arr;
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
    const where: any = getVisibilityFilter(user);
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
      if (!user.course || !ex.visibleTo?.includes(user.course)) {
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
      questions: stripQuestionAnswers(ex.questions),
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
      data.gaps = gaps && Object.keys(gaps).length > 0 ? (normalizeGaps(gaps) as any) : undefined;
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