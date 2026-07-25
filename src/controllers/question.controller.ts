/**
 * FILE: question.controller.ts
 * PATH: apps/api/src/controllers/question.controller.ts
 * MÔ TẢ: Quản lý câu hỏi — list by exam, create, update, delete, reorder
 */
import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../config/database";
import * as api from "../utils/apiResponse";
import { normalizeGaps } from "../utils/gradeGaps";

type Params = { [key: string]: string };

/**
 * Nhận cả JSON (form gửi chuỗi JSON) lẫn CHUỖI THƯỜNG (đáp án GV gõ tay).
 * JSON.parse thẳng sẽ throw với "has been" hoặc chuỗi rỗng → trước đây gây "Lỗi server".
 * Chỉ parse khi chuỗi trông giống JSON; parse fail thì giữ nguyên chuỗi.
 */
function parseMaybeJson(v: any): any {
  if (typeof v !== "string") return v;
  const s = v.trim();
  if (s === "") return "";
  const looksJson = /^[\[{]/.test(s) || /^-?\d+(\.\d+)?$/.test(s) || s === "true" || s === "false" || s === "null";
  if (!looksJson) return v;
  try { return JSON.parse(s); } catch { return v; }
}

/**
 * Chuẩn hoá gaps nhận từ form (câu FILL_IN_BLANK nhiều gap kiểu LearnClick).
 * Trả về:
 *   - GapMap đã normalize (answers tách #, có type/options/hint) nếu có gap
 *   - null nếu không có gap → lưu Prisma.DbNull để cột gaps = NULL
 * Chấp nhận gaps là object hoặc chuỗi JSON.
 */
function prepareGaps(raw: any): Prisma.InputJsonValue | typeof Prisma.DbNull {
  if (raw === undefined || raw === null || raw === "") return Prisma.DbNull;
  const obj = typeof raw === "string" ? parseMaybeJson(raw) : raw;
  if (!obj || typeof obj !== "object" || Object.keys(obj).length === 0) return Prisma.DbNull;
  const norm = normalizeGaps(obj);
  return Object.keys(norm).length > 0 ? (norm as any) : Prisma.DbNull;
}

// GET /api/questions?examId=xxx
export async function listQuestions(req: Request, res: Response) {
  try {
    const examId = req.query.examId as string;
    if (!examId) return api.error(res, "examId là bắt buộc");
    const questions = await prisma.question.findMany({
      where: { examId },
      orderBy: { orderIndex: "asc" },
    });
    return api.success(res, questions);
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}

// GET /api/questions/:id
export async function getQuestionById(req: Request<Params>, res: Response) {
  try {
    const id = req.params.id as string;
    const question = await prisma.question.findUnique({
      where: { id },
      include: { exam: { select: { id: true, title: true } } },
    });
    if (!question) return api.error(res, "Câu hỏi không tồn tại", 404);
    return api.success(res, question);
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}

// POST /api/questions
export async function createQuestion(req: Request, res: Response) {
  try {
    const { examId, type, content, mediaUrl, options, correctAnswer, explanation, score, gaps } = req.body;
    // Câu nhiều gap: đáp án nằm trong gaps, cho phép correctAnswer trống (object rỗng)
    const gapsValue = prepareGaps(gaps);
    const hasGaps = gapsValue !== Prisma.DbNull;
    if (!examId || !type || !content || (correctAnswer === undefined && !hasGaps)) {
      return api.error(res, "examId, loại câu hỏi, nội dung và đáp án đúng không được để trống");
    }
    // Kiểm tra exam tồn tại
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) return api.error(res, "Đề thi không tồn tại", 404);
    // Lấy orderIndex tiếp theo
    const lastQuestion = await prisma.question.findFirst({
      where: { examId },
      orderBy: { orderIndex: "desc" },
      select: { orderIndex: true },
    });
    const nextOrder = (lastQuestion?.orderIndex ?? -1) + 1;
    const question = await prisma.question.create({
      data: {
        examId,
        type,
        content,
        mediaUrl: mediaUrl || null,
        options: options ? parseMaybeJson(options) : null,
        // câu gap: correctAnswer không dùng khi chấm → lưu {} cho hợp lệ (cột Json NOT NULL)
        correctAnswer: hasGaps ? (parseMaybeJson(correctAnswer ?? {}) || {}) : parseMaybeJson(correctAnswer),
        gaps: gapsValue,
        explanation: explanation || null,
        orderIndex: nextOrder,
        score: score ? parseFloat(score) : 1,
      },
    });
    return api.created(res, question, "Tạo câu hỏi thành công");
  } catch (err) {
    console.error("Create question error:", err);
    return api.error(res, "Lỗi server", 500);
  }
}

// PUT /api/questions/:id
export async function updateQuestion(req: Request<Params>, res: Response) {
  try {
    const id = req.params.id as string;
    const { type, content, mediaUrl, options, correctAnswer, explanation, score, gaps } = req.body;
    const existing = await prisma.question.findUnique({ where: { id } });
    if (!existing) return api.error(res, "Câu hỏi không tồn tại", 404);
    const updateData: any = {};
    if (type) updateData.type = type;
    if (content) updateData.content = content;
    if (mediaUrl !== undefined) updateData.mediaUrl = mediaUrl || null;
    if (options !== undefined) {
      updateData.options = parseMaybeJson(options);
    }
    if (correctAnswer !== undefined) {
      updateData.correctAnswer = parseMaybeJson(correctAnswer);
    }
    // gaps gửi lên (kể cả rỗng) → cập nhật; không gửi thì giữ nguyên
    if (gaps !== undefined) {
      updateData.gaps = prepareGaps(gaps);
    }
    if (explanation !== undefined) updateData.explanation = explanation;
    if (score !== undefined) updateData.score = parseFloat(score);
    const question = await prisma.question.update({
      where: { id },
      data: updateData,
    });
    return api.success(res, question, "Cập nhật câu hỏi thành công");
  } catch (err) {
    console.error("Update question error:", err);
    return api.error(res, "Lỗi server", 500);
  }
}

// DELETE /api/questions/:id
export async function deleteQuestion(req: Request<Params>, res: Response) {
  try {
    const id = req.params.id as string;
    const existing = await prisma.question.findUnique({ where: { id } });
    if (!existing) return api.error(res, "Câu hỏi không tồn tại", 404);
    await prisma.question.delete({ where: { id } });
    return api.success(res, null, "Xoá câu hỏi thành công");
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}

// PUT /api/questions/reorder
export async function reorderQuestions(req: Request, res: Response) {
  try {
    const { orders } = req.body;
    // orders: [{ id: "xxx", orderIndex: 0 }, { id: "yyy", orderIndex: 1 }, ...]
    if (!Array.isArray(orders)) return api.error(res, "Dữ liệu không hợp lệ");
    for (const item of orders) {
      await prisma.question.update({
        where: { id: item.id },
        data: { orderIndex: item.orderIndex },
      });
    }
    return api.success(res, null, "Sắp xếp lại câu hỏi thành công");
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}