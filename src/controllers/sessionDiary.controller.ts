// FILE: src/controllers/sessionDiary.controller.ts — Nhật ký buổi học theo lớp (tự đổ từ điểm danh)
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function uid(req: Request): string {
  return (req as any).user?.userId || "";
}

// "2026-07-25" → Date 00:00 UTC (khớp Attendance)
function toSessionDate(v: any): Date | null {
  const s = String(v || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00.000Z`);
  return isNaN(d.getTime()) ? null : d;
}

// Đổ khung nhật ký từ điểm danh của buổi: [{ name, score, comment }]
async function studentsFromAttendance(classId: string, sessionDate: Date) {
  const enrollments = await prisma.classEnrollment.findMany({
    where: { classId },
    include: { student: { select: { id: true, fullName: true } } },
    orderBy: { joinedAt: "asc" },
  });
  const records = await prisma.attendance.findMany({ where: { classId, sessionDate } });
  const byStudent = new Map(records.map((r) => [r.studentId, r]));
  return enrollments.map((e) => {
    const att = byStudent.get(e.student.id);
    return {
      name: e.student.fullName,
      score: att?.score != null ? String(att.score) : "",
      comment: att?.note || "",
    };
  });
}

// GET /api/session-diary?classId=...&date=YYYY-MM-DD
// Có nhật ký → trả nhật ký. Chưa có → trả khung tự đổ từ điểm danh (chưa lưu).
export const getSessionDiary = async (req: Request, res: Response) => {
  try {
    const classId = String(req.query.classId || "");
    const sessionDate = toSessionDate(req.query.date);
    if (!classId) return res.status(400).json({ success: false, message: "Thiếu lớp" });
    if (!sessionDate) return res.status(400).json({ success: false, message: "Ngày không hợp lệ (YYYY-MM-DD)" });

    const cls = await prisma.class.findUnique({
      where: { id: classId },
      select: { name: true, course: true, teacher: true },
    });
    if (!cls) return res.status(404).json({ success: false, message: "Lớp không tồn tại" });

    const existing = await prisma.sessionDiary.findUnique({
      where: { classId_sessionDate: { classId, sessionDate } },
    });

    if (existing) {
      // Đã lưu → merge students đã lưu với điểm danh mới nhất (điểm danh là nguồn gợi ý,
      // nhưng ưu tiên giữ nội dung GV đã chỉnh trong nhật ký)
      return res.json({
        success: true,
        data: { ...existing, className: cls.name, course: cls.course, defaultTeacher: cls.teacher },
        exists: true,
      });
    }

    // Chưa có → khung mới, tự đổ HS từ điểm danh
    const students = await studentsFromAttendance(classId, sessionDate);
    return res.json({
      success: true,
      data: {
        classId,
        sessionDate,
        sessionNumber: null,
        programKey: null,
        currentLesson: null,
        teacherName: cls.teacher || "",
        assistantName: "",
        content: "",
        homework: "",
        students,
        logoUrl: null,
        imageUrl: null,
        className: cls.name,
        course: cls.course,
        defaultTeacher: cls.teacher,
      },
      exists: false,
    });
  } catch (err) {
    console.error("Get session diary error:", err);
    return res.status(500).json({ success: false, message: "Lỗi tải nhật ký" });
  }
};

// POST /api/session-diary — lưu (upsert theo classId + ngày)
export const saveSessionDiary = async (req: Request, res: Response) => {
  try {
    const { classId, date, sessionNumber, programKey, currentLesson, teacherName, assistantName, content, homework, students, logoUrl, imageUrl } = req.body;
    const sessionDate = toSessionDate(date);
    if (!classId) return res.status(400).json({ success: false, message: "Thiếu lớp" });
    if (!sessionDate) return res.status(400).json({ success: false, message: "Ngày không hợp lệ" });

    const data = {
      sessionNumber: sessionNumber != null && sessionNumber !== "" ? Number(sessionNumber) : null,
      programKey: programKey || null,
      currentLesson: currentLesson != null && currentLesson !== "" ? Number(currentLesson) : null,
      teacherName: teacherName || null,
      assistantName: assistantName || null,
      content: content || null,
      homework: homework || null,
      students: Array.isArray(students) ? students : [],
      logoUrl: logoUrl || null,
      imageUrl: imageUrl || null,
    };

    const saved = await prisma.sessionDiary.upsert({
      where: { classId_sessionDate: { classId, sessionDate } },
      update: data,
      create: { classId, sessionDate, createdBy: uid(req) || null, ...data },
    });
    return res.json({ success: true, data: saved, message: "Đã lưu nhật ký buổi học" });
  } catch (err) {
    console.error("Save session diary error:", err);
    return res.status(500).json({ success: false, message: "Lỗi lưu nhật ký" });
  }
};

// GET /api/session-diary/list?classId=... — các buổi đã ghi nhật ký
export const listSessionDiaries = async (req: Request, res: Response) => {
  try {
    const classId = String(req.query.classId || "");
    if (!classId) return res.status(400).json({ success: false, message: "Thiếu lớp" });
    const rows = await prisma.sessionDiary.findMany({
      where: { classId },
      orderBy: { sessionDate: "desc" },
      select: { id: true, sessionDate: true, sessionNumber: true, content: true, updatedAt: true },
    });
    return res.json({ success: true, data: rows });
  } catch {
    return res.status(500).json({ success: false, message: "Lỗi tải danh sách nhật ký" });
  }
};

// DELETE /api/session-diary/:id
export const deleteSessionDiary = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const existing = await prisma.sessionDiary.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: "Không tìm thấy" });
    await prisma.sessionDiary.delete({ where: { id } });
    return res.json({ success: true, message: "Đã xoá nhật ký" });
  } catch {
    return res.status(500).json({ success: false, message: "Lỗi xoá" });
  }
};