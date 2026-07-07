// FILE: src/controllers/finalReport.controller.ts — Báo cáo cuối khóa (form + HTML dán + link chia sẻ)
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
const prisma = new PrismaClient();

function uid(req: Request): string {
  return (req as any).user?.userId || "";
}
function role(req: Request): string | undefined {
  return (req as any).user?.role;
}
function isStaff(req: Request): boolean {
  const r = role(req);
  return r === "ADMIN" || r === "TEACHER";
}
// Token ngẫu nhiên 32 ký tự hex cho link chia sẻ
function genToken(): string {
  return crypto.randomBytes(16).toString("hex");
}
// Dựng URL chia sẻ công khai. Ưu tiên env PUBLIC_API_URL nếu có (vd: https://api.vestaedu.online/api),
// nếu không thì suy ra từ header proxy (nginx) — thường ra đúng https://api.vestaedu.online/api
function shareUrlFor(req: Request, token: string): string {
  const env = process.env.PUBLIC_API_URL;
  const base = env
    ? env.replace(/\/$/, "")
    : `${String(req.headers["x-forwarded-proto"] || "https").split(",")[0].trim()}://${String(
        req.headers["x-forwarded-host"] || req.get("host") || ""
      ).trim()}/api`;
  return `${base}/final-reports/share/${token}`;
}

// ─── PUBLIC: phục vụ HTML report qua token (link gửi phụ huynh, không cần đăng nhập) ───
export const getShareReport = async (req: Request, res: Response) => {
  try {
    const token = String(req.params.token);
    const r = await prisma.finalReport.findUnique({ where: { shareToken: token } });
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

// ─── List (staff): lọc theo HS hoặc lớp ───
export const listFinalReports = async (req: Request, res: Response) => {
  try {
    const { studentId, course } = req.query;
    const where: any = {};
    if (studentId) where.studentId = String(studentId);
    if (course) where.course = String(course);
    const data = await prisma.finalReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        student: { select: { id: true, fullName: true, studentCode: true, course: true } },
        creator: { select: { fullName: true } },
      },
    });
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi tải danh sách báo cáo cuối khóa" });
  }
};

// ─── Student: báo cáo PUBLISHED của mình ───
export const getMyFinalReports = async (req: Request, res: Response) => {
  try {
    const studentId = uid(req);
    const data = await prisma.finalReport.findMany({
      where: { studentId, status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      select: { id: true, course: true, createdAt: true, status: true },
    });
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi tải báo cáo" });
  }
};

// ─── Detail (staff xem mọi; student chỉ của mình + PUBLISHED) ───
export const getFinalReport = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const report = await prisma.finalReport.findUnique({
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

// ─── Create (staff) ───
export const createFinalReport = async (req: Request, res: Response) => {
  try {
    const userId = uid(req);
    const { studentId, course, learnclickUser, skillGrid, review, prediction, orientation, html, status } = req.body;
    if (!studentId) return res.status(400).json({ success: false, message: "Thiếu học sinh" });
    const hasHtml = typeof html === "string" && html.trim().length > 0;
    if (!hasHtml && !skillGrid) {
      return res.status(400).json({ success: false, message: "Cần dán HTML hoặc nhập bảng kỹ năng" });
    }
    const report = await prisma.finalReport.create({
      data: {
        studentId,
        course: course ?? null,
        learnclickUser: learnclickUser ?? null,
        skillGrid: (skillGrid ?? null) as any,
        review: (review ?? null) as any,
        prediction: (prediction ?? null) as any,
        orientation: (orientation ?? null) as any,
        html: hasHtml ? html : null,
        shareToken: genToken(),
        status: status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
        createdBy: userId,
      },
    });
    const shareUrl = report.html && report.shareToken ? shareUrlFor(req, report.shareToken) : null;
    return res.status(201).json({ success: true, data: { ...report, shareUrl } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi tạo báo cáo cuối khóa" });
  }
};

// ─── Update (staff) ───
export const updateFinalReport = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { course, learnclickUser, skillGrid, review, prediction, orientation, html, status } = req.body;
    const data: any = {};
    if (course !== undefined) data.course = course;
    if (learnclickUser !== undefined) data.learnclickUser = learnclickUser;
    if (skillGrid !== undefined) data.skillGrid = skillGrid as any;
    if (review !== undefined) data.review = review as any;
    if (prediction !== undefined) data.prediction = prediction as any;
    if (orientation !== undefined) data.orientation = orientation as any;
    if (html !== undefined) data.html = html;
    if (status !== undefined) data.status = status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
    // Backfill token cho report cũ tạo trước khi có tính năng chia sẻ
    const existing = await prisma.finalReport.findUnique({ where: { id }, select: { shareToken: true } });
    if (existing && !existing.shareToken) data.shareToken = genToken();
    const report = await prisma.finalReport.update({ where: { id }, data });
    const shareUrl = report.html && report.shareToken ? shareUrlFor(req, report.shareToken) : null;
    return res.json({ success: true, data: { ...report, shareUrl } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi cập nhật báo cáo" });
  }
};

// ─── Delete (staff) ───
export const deleteFinalReport = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    await prisma.finalReport.delete({ where: { id } });
    return res.json({ success: true, message: "Đã xoá báo cáo" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi xoá báo cáo" });
  }
};