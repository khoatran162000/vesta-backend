// FILE: src/controllers/attendance.controller.ts — Điểm danh buổi học theo lớp
import { Request, Response } from "express";
import prisma from "../config/database";

const uid = (req: Request) => (req as any).user?.userId as string | undefined;

// Chuẩn hoá "2026-07-24" → Date 00:00 UTC (để unique key ổn định, không lệch múi giờ)
function toSessionDate(v: any): Date | null {
  const s = String(v || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00.000Z`);
  return isNaN(d.getTime()) ? null : d;
}

// GET /api/attendance?classId=...&date=YYYY-MM-DD
// Trả danh sách HS của lớp + bản ghi điểm danh của ngày đó (HS chưa điểm danh → attendance = null)
export const getClassAttendance = async (req: Request, res: Response) => {
  try {
    const classId = String(req.query.classId || "");
    const sessionDate = toSessionDate(req.query.date);
    if (!classId) return res.status(400).json({ success: false, message: "Thiếu lớp" });
    if (!sessionDate) return res.status(400).json({ success: false, message: "Ngày không hợp lệ (YYYY-MM-DD)" });

    const enrollments = await prisma.classEnrollment.findMany({
      where: { classId },
      include: { student: { select: { id: true, fullName: true, studentCode: true } } },
      orderBy: { joinedAt: "asc" },
    });
    const records = await prisma.attendance.findMany({
      where: { classId, sessionDate },
    });
    const byStudent = new Map(records.map((r) => [r.studentId, r]));

    const rows = enrollments.map((e) => ({
      studentId: e.student.id,
      fullName: e.student.fullName,
      studentCode: e.student.studentCode,
      enrollStatus: e.status,
      attendance: byStudent.get(e.student.id) || null,
    }));
    return res.json({ success: true, data: rows });
  } catch {
    return res.status(500).json({ success: false, message: "Lỗi tải điểm danh" });
  }
};

// POST /api/attendance/mark  { classId, studentId, date, status?, score?, note? }
// Mỗi lần bấm → upsert + cập nhật markedAt = thời điểm bấm
export const markAttendance = async (req: Request, res: Response) => {
  try {
    const { classId, studentId, date, status, score, note } = req.body;
    const sessionDate = toSessionDate(date);
    if (!classId || !studentId) return res.status(400).json({ success: false, message: "Thiếu lớp hoặc học viên" });
    if (!sessionDate) return res.status(400).json({ success: false, message: "Ngày không hợp lệ" });

    const now = new Date();
    const numScore = score === "" || score === null || score === undefined ? null : Number(score);
    const data: any = { markedAt: now, markedBy: uid(req) || null };
    if (status !== undefined) data.status = String(status);
    if (score !== undefined) data.score = isNaN(numScore as number) ? null : numScore;
    if (note !== undefined) data.note = note || null;

    const saved = await prisma.attendance.upsert({
      where: { classId_studentId_sessionDate: { classId, studentId, sessionDate } },
      update: data,
      create: {
        classId, studentId, sessionDate,
        status: status !== undefined ? String(status) : "PRESENT",
        score: isNaN(numScore as number) ? null : numScore,
        note: note || null,
        markedAt: now,
        markedBy: uid(req) || null,
      },
    });
    return res.json({ success: true, data: saved });
  } catch {
    return res.status(500).json({ success: false, message: "Lỗi lưu điểm danh" });
  }
};

// POST /api/attendance/mark-all  { classId, date, status }
// Điểm danh nhanh cả lớp (vd "Tất cả có mặt")
export const markAllAttendance = async (req: Request, res: Response) => {
  try {
    const { classId, date, status } = req.body;
    const sessionDate = toSessionDate(date);
    if (!classId) return res.status(400).json({ success: false, message: "Thiếu lớp" });
    if (!sessionDate) return res.status(400).json({ success: false, message: "Ngày không hợp lệ" });

    const st = String(status || "PRESENT");
    const now = new Date();
    const marker = uid(req) || null;
    const enrollments = await prisma.classEnrollment.findMany({
      where: { classId },
      select: { studentId: true },
    });
    for (const e of enrollments) {
      await prisma.attendance.upsert({
        where: { classId_studentId_sessionDate: { classId, studentId: e.studentId, sessionDate } },
        update: { status: st, markedAt: now, markedBy: marker },
        create: { classId, studentId: e.studentId, sessionDate, status: st, markedAt: now, markedBy: marker },
      });
    }
    return res.json({ success: true, data: { count: enrollments.length } });
  } catch {
    return res.status(500).json({ success: false, message: "Lỗi điểm danh cả lớp" });
  }
};

// GET /api/attendance/sessions?classId=... — các ngày đã điểm danh (để GV xem lại)
export const listSessions = async (req: Request, res: Response) => {
  try {
    const classId = String(req.query.classId || "");
    if (!classId) return res.status(400).json({ success: false, message: "Thiếu lớp" });
    const rows = await prisma.attendance.findMany({
      where: { classId },
      select: { sessionDate: true, status: true },
      orderBy: { sessionDate: "desc" },
    });
    const map = new Map<string, { date: string; present: number; late: number; absent: number }>();
    for (const r of rows) {
      const key = r.sessionDate.toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, { date: key, present: 0, late: 0, absent: 0 });
      const m = map.get(key)!;
      if (r.status === "PRESENT") m.present++;
      else if (r.status === "LATE") m.late++;
      else m.absent++;
    }
    return res.json({ success: true, data: [...map.values()] });
  } catch {
    return res.status(500).json({ success: false, message: "Lỗi tải danh sách buổi" });
  }
};

// GET /api/attendance/my — HS xem lịch sử đi học của chính mình
export const getMyAttendance = async (req: Request, res: Response) => {
  try {
    const studentId = uid(req);
    if (!studentId) return res.status(401).json({ success: false, message: "Chưa đăng nhập" });
    const rows = await prisma.attendance.findMany({
      where: { studentId },
      include: { class: { select: { name: true, classCode: true, course: true } } },
      orderBy: { sessionDate: "desc" },
      take: 200,
    });
    const total = rows.length;
    const present = rows.filter((r) => r.status === "PRESENT").length;
    const late = rows.filter((r) => r.status === "LATE").length;
    const absent = total - present - late;
    return res.json({
      success: true,
      data: rows,
      stats: { total, present, late, absent, rate: total > 0 ? Math.round(((present + late) / total) * 100) : null },
    });
  } catch {
    return res.status(500).json({ success: false, message: "Lỗi tải lịch sử điểm danh" });
  }
};