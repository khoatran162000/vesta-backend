// FILE: src/controllers/teacher.controller.ts — CRUD giáo viên (landing)
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// GET /teachers — landing lấy published, admin/staff lấy tất cả
export const listTeachers = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const isStaff = user?.role === "ADMIN" || user?.role === "TEACHER";
    const where = isStaff ? {} : { isPublished: true };
    const data = await prisma.teacher.findMany({
      where,
      orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
    });
    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: "Lỗi tải danh sách giáo viên" });
  }
};

// GET /teachers/:id
export const getTeacher = async (req: Request, res: Response) => {
  try {
    const t = await prisma.teacher.findUnique({ where: { id: String(req.params.id) } });
    if (!t) return res.status(404).json({ success: false, message: "Không tìm thấy" });
    return res.json({ success: true, data: t });
  } catch {
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// Parse field JSON từ FormData (gửi dạng string) hoặc JSON body
function parseJsonField(val: any, fallback: any) {
  if (val === undefined || val === null || val === "") return fallback;
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return fallback; }
  }
  return val;
}

// POST /teachers
export const createTeacher = async (req: Request, res: Response) => {
  try {
    const { name, ma, subtitle, orderIndex, isPublished } = req.body;
    if (!name || !subtitle) {
      return res.status(400).json({ success: false, message: "Thiếu tên hoặc mô tả" });
    }
    const photoUrl = req.file ? `/uploads/blog/${req.file.filename}` : (req.body.photoUrl || null);
    const t = await prisma.teacher.create({
      data: {
        name,
        ma: ma || null,
        subtitle,
        photoUrl,
        badges: parseJsonField(req.body.badges, []),
        credentials: parseJsonField(req.body.credentials, []),
        orderIndex: orderIndex ? parseInt(String(orderIndex), 10) : 0,
        isPublished: isPublished === "false" ? false : Boolean(isPublished ?? true),
      },
    });
    return res.status(201).json({ success: true, data: t });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: "Lỗi tạo giáo viên" });
  }
};

// PUT /teachers/:id
export const updateTeacher = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const existing = await prisma.teacher.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: "Không tìm thấy" });

    const data: any = {};
    if (req.body.name !== undefined) data.name = req.body.name;
    if (req.body.ma !== undefined) data.ma = req.body.ma || null;
    if (req.body.subtitle !== undefined) data.subtitle = req.body.subtitle;
    if (req.body.badges !== undefined) data.badges = parseJsonField(req.body.badges, existing.badges);
    if (req.body.credentials !== undefined) data.credentials = parseJsonField(req.body.credentials, existing.credentials);
    if (req.body.orderIndex !== undefined) data.orderIndex = parseInt(String(req.body.orderIndex), 10) || 0;
    if (req.body.isPublished !== undefined) data.isPublished = req.body.isPublished === "false" ? false : Boolean(req.body.isPublished);
    // Ảnh: chỉ đổi khi có file mới; nếu client gửi photoUrl="" nghĩa là xoá ảnh
    if (req.file) data.photoUrl = `/uploads/blog/${req.file.filename}`;
    else if (req.body.photoUrl !== undefined) data.photoUrl = req.body.photoUrl || null;

    const t = await prisma.teacher.update({ where: { id }, data });
    return res.json({ success: true, data: t });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: "Lỗi cập nhật" });
  }
};

// DELETE /teachers/:id
export const deleteTeacher = async (req: Request, res: Response) => {
  try {
    await prisma.teacher.delete({ where: { id: String(req.params.id) } });
    return res.json({ success: true, message: "Đã xoá" });
  } catch {
    return res.status(500).json({ success: false, message: "Lỗi xoá" });
  }
};