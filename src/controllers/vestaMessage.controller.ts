// FILE: src/controllers/vestaMessage.controller.ts — Tâm sự với Vesta (HS gửi câu hỏi/chia sẻ/đề xuất)
import { Request, Response } from "express";
import prisma from "../config/database";
import * as api from "../utils/apiResponse";

const CATS = ["QUESTION", "SHARE", "SUGGEST"];

// POST /api/student/vesta-messages — HS gửi
export async function createMessage(req: Request, res: Response) {
  try {
    const studentId = req.user!.userId;
    const category = CATS.includes(req.body.category) ? req.body.category : "SHARE";
    const content = String(req.body.content || "").trim();
    if (!content) return api.error(res, "Nội dung không được để trống");
    const msg = await prisma.vestaMessage.create({ data: { studentId, category, content } });
    return api.created(res, msg, "Đã gửi. Cảm ơn bạn đã chia sẻ với VESTA!");
  } catch (err) {
    console.error("Create vesta message error:", err);
    return api.error(res, "Lỗi server", 500);
  }
}

// GET /api/student/vesta-messages — HS xem của mình
export async function listMyMessages(req: Request, res: Response) {
  try {
    const rows = await prisma.vestaMessage.findMany({
      where: { studentId: req.user!.userId },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ success: true, data: rows });
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}

// GET /api/vesta-messages?status=&category= — admin đọc hết
export async function listAllMessages(req: Request, res: Response) {
  try {
    const where: any = {};
    if (req.query.status) where.status = String(req.query.status);
    if (req.query.category) where.category = String(req.query.category);
    const rows = await prisma.vestaMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { student: { select: { fullName: true, studentCode: true, course: true } } },
    });
    const newCount = await prisma.vestaMessage.count({ where: { status: "NEW" } });
    return res.json({ success: true, data: rows, newCount });
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}

// PATCH /api/vesta-messages/:id — admin đổi trạng thái / trả lời
export async function updateMessage(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const data: any = {};
    if (req.body.status) data.status = String(req.body.status);
    if (req.body.adminReply !== undefined) {
      const reply = String(req.body.adminReply || "").trim();
      data.adminReply = reply || null;
      data.repliedAt = reply ? new Date() : null;
      if (reply) data.status = "REPLIED";
    }
    const msg = await prisma.vestaMessage.update({ where: { id }, data });
    return api.success(res, msg, "Đã cập nhật");
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}

// GET /api/vesta-messages/count-new — badge admin
export async function countNew(_req: Request, res: Response) {
  try {
    const count = await prisma.vestaMessage.count({ where: { status: "NEW" } });
    return res.json({ success: true, count });
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}
