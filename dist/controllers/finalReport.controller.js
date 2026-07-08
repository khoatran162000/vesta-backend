"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFinalReport = exports.updateFinalReport = exports.createFinalReport = exports.getFinalReport = exports.getMyFinalReports = exports.listFinalReports = exports.getShareReport = void 0;
const client_1 = require("@prisma/client");
const crypto_1 = __importDefault(require("crypto"));
const prisma = new client_1.PrismaClient();
function uid(req) {
    return req.user?.userId || "";
}
function role(req) {
    return req.user?.role;
}
function isStaff(req) {
    const r = role(req);
    return r === "ADMIN" || r === "TEACHER";
}
// Token ngẫu nhiên 32 ký tự hex cho link chia sẻ
function genToken() {
    return crypto_1.default.randomBytes(16).toString("hex");
}
// Dựng URL chia sẻ công khai.
// Ưu tiên PUBLIC_API_URL (nếu set) → sau đó suy từ request (proto + host).
function shareUrlFor(req, token) {
    const env = process.env.PUBLIC_API_URL;
    let base;
    if (env) {
        base = env.replace(/\/$/, "");
    }
    else {
        // proto: header proxy (nginx) trước, không có thì lấy req.protocol (đúng http ở local)
        const xfProto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
        const proto = xfProto || req.protocol || "http";
        const host = String(req.headers["x-forwarded-host"] || req.get("host") || "").trim();
        base = `${proto}://${host}/api`;
    }
    return `${base}/final-reports/share/${token}`;
}
// ─── PUBLIC: phục vụ HTML report qua token (link gửi phụ huynh, không cần đăng nhập) ───
const getShareReport = async (req, res) => {
    try {
        const token = String(req.params.token);
        const r = await prisma.finalReport.findUnique({ where: { shareToken: token } });
        res.set("Content-Type", "text/html; charset=utf-8");
        if (!r || r.status !== "PUBLISHED" || !r.html) {
            return res
                .status(404)
                .send("<!doctype html><html lang='vi'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Không tìm thấy báo cáo</title></head><body style='font-family:system-ui,sans-serif;padding:48px;text-align:center;color:#334155'><h2>Không tìm thấy báo cáo</h2><p>Link không hợp lệ hoặc báo cáo chưa được công bố.</p></body></html>");
        }
        return res.send(r.html);
    }
    catch (error) {
        return res.status(500).set("Content-Type", "text/html; charset=utf-8").send("<h2>Lỗi tải báo cáo</h2>");
    }
};
exports.getShareReport = getShareReport;
// ─── List (staff): lọc theo HS hoặc lớp ───
const listFinalReports = async (req, res) => {
    try {
        const { studentId, course } = req.query;
        const where = {};
        if (studentId)
            where.studentId = String(studentId);
        if (course)
            where.course = String(course);
        const data = await prisma.finalReport.findMany({
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
        return res.status(500).json({ success: false, message: "Lỗi tải danh sách báo cáo cuối khóa" });
    }
};
exports.listFinalReports = listFinalReports;
// ─── Student: báo cáo PUBLISHED của mình ───
const getMyFinalReports = async (req, res) => {
    try {
        const studentId = uid(req);
        const data = await prisma.finalReport.findMany({
            where: { studentId, status: "PUBLISHED" },
            orderBy: { createdAt: "desc" },
            select: { id: true, course: true, createdAt: true, status: true },
        });
        return res.json({ success: true, data });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Lỗi tải báo cáo" });
    }
};
exports.getMyFinalReports = getMyFinalReports;
// ─── Detail (staff xem mọi; student chỉ của mình + PUBLISHED) ───
const getFinalReport = async (req, res) => {
    try {
        const id = String(req.params.id);
        const report = await prisma.finalReport.findUnique({
            where: { id },
            include: {
                student: { select: { id: true, fullName: true, studentCode: true, course: true } },
                creator: { select: { fullName: true } },
            },
        });
        if (!report)
            return res.status(404).json({ success: false, message: "Không tìm thấy báo cáo" });
        if (!isStaff(req)) {
            if (report.studentId !== uid(req) || report.status !== "PUBLISHED") {
                return res.status(403).json({ success: false, message: "Bạn không có quyền xem báo cáo này" });
            }
        }
        const shareUrl = report.html && report.shareToken ? shareUrlFor(req, report.shareToken) : null;
        return res.json({ success: true, data: { ...report, shareUrl } });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Lỗi tải báo cáo" });
    }
};
exports.getFinalReport = getFinalReport;
// ─── Create (staff) ───
const createFinalReport = async (req, res) => {
    try {
        const userId = uid(req);
        const { studentId, course, learnclickUser, skillGrid, review, prediction, orientation, html, status } = req.body;
        if (!studentId)
            return res.status(400).json({ success: false, message: "Thiếu học sinh" });
        const hasHtml = typeof html === "string" && html.trim().length > 0;
        if (!hasHtml && !skillGrid) {
            return res.status(400).json({ success: false, message: "Cần dán HTML hoặc nhập bảng kỹ năng" });
        }
        const report = await prisma.finalReport.create({
            data: {
                studentId,
                course: course ?? null,
                learnclickUser: learnclickUser ?? null,
                skillGrid: (skillGrid ?? null),
                review: (review ?? null),
                prediction: (prediction ?? null),
                orientation: (orientation ?? null),
                html: hasHtml ? html : null,
                shareToken: genToken(),
                status: status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
                createdBy: userId,
            },
        });
        const shareUrl = report.html && report.shareToken ? shareUrlFor(req, report.shareToken) : null;
        return res.status(201).json({ success: true, data: { ...report, shareUrl } });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Lỗi tạo báo cáo cuối khóa" });
    }
};
exports.createFinalReport = createFinalReport;
// ─── Update (staff) ───
const updateFinalReport = async (req, res) => {
    try {
        const id = String(req.params.id);
        const { course, learnclickUser, skillGrid, review, prediction, orientation, html, status } = req.body;
        const data = {};
        if (course !== undefined)
            data.course = course;
        if (learnclickUser !== undefined)
            data.learnclickUser = learnclickUser;
        if (skillGrid !== undefined)
            data.skillGrid = skillGrid;
        if (review !== undefined)
            data.review = review;
        if (prediction !== undefined)
            data.prediction = prediction;
        if (orientation !== undefined)
            data.orientation = orientation;
        if (html !== undefined)
            data.html = html;
        if (status !== undefined)
            data.status = status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
        // Backfill token cho report cũ tạo trước khi có tính năng chia sẻ
        const existing = await prisma.finalReport.findUnique({ where: { id }, select: { shareToken: true } });
        if (existing && !existing.shareToken)
            data.shareToken = genToken();
        const report = await prisma.finalReport.update({ where: { id }, data });
        const shareUrl = report.html && report.shareToken ? shareUrlFor(req, report.shareToken) : null;
        return res.json({ success: true, data: { ...report, shareUrl } });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Lỗi cập nhật báo cáo" });
    }
};
exports.updateFinalReport = updateFinalReport;
// ─── Delete (staff) ───
const deleteFinalReport = async (req, res) => {
    try {
        const id = String(req.params.id);
        await prisma.finalReport.delete({ where: { id } });
        return res.json({ success: true, message: "Đã xoá báo cáo" });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Lỗi xoá báo cáo" });
    }
};
exports.deleteFinalReport = deleteFinalReport;
//# sourceMappingURL=finalReport.controller.js.map