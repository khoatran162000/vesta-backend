// FILE: src/controllers/report.controller.ts — Báo cáo định kỳ hàng tuần (form + HTML dán + link chia sẻ)
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
const prisma = new PrismaClient();

function uid(req: Request): string | undefined {
  return (req as any).user?.userId;
}
function role(req: Request): string | undefined {
  return (req as any).user?.role;
}
function isStaff(req: Request): boolean {
  const r = role(req);
  return r === "ADMIN" || r === "TEACHER";
}
function genToken(): string {
  return crypto.randomBytes(16).toString("hex");
}
// Dựng URL chia sẻ công khai. Ưu tiên PUBLIC_API_URL, sau đó suy từ request.
function shareUrlFor(req: Request, token: string): string {
  const env = process.env.PUBLIC_API_URL;
  let base: string;
  if (env) {
    base = env.replace(/\/$/, "");
  } else {
    const xfProto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
    const proto = xfProto || req.protocol || "http";
    const host = String(req.headers["x-forwarded-host"] || req.get("host") || "").trim();
    base = `${proto}://${host}/api`;
  }
  return `${base}/reports/share/${token}`;
}

// POST /api/reports/upload-image — upload 1 ảnh báo cáo, trả URL
export const uploadReportImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Không có ảnh nào được upload" });
    return res.json({ success: true, data: { url: `/uploads/reports/${req.file.filename}` } });
  } catch {
    return res.status(500).json({ success: false, message: "Lỗi upload ảnh" });
  }
};

// ─── PUBLIC: phục vụ HTML report qua token (link gửi phụ huynh) ───
export const getShareReport = async (req: Request, res: Response) => {
  try {
    const token = String(req.params.token);
    const r = await prisma.weeklyReport.findUnique({ where: { shareToken: token } });
    res.set("Content-Type", "text/html; charset=utf-8");
    if (!r || r.status !== "PUBLISHED" || !r.html) {
      return res
        .status(404)
        .send(
          "<!doctype html><html lang='vi'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Không tìm thấy báo cáo</title></head><body style='font-family:system-ui,sans-serif;padding:48px;text-align:center;color:#334155'><h2>Không tìm thấy báo cáo</h2><p>Link không hợp lệ hoặc báo cáo chưa được công bố.</p></body></html>"
        );
    }
    return res.send(r.html);
  } catch (error) {
    return res.status(500).set("Content-Type", "text/html; charset=utf-8").send("<h2>Lỗi tải báo cáo</h2>");
  }
};

// ─── List (staff) ───
export const listReports = async (req: Request, res: Response) => {
  try {
    const { studentId, classId, course } = req.query;
    const where: any = {};
    if (studentId) where.studentId = String(studentId);
    if (classId) where.classId = String(classId);
    if (course) where.course = String(course);
    const data = await prisma.weeklyReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        student: { select: { id: true, fullName: true, studentCode: true, course: true } },
        creator: { select: { fullName: true } },
        class: { select: { id: true, name: true } },
      },
    });
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi tải danh sách báo cáo" });
  }
};

// ─── Student: báo cáo PUBLISHED của chính mình ───
export const getMyReports = async (req: Request, res: Response) => {
  try {
    const studentId = uid(req);
    const data = await prisma.weeklyReport.findMany({
      where: { studentId, status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, course: true, periodTo: true, dataFrom: true, dataTo: true,
        status: true, createdAt: true,
      },
    });
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi tải báo cáo" });
  }
};

// ─── Detail (staff xem mọi; student chỉ của mình + PUBLISHED) ───
export const getReport = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const report = await prisma.weeklyReport.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, fullName: true, studentCode: true, course: true } },
        creator: { select: { fullName: true } },
      },
    });
    if (!report) return res.status(404).json({ success: false, message: "Không tìm thấy báo cáo" });
    if (!isStaff(req)) {
      if (report.studentId !== uid(req) || report.status !== "PUBLISHED") {
        return res.status(403).json({ success: false, message: "Bạn không có quyền xem báo cáo này" });
      }
    }
    const shareUrl = report.html && report.shareToken ? shareUrlFor(req, report.shareToken) : null;
    return res.json({ success: true, data: { ...report, shareUrl } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi tải báo cáo" });
  }
};

