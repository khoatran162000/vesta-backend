import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Public — danh sách trình độ đang bật, để admin/landing đổ dropdown
export const listLevels = async (_req: Request, res: Response) => {
  try {
    const data = await prisma.level.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { code: "asc" }],
    });
    return res.json({ success: true, data });
  } catch {
    return res.status(500).json({ success: false, message: "Lỗi tải danh sách trình độ" });
  }
};

export const createLevel = async (req: Request, res: Response) => {
  try {
    const { code, label, order } = req.body;
    if (!code || !String(code).trim()) return res.status(400).json({ success: false, message: "Thiếu mã trình độ" });
    const data = await prisma.level.create({
      data: {
        code: String(code).trim(),
        label: label ? String(label).trim() : null,
        order: order != null ? parseInt(String(order), 10) || 0 : 0,
      },
    });
    return res.status(201).json({ success: true, data });
  } catch (error: any) {
    if (error?.code === "P2002") return res.status(400).json({ success: false, message: "Mã trình độ đã tồn tại" });
    return res.status(500).json({ success: false, message: "Lỗi tạo trình độ" });
  }
};

export const updateLevel = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const existing = await prisma.level.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: "Không tìm thấy" });
    const { code, label, order, isActive } = req.body;
    const data: any = {};
    // CHẶN đổi code nếu đang có lớp/khoá dùng — tránh lệch dữ liệu cũ
    if (code !== undefined && String(code).trim() !== existing.code) {
      const used = await prisma.class.count({ where: { course: existing.code } });
      const usedCourse = await prisma.course.count({ where: { level: existing.code } });
      if (used + usedCourse > 0) {
        return res.status(400).json({ success: false, message: `Không đổi được mã: còn ${used} lớp và ${usedCourse} khoá đang dùng "${existing.code}"` });
      }
      data.code = String(code).trim();
    }
    if (label !== undefined) data.label = label ? String(label).trim() : null;
    if (order !== undefined) data.order = parseInt(String(order), 10) || 0;
    if (isActive !== undefined) data.isActive = Boolean(isActive);
    const updated = await prisma.level.update({ where: { id }, data });
    return res.json({ success: true, data: updated });
  } catch (error: any) {
    if (error?.code === "P2002") return res.status(400).json({ success: false, message: "Mã trình độ đã tồn tại" });
    return res.status(500).json({ success: false, message: "Lỗi cập nhật trình độ" });
  }
};

export const deleteLevel = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const existing = await prisma.level.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: "Không tìm thấy" });
    // CHẶN xoá nếu đang được dùng
    const usedClass = await prisma.class.count({ where: { course: existing.code } });
    const usedCourse = await prisma.course.count({ where: { level: existing.code } });
    if (usedClass + usedCourse > 0) {
      return res.status(400).json({
        success: false,
        message: `Không xoá được: còn ${usedClass} lớp và ${usedCourse} khoá đang dùng trình độ "${existing.code}"`,
      });
    }
    await prisma.level.delete({ where: { id } });
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ success: false, message: "Lỗi xoá trình độ" });
  }
};