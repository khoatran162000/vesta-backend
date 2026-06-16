// FILE: src/controllers/report.controller.ts — Báo cáo định kỳ hàng tuần
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
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

// ─── List: staff xem theo HS; student không dùng route này ───
export const listReports = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.query;
    const where: any = {};
    if (studentId) where.studentId = String(studentId);
    const data = await prisma.weeklyReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        student: { select: { id: true, fullName: true, studentCode: true, course: true } },
        creator: { select: { fullName: true } },
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

// ─── Detail: staff xem mọi báo cáo; student chỉ xem báo cáo của mình + PUBLISHED ───
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
      // student: phải là chủ + đã publish
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
export const createReport = async (req: Request, res: Response) => {
  try {
    const userId = uid(req);
    const {
      studentId, course, learnclickUser, padletAccount,
      periodTo, dataFrom, dataTo, grid, teacherNote, status,
    } = req.body;

    if (!studentId) return res.status(400).json({ success: false, message: "Thiếu học sinh" });
    if (!grid) return res.status(400).json({ success: false, message: "Thiếu dữ liệu bảng điểm" });

    const report = await prisma.weeklyReport.create({
      data: {
        studentId,
        course: course ?? null,
        learnclickUser: learnclickUser ?? null,
        padletAccount: padletAccount ?? null,
        periodTo: periodTo ? new Date(periodTo) : null,
        dataFrom: dataFrom ? new Date(dataFrom) : null,
        dataTo: dataTo ? new Date(dataTo) : null,
        grid: grid as any,
        teacherNote: (teacherNote ?? null) as any,
        status: status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
        createdBy: userId!,
      },
    });
    return res.status(201).json({ success: true, data: report });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi tạo báo cáo" });
  }
};

// ─── Update (staff) ───
export const updateReport = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const {
      course, learnclickUser, padletAccount,
      periodTo, dataFrom, dataTo, grid, teacherNote, status,
    } = req.body;

    const data: any = {};
    if (course !== undefined) data.course = course;
    if (learnclickUser !== undefined) data.learnclickUser = learnclickUser;
    if (padletAccount !== undefined) data.padletAccount = padletAccount;
    if (periodTo !== undefined) data.periodTo = periodTo ? new Date(periodTo) : null;
    if (dataFrom !== undefined) data.dataFrom = dataFrom ? new Date(dataFrom) : null;
    if (dataTo !== undefined) data.dataTo = dataTo ? new Date(dataTo) : null;
    if (grid !== undefined) data.grid = grid as any;
    if (teacherNote !== undefined) data.teacherNote = teacherNote as any;
    if (status !== undefined) data.status = status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";

    const report = await prisma.weeklyReport.update({ where: { id }, data });
    return res.json({ success: true, data: report });
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