// Đẩy thông báo cho HS khi báo cáo được công bố (PUBLISHED)
async function notifyReportPublished(studentId: string, reportId: string, course: string | null) {
  try {
    await prisma.notification.create({
      data: {
        userId: studentId,
        title: "Báo cáo tuần mới",
        message: `Giáo viên đã gửi báo cáo tiến độ${course ? ` lớp ${course}` : ""}. Bấm để xem chi tiết.`,
        type: "SYSTEM_AUTO",
        link: `/bao-cao/${reportId}`,
      },
    });
  } catch (e) {
    console.error("notifyReportPublished error:", e);
  }
}

// ─── Create (staff) ───
export const createReport = async (req: Request, res: Response) => {
  try {
    const userId = uid(req);
    const {
      studentId, course, learnclickUser, padletAccount,
      periodTo, dataFrom, dataTo, grid, teacherNote, html, imageUrl, classId, status,
    } = req.body;
    if (!studentId) return res.status(400).json({ success: false, message: "Thiếu học sinh" });
    const hasHtml = typeof html === "string" && html.trim().length > 0;
    const hasImage = typeof imageUrl === "string" && imageUrl.trim().length > 0;
    if (!hasHtml && !hasImage && !grid) {
      return res.status(400).json({ success: false, message: "Cần dán HTML, up ảnh hoặc nhập bảng điểm" });
    }
    const report = await prisma.weeklyReport.create({
      data: {
        studentId,
        classId: classId || null,
        course: course ?? null,
        learnclickUser: learnclickUser ?? null,
        padletAccount: padletAccount ?? null,
        periodTo: periodTo ? new Date(periodTo) : null,
        dataFrom: dataFrom ? new Date(dataFrom) : null,
        dataTo: dataTo ? new Date(dataTo) : null,
        grid: (grid ?? null) as any,
        teacherNote: (teacherNote ?? null) as any,
        html: hasHtml ? html : null,
        imageUrl: hasImage ? imageUrl : null,
        shareToken: genToken(),
        status: status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
        createdBy: userId!,
      },
    });
    if (report.status === "PUBLISHED") {
      await notifyReportPublished(report.studentId, report.id, report.course ?? null);
    }
    const shareUrl = report.html && report.shareToken ? shareUrlFor(req, report.shareToken) : null;
    return res.status(201).json({ success: true, data: { ...report, shareUrl } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi tạo báo cáo" });
  }
};

// ─── Update (staff) ───
export const updateReport = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const {
      studentId, course, learnclickUser, padletAccount,
      periodTo, dataFrom, dataTo, grid, teacherNote, html, imageUrl, classId, status,
    } = req.body;
    const data: any = {};
    if (classId !== undefined) data.classId = classId || null;
    if (course !== undefined) data.course = course;
    if (learnclickUser !== undefined) data.learnclickUser = learnclickUser;
    if (padletAccount !== undefined) data.padletAccount = padletAccount;
    if (periodTo !== undefined) data.periodTo = periodTo ? new Date(periodTo) : null;
    if (dataFrom !== undefined) data.dataFrom = dataFrom ? new Date(dataFrom) : null;
    if (dataTo !== undefined) data.dataTo = dataTo ? new Date(dataTo) : null;
    if (grid !== undefined) data.grid = grid as any;
    if (teacherNote !== undefined) data.teacherNote = teacherNote as any;
    if (html !== undefined) data.html = html;
    if (imageUrl !== undefined) data.imageUrl = imageUrl;
    if (status !== undefined) data.status = status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
    const existing = await prisma.weeklyReport.findUnique({
      where: { id },
      select: { shareToken: true, status: true },
    });
    if (existing && !existing.shareToken) data.shareToken = genToken();
    const report = await prisma.weeklyReport.update({ where: { id }, data });
    if (report.status === "PUBLISHED" && existing?.status !== "PUBLISHED") {
      await notifyReportPublished(report.studentId, report.id, report.course ?? null);
    }
    const shareUrl = report.html && report.shareToken ? shareUrlFor(req, report.shareToken) : null;
    return res.json({ success: true, data: { ...report, shareUrl } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi cập nhật báo cáo" });
  }
};

// ─── Delete (staff) ───
export const deleteReport = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    await prisma.weeklyReport.delete({ where: { id } });
    return res.json({ success: true, message: "Đã xoá báo cáo" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi xoá báo cáo" });
  }
};