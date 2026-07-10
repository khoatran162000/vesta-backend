// FILE: src/controllers/course.controller.ts — CRUD khoá học (landing)
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function parseJsonField(val: any, fallback: any) {
  if (val === undefined || val === null || val === "") return fallback;
  if (typeof val === "string") { try { return JSON.parse(val); } catch { return fallback; } }
  return val;
}
function toBool(v: any, def = false) {
  if (v === undefined || v === null) return def;
  if (typeof v === "boolean") return v;
  return v === "true" || v === "1" || v === 1;
}

export const listCourses = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const isStaff = user?.role === "ADMIN" || user?.role === "TEACHER";
    const where = isStaff ? {} : { isPublished: true };
    const data = await prisma.course.findMany({
      where,
      orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
    });
    return res.json({ success: true, data });
  } catch {
    return res.status(500).json({ success: false, message: "Lỗi tải danh sách khoá học" });
  }
};

export const getCourse = async (req: Request, res: Response) => {
  try {
    const c = await prisma.course.findUnique({ where: { id: String(req.params.id) } });
    if (!c) return res.status(404).json({ success: false, message: "Không tìm thấy" });
    return res.json({ success: true, data: c });
  } catch {
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

export const createCourse = async (req: Request, res: Response) => {
  try {
    const b = req.body;
    if (!b.title) return res.status(400).json({ success: false, message: "Thiếu tiêu đề khoá học" });
    const c = await prisma.course.create({
      data: {
        cardType: b.cardType || "FULL",
        title: b.title,
        badge: b.badge || null,
        isSpecial: toBool(b.isSpecial),
        badgeOutline: toBool(b.badgeOutline),
        features: parseJsonField(b.features, []),
        commitment: b.commitment || null,
        scheduleLabel: b.scheduleLabel || null,
        schedule: b.schedule || null,
        price: b.price || null,
        onlinePrice: b.onlinePrice || null,
        cta: b.cta || null,
        ctaLink: b.ctaLink || null,
        specialPrice: b.specialPrice || null,
        originalPrice: b.originalPrice || null,
        orderIndex: b.orderIndex ? parseInt(String(b.orderIndex), 10) : 0,
        isPublished: toBool(b.isPublished, true),
      },
    });
    return res.status(201).json({ success: true, data: c });
  } catch {
    return res.status(500).json({ success: false, message: "Lỗi tạo khoá học" });
  }
};

export const updateCourse = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: "Không tìm thấy" });
    const b = req.body;
    const data: any = {};
    if (b.cardType !== undefined) data.cardType = b.cardType;
    if (b.title !== undefined) data.title = b.title;
    if (b.badge !== undefined) data.badge = b.badge || null;
    if (b.isSpecial !== undefined) data.isSpecial = toBool(b.isSpecial);
    if (b.badgeOutline !== undefined) data.badgeOutline = toBool(b.badgeOutline);
    if (b.features !== undefined) data.features = parseJsonField(b.features, existing.features);
    if (b.commitment !== undefined) data.commitment = b.commitment || null;
    if (b.scheduleLabel !== undefined) data.scheduleLabel = b.scheduleLabel || null;
    if (b.schedule !== undefined) data.schedule = b.schedule || null;
    if (b.price !== undefined) data.price = b.price || null;
    if (b.onlinePrice !== undefined) data.onlinePrice = b.onlinePrice || null;
    if (b.cta !== undefined) data.cta = b.cta || null;
    if (b.ctaLink !== undefined) data.ctaLink = b.ctaLink || null;
    if (b.specialPrice !== undefined) data.specialPrice = b.specialPrice || null;
    if (b.originalPrice !== undefined) data.originalPrice = b.originalPrice || null;
    if (b.orderIndex !== undefined) data.orderIndex = parseInt(String(b.orderIndex), 10) || 0;
    if (b.isPublished !== undefined) data.isPublished = toBool(b.isPublished);
    const c = await prisma.course.update({ where: { id }, data });
    return res.json({ success: true, data: c });
  } catch {
    return res.status(500).json({ success: false, message: "Lỗi cập nhật" });
  }
};

export const deleteCourse = async (req: Request, res: Response) => {
  try {
    await prisma.course.delete({ where: { id: String(req.params.id) } });
    return res.json({ success: true, message: "Đã xoá" });
  } catch {
    return res.status(500).json({ success: false, message: "Lỗi xoá" });
  }
};