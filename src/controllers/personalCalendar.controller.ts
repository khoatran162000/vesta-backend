// FILE: src/controllers/personalCalendar.controller.ts — Lịch cá nhân per-user (chỉ chủ tài khoản đọc/ghi)
import { Request, Response } from "express";
import prisma from "../config/database";

const keyFor = (userId: string) => `personal_cal_${userId}`;

// GET /api/personal-calendar — lấy dữ liệu lịch của chính mình
export const getMyCalendar = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const row = await prisma.siteContent.findUnique({ where: { key: keyFor(userId) } });
    const data = (row?.data as any) || {};
    return res.json({ success: true, data: { store: data.store || {} } });
  } catch (err) {
    console.error("getMyCalendar error:", err);
    return res.status(500).json({ success: false, message: "Lỗi tải lịch cá nhân" });
  }
};

// PUT /api/personal-calendar — lưu (upsert) dữ liệu lịch của chính mình
export const saveMyCalendar = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const store = (req.body && req.body.store) || {};
    await prisma.siteContent.upsert({
      where: { key: keyFor(userId) },
      update: { data: { store }, label: "Lịch cá nhân (dữ liệu)" },
      create: { key: keyFor(userId), label: "Lịch cá nhân (dữ liệu)", data: { store } },
    });
    return res.json({ success: true });
  } catch (err) {
    console.error("saveMyCalendar error:", err);
    return res.status(500).json({ success: false, message: "Lỗi lưu lịch cá nhân" });
  }
};


// ─── LỊCH CÔNG TÁC (dùng chung cho mọi nhân sự) ───
const WORK_KEY = "schedule_work_data";

// GET /api/work-calendar
export const getWorkCalendar = async (_req: Request, res: Response) => {
  try {
    const row = await prisma.siteContent.findUnique({ where: { key: WORK_KEY } });
    const data = (row?.data as any) || {};
    return res.json({ success: true, data: { store: data.store || {} } });
  } catch (err) {
    console.error("getWorkCalendar error:", err);
    return res.status(500).json({ success: false, message: "Lỗi tải lịch công tác" });
  }
};

// PUT /api/work-calendar
export const saveWorkCalendar = async (req: Request, res: Response) => {
  try {
    const store = (req.body && req.body.store) || {};
    await prisma.siteContent.upsert({
      where: { key: WORK_KEY },
      update: { data: { store }, label: "Lịch công tác (dữ liệu)" },
      create: { key: WORK_KEY, label: "Lịch công tác (dữ liệu)", data: { store } },
    });
    return res.json({ success: true });
  } catch (err) {
    console.error("saveWorkCalendar error:", err);
    return res.status(500).json({ success: false, message: "Lỗi lưu lịch công tác" });
  }
};
