// FILE: src/controllers/interactive.controller.ts — GHI ĐÈ
// Bài tập tương tác
// FIX 1: ẩn correctAnswer/explanation khi người dùng đang LÀM bài (getExercise)
// FIX 2: req.user.id → req.user.userId
// FIX 3: updateExercise lọc field, submit trả kết quả chi tiết để hiện đáp án sau khi nộp
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function uid(req: Request): string | undefined {
  return (req as any).user?.userId;
}

/**
 * Build visibility filter dựa trên role + course của user
 */
function getVisibilityFilter(user: any) {
  if (!user) {
    return { visibility: "PUBLIC", isPublished: true };
  }
  if (user.role === "ADMIN" || user.role === "TEACHER") {
    return {};
  }
  if (user.role === "STUDENT") {
    return {
      isPublished: true,
      OR: [
        { visibility: "PUBLIC" },
        { visibility: "STUDENT" },
        ...(user.course ? [{
          visibility: "CLASS",
          visibleTo: { contains: user.course }
        }] : []),
      ],
    };
  }
  return { visibility: "PUBLIC", isPublished: true };
}

// Ẩn đáp án đúng + giải thích trong từng câu hỏi (cho người ĐANG làm bài)
function stripAnswers(questions: any) {
  const arr = typeof questions === "string" ? JSON.parse(questions) : questions;
  if (!Array.isArray(arr)) return arr;
  return arr.map((q: any) => {
    const { correctAnswer, explanation, ...rest } = q;
    return rest;
  });
}

// ─── List exercises (filter theo phân quyền) ───
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
    // List không cần trả questions chi tiết — chỉ cần meta + đếm số câu
    const isStaff = user?.role === "ADMIN" || user?.role === "TEACHER";
    const safe = data.map((ex) => {
      const qs = typeof ex.questions === "string" ? JSON.parse(ex.questions as any) : ex.questions;
      return {
        ...ex,
        // Admin/Teacher giữ nguyên questions để quản lý; người khác chỉ thấy số câu
        questions: isStaff ? ex.questions : undefined,
        questionCount: Array.isArray(qs) ? qs.length : 0,
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
      where: { id: req.params.id },
      include: { creator: { select: { fullName: true } }, post: { select: { title: true, slug: true } } },
    });
    if (!ex) return res.status(404).json({ success: false, message: "Không tìm thấy" });

    // Kiểm tra quyền
    if (!user && ex.visibility !== "PUBLIC") {
      return res.status(401).json({ success: false, message: "Vui lòng đăng nhập" });
    }
    if (user?.role === "STUDENT" && ex.visibility === "CLASS") {
      if (!user.course || !ex.visibleTo?.includes(user.course)) {
        return res.status(403).json({ success: false, message: "Bạn không có quyền xem bài này" });
      }
    }

    const isStaff = user?.role === "ADMIN" || user?.role === "TEACHER";
    // Admin/Teacher xem full (để sửa); người làm bài thì ẩn đáp án
    const data = isStaff
      ? ex
      : { ...ex, questions: stripAnswers(ex.questions) };

    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ─── Create exercise (Admin/Teacher) ───
export const createExercise = async (req: Request, res: Response) => {
  try {
    const userId = uid(req);
    const { postId, title, description, type, questions, visibility, visibleTo, isPublished, orderIndex } = req.body;
    if (!title || !type || !questions) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc" });
    }
    const ex = await prisma.interactiveExercise.create({
      data: {
        postId: postId || null,
        title, description, type,
        questions,
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
    const { creator, post, attempts, createdBy, id: _id, createdAt, updatedAt, questionCount, ...data } = req.body;
    const ex = await prisma.interactiveExercise.update({
      where: { id: req.params.id },
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
    await prisma.interactiveExercise.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: "Đã xoá" });
  } catch {
    return res.status(500).json({ success: false, message: "Lỗi xoá" });
  }
};

// ─── Student submit answers ───
export const submitExercise = async (req: Request, res: Response) => {
  try {
    const studentId = uid(req);
    const { id } = req.params;
    const { answers } = req.body;
    const ex = await prisma.interactiveExercise.findUnique({ where: { id } });
    if (!ex) return res.status(404).json({ success: false, message: "Không tìm thấy" });

    const questions = typeof ex.questions === "string" ? JSON.parse(ex.questions as any) : ex.questions;
    let correct = 0, total = 0;
    const detail: any[] = [];
    if (Array.isArray(questions)) {
      for (const q of questions) {
        total++;
        const studentAns = answers?.[q.id];
        const correctAns = q.correctAnswer;
        const isCorrect = JSON.stringify(studentAns) === JSON.stringify(correctAns);
        if (isCorrect) correct++;
        detail.push({
          id: q.id,
          content: q.content,
          studentAnswer: studentAns ?? null,
          correctAnswer: correctAns,
          isCorrect,
          explanation: q.explanation || null,
        });
      }
    }
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;

    const attempt = await prisma.interactiveAttempt.create({
      data: { exerciseId: id, studentId: studentId!, answers, score, totalScore: total },
    });

    // Trả kết quả chi tiết để frontend hiện đáp án đúng + giải thích sau khi nộp
    return res.json({ success: true, data: { ...attempt, correct, total, detail } });
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

// ─── Public: chấm bài PUBLIC mà KHÔNG lưu (cho khách vãng lai) ───
// POST /api/interactive/:id/check  (không cần auth)
export const checkExercisePublic = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;
    const ex = await prisma.interactiveExercise.findUnique({ where: { id } });
    if (!ex) return res.status(404).json({ success: false, message: "Không tìm thấy" });

    // Chỉ cho chấm bài PUBLIC qua route này
    if (ex.visibility !== "PUBLIC") {
      return res.status(403).json({ success: false, message: "Bài này yêu cầu đăng nhập" });
    }

    const questions = typeof ex.questions === "string" ? JSON.parse(ex.questions as any) : ex.questions;
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
    // KHÔNG lưu attempt — chỉ trả kết quả
    return res.json({ success: true, data: { score, correct, total, detail } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi chấm bài" });
  }
};
