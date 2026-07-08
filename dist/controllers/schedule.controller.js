"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudentReport = exports.deleteSchedule = exports.updateSchedule = exports.createSchedule = exports.getSchedule = exports.listSchedules = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// ─── List schedules (public — student/visitor xem được) ───
const listSchedules = async (req, res) => {
    try {
        const { course, status, year } = req.query;
        const where = {};
        if (course)
            where.course = course;
        if (status)
            where.status = status;
        if (year) {
            const yearNum = parseInt(year);
            where.startDate = { gte: new Date(`${yearNum}-01-01`), lt: new Date(`${yearNum + 1}-01-01`) };
        }
        const data = await prisma.classSchedule.findMany({
            where,
            orderBy: { startDate: "asc" },
        });
        return res.json({ success: true, data });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};
exports.listSchedules = listSchedules;
// ─── Detail ───
const getSchedule = async (req, res) => {
    try {
        const s = await prisma.classSchedule.findUnique({ where: { id: String(req.params.id) } });
        if (!s)
            return res.status(404).json({ success: false, message: "Không tìm thấy" });
        return res.json({ success: true, data: s });
    }
    catch {
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};
exports.getSchedule = getSchedule;
// ─── Create (Admin/Teacher) ───
const createSchedule = async (req, res) => {
    try {
        const userId = req.user?.userId || "";
        const { course, className, startDate, endDate, schedule, room, teacher, maxStudents, status, notes } = req.body;
        if (!course || !className || !startDate || !endDate || !schedule) {
            return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc" });
        }
        const s = await prisma.classSchedule.create({
            data: {
                course, className,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                schedule, room, teacher,
                maxStudents: maxStudents || 15,
                status: status || "UPCOMING",
                notes,
                createdBy: userId,
            },
        });
        return res.status(201).json({ success: true, data: s });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Lỗi tạo lịch" });
    }
};
exports.createSchedule = createSchedule;
// ─── Update ───
const updateSchedule = async (req, res) => {
    try {
        const data = { ...req.body };
        if (data.startDate)
            data.startDate = new Date(data.startDate);
        if (data.endDate)
            data.endDate = new Date(data.endDate);
        const s = await prisma.classSchedule.update({ where: { id: String(req.params.id) }, data });
        return res.json({ success: true, data: s });
    }
    catch {
        return res.status(500).json({ success: false, message: "Lỗi cập nhật" });
    }
};
exports.updateSchedule = updateSchedule;
// ─── Delete ───
const deleteSchedule = async (req, res) => {
    try {
        await prisma.classSchedule.delete({ where: { id: String(req.params.id) } });
        return res.json({ success: true, message: "Đã xoá" });
    }
    catch {
        return res.status(500).json({ success: false, message: "Lỗi xoá" });
    }
};
exports.deleteSchedule = deleteSchedule;
// ─── Tổng hợp kết quả học sinh (Report) ───
const getStudentReport = async (req, res) => {
    try {
        const { course, classId } = req.query;
        const where = { role: "STUDENT" };
        if (course)
            where.course = course;
        const students = await prisma.user.findMany({
            where,
            select: {
                id: true, fullName: true, studentCode: true, course: true, regStatus: true,
                examAttempts: {
                    where: { status: "SUBMITTED" },
                    select: { score: true, exam: { select: { title: true } } },
                },
                feedbacksReceived: {
                    select: { score: true, status: true },
                },
                interactiveAttempts: {
                    select: { score: true },
                },
            },
        });
        // Tính toán stats từng học viên
        const report = students.map((s) => {
            const examScores = s.examAttempts.map((a) => a.score || 0).filter((v) => v > 0);
            const feedbackScores = s.feedbacksReceived.filter((f) => f.status === "REVIEWED").map((f) => f.score || 0);
            const interactiveScores = s.interactiveAttempts.map((a) => a.score || 0);
            const avgExam = examScores.length > 0 ? Math.round(examScores.reduce((a, b) => a + b, 0) / examScores.length) : null;
            const avgFeedback = feedbackScores.length > 0 ? Math.round(feedbackScores.reduce((a, b) => a + b, 0) / feedbackScores.length * 10) / 10 : null;
            const avgInteractive = interactiveScores.length > 0 ? Math.round(interactiveScores.reduce((a, b) => a + b, 0) / interactiveScores.length) : null;
            return {
                id: s.id,
                fullName: s.fullName,
                studentCode: s.studentCode,
                course: s.course,
                regStatus: s.regStatus,
                totalExams: s.examAttempts.length,
                avgExamScore: avgExam,
                highestExam: examScores.length > 0 ? Math.max(...examScores) : null,
                totalFeedback: s.feedbacksReceived.length,
                avgFeedbackScore: avgFeedback,
                totalInteractive: s.interactiveAttempts.length,
                avgInteractiveScore: avgInteractive,
            };
        });
        return res.json({ success: true, data: report });
    }
    catch (error) {
        console.error("Report error:", error);
        return res.status(500).json({ success: false, message: "Lỗi tạo báo cáo" });
    }
};
exports.getStudentReport = getStudentReport;
//# sourceMappingURL=schedule.controller.js.map