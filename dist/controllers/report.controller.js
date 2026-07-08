"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReport = exports.updateReport = exports.createReport = exports.getReport = exports.getMyReports = exports.listReports = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function uid(req) {
    return req.user?.userId;
}
function role(req) {
    return req.user?.role;
}
function isStaff(req) {
    const r = role(req);
    return r === "ADMIN" || r === "TEACHER";
}
// ─── List: staff xem theo HS; student không dùng route này ───
const listReports = async (req, res) => {
    try {
        const { studentId } = req.query;
        const where = {};
        if (studentId)
            where.studentId = String(studentId);
        const data = await prisma.weeklyReport.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: {
                student: { select: { id: true, fullName: true, studentCode: true, course: true } },
                creator: { select: { fullName: true } },
            },
        });
        return res.json({ success: true, data });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Lỗi tải danh sách báo cáo" });
    }
};
exports.listReports = listReports;
// ─── Student: báo cáo PUBLISHED của chính mình ───
const getMyReports = async (req, res) => {
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
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Lỗi tải báo cáo" });
    }
};
exports.getMyReports = getMyReports;
// ─── Detail: staff xem mọi báo cáo; student chỉ xem báo cáo của mình + PUBLISHED ───
const getReport = async (req, res) => {
    try {
        const id = String(req.params.id);
        const report = await prisma.weeklyReport.findUnique({
            where: { id },
            include: {
                student: { select: { id: true, fullName: true, studentCode: true, course: true } },
                creator: { select: { fullName: true } },
            },
        });
        if (!report)
            return res.status(404).json({ success: false, message: "Không tìm thấy báo cáo" });
        if (!isStaff(req)) {
            // student: phải là chủ + đã publish
            if (report.studentId !== uid(req) || report.status !== "PUBLISHED") {
                return res.status(403).json({ success: false, message: "Bạn không có quyền xem báo cáo này" });
            }
        }
        return res.json({ success: true, data: report });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Lỗi tải báo cáo" });
    }
};
exports.getReport = getReport;
// ─── Create (staff) ───
const createReport = async (req, res) => {
    try {
        const userId = uid(req);
        const { studentId, course, learnclickUser, padletAccount, periodTo, dataFrom, dataTo, grid, teacherNote, status, } = req.body;
        if (!studentId)
            return res.status(400).json({ success: false, message: "Thiếu học sinh" });
        if (!grid)
            return res.status(400).json({ success: false, message: "Thiếu dữ liệu bảng điểm" });
        const report = await prisma.weeklyReport.create({
            data: {
                studentId,
                course: course ?? null,
                learnclickUser: learnclickUser ?? null,
                padletAccount: padletAccount ?? null,
                periodTo: periodTo ? new Date(periodTo) : null,
                dataFrom: dataFrom ? new Date(dataFrom) : null,
                dataTo: dataTo ? new Date(dataTo) : null,
                grid: grid,
                teacherNote: (teacherNote ?? null),
                status: status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
                createdBy: userId,
            },
        });
        return res.status(201).json({ success: true, data: report });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Lỗi tạo báo cáo" });
    }
};
exports.createReport = createReport;
// ─── Update (staff) ───
const updateReport = async (req, res) => {
    try {
        const id = String(req.params.id);
        const { course, learnclickUser, padletAccount, periodTo, dataFrom, dataTo, grid, teacherNote, status, } = req.body;
        const data = {};
        if (course !== undefined)
            data.course = course;
        if (learnclickUser !== undefined)
            data.learnclickUser = learnclickUser;
        if (padletAccount !== undefined)
            data.padletAccount = padletAccount;
        if (periodTo !== undefined)
            data.periodTo = periodTo ? new Date(periodTo) : null;
        if (dataFrom !== undefined)
            data.dataFrom = dataFrom ? new Date(dataFrom) : null;
        if (dataTo !== undefined)
            data.dataTo = dataTo ? new Date(dataTo) : null;
        if (grid !== undefined)
            data.grid = grid;
        if (teacherNote !== undefined)
            data.teacherNote = teacherNote;
        if (status !== undefined)
            data.status = status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
        const report = await prisma.weeklyReport.update({ where: { id }, data });
        return res.json({ success: true, data: report });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Lỗi cập nhật báo cáo" });
    }
};
exports.updateReport = updateReport;
// ─── Delete (staff) ───
const deleteReport = async (req, res) => {
    try {
        const id = String(req.params.id);
        await prisma.weeklyReport.delete({ where: { id } });
        return res.json({ success: true, message: "Đã xoá báo cáo" });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Lỗi xoá báo cáo" });
    }
};
exports.deleteReport = deleteReport;
//# sourceMappingURL=report.controller.js.map