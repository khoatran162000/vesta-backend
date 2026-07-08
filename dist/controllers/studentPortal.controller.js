"use strict";
// FILE: src/controllers/studentPortal.controller.ts — API Student Portal
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyInfo = exports.getStudentDashboard = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getStudentDashboard = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ success: false, message: "Chưa đăng nhập" });
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role !== "STUDENT")
            return res.status(403).json({ success: false, message: "Không phải học viên" });
        const isPaid = user.regStatus === "CONFIRMED" || user.regStatus === "PAID";
        const course = user.course || "";
        // Exam stats
        const allAttempts = await prisma.examAttempt.findMany({
            where: { studentId: userId, status: "SUBMITTED" },
            select: { score: true, endTime: true, id: true, examId: true },
            orderBy: { endTime: "asc" },
        });
        const totalAttempts = allAttempts.length;
        const avgScore = totalAttempts > 0 ? Math.round(allAttempts.reduce((s, a) => s + (a.score || 0), 0) / totalAttempts) : 0;
        const highestScore = totalAttempts > 0 ? Math.round(Math.max(...allAttempts.map((a) => a.score || 0))) : 0;
        const chartData = allAttempts.slice(-20).map((a) => ({
            date: a.endTime ? new Date(a.endTime).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }) : "",
            score: Math.round(a.score || 0),
        }));
        // Recent exams
        const recentExams = await prisma.examAttempt.findMany({
            where: { studentId: userId, status: "SUBMITTED" },
            orderBy: { endTime: "desc" }, take: 5,
            include: { exam: { select: { title: true, category: { select: { name: true } } } } },
        });
        // Skill progress
        const skillProgress = { reading: 0, listening: 0, writing: 0, speaking: 0 };
        for (const att of recentExams) {
            const cat = att.exam?.category?.name?.toLowerCase() || "";
            if (cat.includes("read"))
                skillProgress.reading++;
            else if (cat.includes("listen"))
                skillProgress.listening++;
            else if (cat.includes("writ"))
                skillProgress.writing++;
            else if (cat.includes("speak"))
                skillProgress.speaking++;
        }
        // Class diaries (for this course)
        const classDiary = isPaid && course ? await prisma.classDiary.findMany({
            where: { course }, orderBy: { date: "desc" }, take: 30,
        }) : [];
        // Materials (for this course)
        const materials = isPaid && course ? await prisma.material.findMany({
            where: { course, isPublished: true }, orderBy: { orderIndex: "asc" },
        }) : [];
        // Feedback
        const feedback = isPaid ? await prisma.feedback.findMany({
            where: { studentId: userId }, orderBy: { createdAt: "desc" }, take: 20,
            include: { reviewer: { select: { fullName: true } } },
        }) : [];
        // Week calculation
        const weeksSinceStart = Math.ceil((Date.now() - new Date(user.createdAt).getTime()) / (7 * 24 * 60 * 60 * 1000));
        return res.json({
            success: true,
            data: {
                isPaid,
                regStatus: user.regStatus,
                course,
                currentWeek: Math.min(15, weeksSinceStart),
                totalAttempts, avgScore, highestScore, chartData,
                readingDone: skillProgress.reading,
                listeningDone: skillProgress.listening,
                writingDone: skillProgress.writing,
                speakingDone: skillProgress.speaking,
                recentExams: recentExams.map((a) => ({
                    id: a.id, examId: a.examId, examTitle: a.exam?.title,
                    score: Math.round(a.score || 0), endTime: a.endTime,
                })),
                classDiary: classDiary.map((d) => ({
                    id: d.id, session: d.session,
                    date: d.date.toLocaleDateString("vi-VN"),
                    topic: d.topic, homework: d.homework,
                    duration: d.duration, teacherNote: d.teacherNote,
                })),
                materials: materials.map((m) => ({
                    id: m.id, title: m.title, description: m.description,
                    url: m.fileUrl, type: m.fileType,
                    date: m.createdAt.toLocaleDateString("vi-VN"),
                })),
                feedback: feedback.map((f) => ({
                    id: f.id, title: f.title, studentWork: f.studentWork,
                    teacherComment: f.teacherComment, score: f.score,
                    maxScore: f.maxScore, status: f.status,
                    reviewer: f.reviewer, createdAt: f.createdAt,
                })),
                aiSummary: null,
            },
        });
    }
    catch (error) {
        console.error("Dashboard error:", error);
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};
exports.getStudentDashboard = getStudentDashboard;
const getMyInfo = async (req, res) => {
    try {
        const userId = req.user?.id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true, fullName: true, email: true, phone: true, studentCode: true,
                avatarUrl: true, role: true, isActive: true, createdAt: true,
                cccd: true, course: true, studyMode: true, notes: true, regStatus: true, startDate: true,
            },
        });
        if (!user)
            return res.status(404).json({ success: false, message: "Không tìm thấy" });
        return res.json({ success: true, data: user });
    }
    catch {
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};
exports.getMyInfo = getMyInfo;
//# sourceMappingURL=studentPortal.controller.js.map