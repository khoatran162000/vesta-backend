// FILE: src/controllers/book.controller.ts — CRUD sách/giáo trình (landing)
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function toBool(v: any, def = false) {
  if (v === undefined || v === null) return def;
  if (typeof v === "boolean") return v;
  return v === "true" || v === "1" || v === 1;
}

export const listBooks = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const isStaff = user?.role === "ADMIN" || user?.role === "TEACHER";
    const where = isStaff ? {} : { isPublished: true };
    const data = await prisma.book.findMany({ where, orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }] });
    return res.json({ success: true, data });
  } catch {
    return res.status(500).json({ success: false, message: "Lỗi tải danh sách sách" });
  }
};

export const getBook = async (req: Request, res: Response) => {
  try {
    const b = await prisma.book.findUnique({ where: { id: String(req.params.id) } });
    if (!b) return res.status(404).json({ success: false, message: "Không tìm thấy" });
    return res.json({ success: true, data: b });
  } catch {
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

export const createBook = async (req: Request, res: Response) => {
  try {
    const b = req.body;
    if (!b.title || !b.price) return res.status(400).json({ success: false, message: "Thiếu tên hoặc giá sách" });
    const book = await prisma.book.create({
      data: {
        title: b.title, price: b.price,
        highlight: toBool(b.highlight),
        orderIndex: b.orderIndex ? parseInt(String(b.orderIndex), 10) : 0,
        isPublished: toBool(b.isPublished, true),
      },
    });
    return res.status(201).json({ success: true, data: book });
  } catch {
    return res.status(500).json({ success: false, message: "Lỗi tạo sách" });
  }
};

export const updateBook = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const existing = await prisma.book.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: "Không tìm thấy" });
    const b = req.body;
    const data: any = {};
    if (b.title !== undefined) data.title = b.title;
    if (b.price !== undefined) data.price = b.price;
    if (b.highlight !== undefined) data.highlight = toBool(b.highlight);
    if (b.orderIndex !== undefined) data.orderIndex = parseInt(String(b.orderIndex), 10) || 0;
    if (b.isPublished !== undefined) data.isPublished = toBool(b.isPublished);
    const book = await prisma.book.update({ where: { id }, data });
    return res.json({ success: true, data: book });
  } catch {
    return res.status(500).json({ success: false, message: "Lỗi cập nhật" });
  }
};

export const deleteBook = async (req: Request, res: Response) => {
  try {
    await prisma.book.delete({ where: { id: String(req.params.id) } });
    return res.json({ success: true, message: "Đã xoá" });
  } catch {
    return res.status(500).json({ success: false, message: "Lỗi xoá" });
  }
};