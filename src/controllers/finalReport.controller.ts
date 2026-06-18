// FILE: src/controllers/finalReport.controller.ts — Báo cáo cuối khóa
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
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
    return res.json({ success: true, data: report });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi tải báo cáo" });
  }
};

// ─── Create (staff) ───
export const createFinalReport = async (req: Request, res: Response) => {
  try {
    const userId = uid(req);
    const { studentId, course, learnclickUser, skillGrid, review, prediction, orientation, status } = req.body;
    if (!studentId) return res.status(400).json({ success: false, message: "Thiếu học sinh" });
    if (!skillGrid) return res.status(400).json({ success: false, message: "Thiếu bảng kỹ năng" });

    const report = await prisma.finalReport.create({
      data: {
        studentId,
        course: course ?? null,
        learnclickUser: learnclickUser ?? null,
        skillGrid: skillGrid as any,
        review: (review ?? null) as any,
        prediction: (prediction ?? null) as any,
        orientation: (orientation ?? null) as any,
        status: status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
        createdBy: userId,
      },
    });
    return res.status(201).json({ success: true, data: report });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi tạo báo cáo cuối khóa" });
  }
};

// ─── Update (staff) ───
export const updateFinalReport = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { course, learnclickUser, skillGrid, review, prediction, orientation, status } = req.body;
    const data: any = {};
    if (course !== undefined) data.course = course;
    if (learnclickUser !== undefined) data.learnclickUser = learnclickUser;
    if (skillGrid !== undefined) data.skillGrid = skillGrid as any;
    if (review !== undefined) data.review = review as any;
    if (prediction !== undefined) data.prediction = prediction as any;
    if (orientation !== undefined) data.orientation = orientation as any;
    if (status !== undefined) data.status = status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";

    const report = await prisma.finalReport.update({ where: { id }, data });
    return res.json({ success: true, data: report });
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