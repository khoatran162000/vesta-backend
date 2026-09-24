// FILE: src/controllers/summary.controller.ts — Tóm tắt hoạt động làm bài theo ngày
import { Request, Response } from "express";
import * as api from "../utils/apiResponse";
import { buildDailySummary, vnToday } from "../lib/dailySummary";

// GET /api/notifications/admin/daily-summary?date=YYYY-MM-DD
export async function getDailySummary(req: Request, res: Response) {
  try {
    let date = (req.query.date as string) || vnToday();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) date = vnToday();
    const data = await buildDailySummary(date);
    return api.success(res, data);
  } catch (err) {
    console.error("[daily-summary]", err);
    return api.error(res, "Lỗi server", 500);
  }
}
