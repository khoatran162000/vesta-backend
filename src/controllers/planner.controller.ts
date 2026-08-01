// FILE: src/controllers/planner.controller.ts — Lịch công tác nội bộ (TKB tuần + nhiệm vụ)
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Khung giờ (khớp frontend). Dùng để kiểm tra trùng giờ.
const SLOT_TIMES: Record<string, [number, number]> = {
  morning: [8 * 60, 10 * 60], morning9: [9 * 60, 11 * 60], morning2: [10 * 60, 12 * 60],
  afternoon: [13 * 60, 15 * 60], afternoon2: [15 * 60, 17 * 60], evening17: [17 * 60, 19 * 60],
  early: [18 * 60, 20 * 60], evening19: [19 * 60, 21 * 60], late: [20 * 60, 22 * 60],
};
const DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
const overlaps = (a: string, b: string) => {
  const x = SLOT_TIMES[a], y = SLOT_TIMES[b];
  return Boolean(x && y && x[0] < y[1] && y[0] < x[1]);
};
function parseTags(value: unknown): string[] {
  if (Array.isArray(value)) return [...new Set(value.map(String).map((x) => x.trim()).filter(Boolean))];
  if (typeof value !== "string" || !value) return [];
  try { return parseTags(JSON.parse(value)); } catch { return value.split(",").map((x) => x.trim()).filter(Boolean); }
}
const tagsJson = (value: unknown) => JSON.stringify(parseTags(value));
const rowPeople = (row: { teacher: string; assistant: string; tags: string }) =>
  new Set([row.teacher, row.assistant, ...parseTags(row.tags)].map((x) => x.trim()).filter(Boolean));

// GET /api/planner?week=YYYY-MM-DD  — mọi tài khoản đăng nhập đều xem
export const getPlanner = async (req: Request, res: Response) => {
  try {
    const week = String(req.query.week || "");
    if (!week) return res.status(400).json({ success: false, message: "Thiếu tuần" });
    const [schedule, tasks] = await Promise.all([
      prisma.scheduleEntry.findMany({ where: { weekStart: week }, orderBy: { createdAt: "asc" } }),
      prisma.weeklyTask.findMany({ where: { weekStart: week }, orderBy: { deadline: "asc" } }),
    ]);
    return res.json({ success: true, data: { schedule, tasks } });
  } catch (err) {
    console.error("Get planner error:", err);
    return res.status(500).json({ success: false, message: "Lỗi tải lịch" });
  }
};

// POST /api/planner  — ADMIN. body.type = "schedule" | "task"
export const createPlanner = async (req: Request, res: Response) => {
  try {
    const b = req.body;
    if (b.type === "schedule") {
      const base = {
        weekStart: String(b.weekStart), slot: String(b.slot), room: String(b.room),
        className: String(b.className || "").trim(), teacher: String(b.teacher || "").trim(),
        assistant: String(b.assistant || "").trim(), tags: tagsJson(b.tags), note: String(b.note || "").trim(),
      };
      const dayIndices = ([...new Set((Array.isArray(b.dayIndices) ? b.dayIndices : [b.dayIndex]).map(Number))] as number[])
        .filter((x) => Number.isInteger(x) && x >= 0 && x <= 6);
      if (!base.className || !base.teacher || !dayIndices.length)
        return res.status(400).json({ success: false, message: "Điền đủ lớp, giáo viên và ngày học" });
      const wanted = rowPeople(base);
      // kiểm tra trùng phòng / trùng nhân sự từng ngày
      for (const dayIndex of dayIndices) {
        const rows = await prisma.scheduleEntry.findMany({ where: { weekStart: base.weekStart, dayIndex } });
        const c = rows.find((x) => overlaps(x.slot, base.slot) && (x.room === base.room || [...rowPeople(x)].some((n) => wanted.has(n))));
        if (c) return res.status(409).json({ success: false, message: `${DAYS[dayIndex]} bị trùng ${c.room === base.room ? "phòng" : "nhân sự"} với lớp ${c.className}` });
      }
      const created = [];
      for (const dayIndex of dayIndices) {
        const x = await prisma.scheduleEntry.create({ data: { ...base, dayIndex } });
        created.push(x);
      }
      return res.status(201).json({ success: true, data: created });
    }
    // task
    const v = {
      weekStart: String(b.weekStart), title: String(b.title || "").trim(), owner: String(b.owner || "").trim(),
      tags: tagsJson(b.tags), deadline: String(b.deadline || ""), note: String(b.note || "").trim(), completed: false,
    };
    if (!v.title || !v.owner || !v.deadline)
      return res.status(400).json({ success: false, message: "Điền đủ nhiệm vụ, người phụ trách và deadline" });
    const x = await prisma.weeklyTask.create({ data: v });
    return res.status(201).json({ success: true, data: x });
  } catch (err) {
    console.error("Create planner error:", err);
    return res.status(500).json({ success: false, message: "Lỗi lưu" });
  }
};

// PATCH /api/planner  — ADMIN
export const updatePlanner = async (req: Request, res: Response) => {
  try {
    const b = req.body, id = String(b.id || "");
    if (!id) return res.status(400).json({ success: false, message: "Thiếu id" });
    if (b.type === "schedule") {
      const v = {
        dayIndex: Number(b.dayIndex), slot: String(b.slot), room: String(b.room),
        className: String(b.className || "").trim(), teacher: String(b.teacher || "").trim(),
        assistant: String(b.assistant || "").trim(), tags: tagsJson(b.tags), note: String(b.note || "").trim(),
      };
      const rows = await prisma.scheduleEntry.findMany({ where: { weekStart: String(b.weekStart), dayIndex: v.dayIndex, id: { not: id } } });
      const wanted = rowPeople(v);
      const c = rows.find((x) => overlaps(x.slot, v.slot) && (x.room === v.room || [...rowPeople(x)].some((n) => wanted.has(n))));
      if (c) return res.status(409).json({ success: false, message: `Bị trùng ${c.room === v.room ? "phòng" : "nhân sự"} với lớp ${c.className}` });
      const x = await prisma.scheduleEntry.update({ where: { id }, data: v });
      return res.json({ success: true, data: x });
    }
    const x = await prisma.weeklyTask.update({
      where: { id },
      data: { title: String(b.title || "").trim(), owner: String(b.owner || "").trim(), tags: tagsJson(b.tags), deadline: String(b.deadline || ""), note: String(b.note || "").trim(), completed: Boolean(b.completed) },
    });
    return res.json({ success: true, data: x });
  } catch (err) {
    console.error("Update planner error:", err);
    return res.status(500).json({ success: false, message: "Lỗi cập nhật" });
  }
};

// DELETE /api/planner  — ADMIN. body { type, id }
export const deletePlanner = async (req: Request, res: Response) => {
  try {
    // nhận từ query (?type=&id=) hoặc body — linh hoạt
    const type = String(req.query.type || req.body?.type || "");
    const id = String(req.query.id || req.body?.id || "");
    if (!id) return res.status(400).json({ success: false, message: "Thiếu id" });
    if (type === "schedule") await prisma.scheduleEntry.delete({ where: { id } });
    else await prisma.weeklyTask.delete({ where: { id } });
    return res.json({ success: true, message: "Đã xoá" });
  } catch (err) {
    console.error("Delete planner error:", err);
    return res.status(500).json({ success: false, message: "Lỗi xoá" });
  }
};