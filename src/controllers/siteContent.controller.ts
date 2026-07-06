// FILE: src/controllers/siteContent.controller.ts — Nội dung khối tĩnh landing
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function parseJsonField(val: any, fallback: any) {
  if (val === undefined || val === null || val === "") return fallback;
  if (typeof val === "string") { try { return JSON.parse(val); } catch { return fallback; } }
  return val;
}

// GET /site-content — tất cả khối (landing + admin đều gọi)
export const listSiteContent = async (_req: Request, res: Response) => {
  try {
    const data = await prisma.siteContent.findMany({ orderBy: { key: "asc" } });
    return res.json({ success: true, data });
  } catch {
    return res.status(500).json({ success: false, message: "Lỗi tải nội dung" });
  }
};

// GET /site-content/:key — 1 khối theo key
export const getSiteContent = async (req: Request, res: Response) => {
  try {
    const item = await prisma.siteContent.findUnique({ where: { key: String(req.params.key) } });
    if (!item) return res.status(404).json({ success: false, message: "Không tìm thấy khối" });
    return res.json({ success: true, data: item });
  } catch {
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// PUT /site-content/:key — cập nhật (tạo nếu chưa có = upsert)
export const upsertSiteContent = async (req: Request, res: Response) => {
  try {
    const key = String(req.params.key);
    const dataField = req.file
      ? { ...parseJsonField(req.body.data, {}), qrFromFile: `/uploads/blog/${req.file.filename}` } // trường hợp có upload
      : parseJsonField(req.body.data, {});
    const label = req.body.label || key;

    // Nếu upload QR: gắn qrUrl vào data.bank
    let finalData: any = parseJsonField(req.body.data, {});
    if (req.file) {
      finalData = { ...finalData, bank: { ...(finalData.bank || {}), qrUrl: `/uploads/blog/${req.file.filename}` } };
    }

    const item = await prisma.siteContent.upsert({
      where: { key },
      update: { data: finalData, label },
      create: { key, label, data: finalData },
    });
    return res.json({ success: true, data: item });
  } catch {
    return res.status(500).json({ success: false, message: "Lỗi lưu nội dung" });
  }
};