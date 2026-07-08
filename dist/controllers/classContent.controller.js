"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFeedback = exports.createFeedbackForStudent = exports.getStudentFeedback = exports.reviewFeedback = exports.listFeedback = exports.getMyFeedback = exports.submitWork = exports.deleteMaterial = exports.updateMaterial = exports.createMaterial = exports.listMaterials = exports.deleteDiary = exports.updateDiary = exports.createDiary = exports.listDiaries = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Helper lấy userId từ JWT payload (payload = { userId, role })
function uid(req) {
    return req.user?.userId || "";
}
// ═══════════════════════════════════════════
// CLASS DIARY — Nhật ký buổi học
// ═══════════════════════════════════════════
const listDiaries = async (req, res) => {
    const { course, page = "1", limit = "50" } = req.query;
    const where = {};
    if (course)
        where.course = course;
    const [data, total] = await Promise.all([
        prisma.classDiary.findMany({
            where, orderBy: { date: "desc" },
            skip: (Number(page) - 1) * Number(limit), take: Number(limit),
            include: { creator: { select: { fullName: true } } },
        }),
        prisma.classDiary.count({ where }),
    ]);
    return res.json({ success: true, data, meta: { total, page: Number(page), limit: Number(limit) } });
};
exports.listDiaries = listDiaries;
const createDiary = async (req, res) => {
    try {
        const userId = uid(req);
        const { course, session, date, topic, homework, duration, teacherNote } = req.body;
        if (!course || !session || !date || !topic) {
            return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc" });
        }
        const diary = await prisma.classDiary.create({
            data: { course, session: Number(session), date: new Date(date), topic, homework, duration, teacherNote, createdBy: userId },
        });
        return res.status(201).json({ success: true, data: diary });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Lỗi tạo nhật ký" });
    }
};
exports.createDiary = createDiary;
const updateDiary = async (req, res) => {
    try {
        const id = String(req.params.id);
        const { creator, createdBy, id: _id, createdAt, updatedAt, ...data } = req.body;
        if (data.session)
            data.session = Number(data.session);
        if (data.date)
            data.date = new Date(data.date);
        const diary = await prisma.classDiary.update({ where: { id }, data });
        return res.json({ success: true, data: diary });
    }
    catch {
        return res.status(500).json({ success: false, message: "Lỗi cập nhật" });
    }
};
exports.updateDiary = updateDiary;
const deleteDiary = async (req, res) => {
    try {
        await prisma.classDiary.delete({ where: { id: String(req.params.id) } });
        return res.json({ success: true, message: "Đã xoá" });
    }
    catch {
        return res.status(500).json({ success: false, message: "Lỗi xoá" });
    }
};
exports.deleteDiary = deleteDiary;
// ═══════════════════════════════════════════
// MATERIALS — Tài liệu học
// ═══════════════════════════════════════════
const listMaterials = async (req, res) => {
    const { course } = req.query;
    const where = {};
    if (course)
        where.course = course;
    const userRole = req.user?.role;
    if (userRole === "STUDENT")
        where.isPublished = true;
    const data = await prisma.material.findMany({
        where, orderBy: { orderIndex: "asc" },
        include: { creator: { select: { fullName: true } } },
    });
    return res.json({ success: true, data });
};
exports.listMaterials = listMaterials;
const createMaterial = async (req, res) => {
    try {
        const userId = uid(req);
        const { course, title, description, fileUrl, fileType, orderIndex, isPublished } = req.body;
        if (!course || !title || !fileUrl) {
            return res.status(400).json({ success: false, message: "Thiếu thông tin" });
        }
        const mat = await prisma.material.create({
            data: { course, title, description, fileUrl, fileType, orderIndex: Number(orderIndex || 0), isPublished: isPublished !== false, createdBy: userId },
        });
        return res.status(201).json({ success: true, data: mat });
    }
    catch {
        return res.status(500).json({ success: false, message: "Lỗi tạo tài liệu" });
    }
};
exports.createMaterial = createMaterial;
const updateMaterial = async (req, res) => {
    try {
        const { creator, createdBy, id: _id, createdAt, updatedAt, ...data } = req.body;
        if (data.orderIndex !== undefined)
            data.orderIndex = Number(data.orderIndex);
        const mat = await prisma.material.update({ where: { id: String(req.params.id) }, data });
        return res.json({ success: true, data: mat });
    }
    catch {
        return res.status(500).json({ success: false, message: "Lỗi cập nhật" });
    }
};
exports.updateMaterial = updateMaterial;
const deleteMaterial = async (req, res) => {
    try {
        await prisma.material.delete({ where: { id: String(req.params.id) } });
        return res.json({ success: true, message: "Đã xoá" });
    }
    catch {
        return res.status(500).json({ success: false, message: "Lỗi xoá" });
    }
};
exports.deleteMaterial = deleteMaterial;
// ═══════════════════════════════════════════
// FEEDBACK — Vở ghi / Phản hồi GV
// ═══════════════════════════════════════════
// Student nộp bài
const submitWork = async (req, res) => {
    try {
        const studentId = uid(req);
        const { title, studentWork, studentFileUrl } = req.body;
        if (!title)
            return res.status(400).json({ success: false, message: "Thiếu tiêu đề bài" });
        const fb = await prisma.feedback.create({
            data: { studentId: studentId, title, studentWork, studentFileUrl, status: "PENDING" },
        });
        return res.status(201).json({ success: true, data: fb });
    }
    catch {
        return res.status(500).json({ success: false, message: "Lỗi nộp bài" });
    }
};
exports.submitWork = submitWork;
// Student xem feedback của mình
const getMyFeedback = async (req, res) => {
    const studentId = uid(req);
    const data = await prisma.feedback.findMany({
        where: { studentId },
        orderBy: { createdAt: "desc" },
        include: { reviewer: { select: { fullName: true } } },
    });
    return res.json({ success: true, data });
};
exports.getMyFeedback = getMyFeedback;
// Admin/Teacher xem tất cả feedback (hoặc theo student qua query)
const listFeedback = async (req, res) => {
    const { studentId, status } = req.query;
    const where = {};
    if (studentId)
        where.studentId = studentId;
    if (status)
        where.status = status;
    const data = await prisma.feedback.findMany({
        where, orderBy: { createdAt: "desc" },
        include: {
            student: { select: { fullName: true, studentCode: true, course: true } },
            reviewer: { select: { fullName: true } },
        },
    });
    return res.json({ success: true, data });
};
exports.listFeedback = listFeedback;
// Admin/Teacher chấm bài + phản hồi
const reviewFeedback = async (req, res) => {
    try {
        const reviewerId = uid(req);
        const id = String(req.params.id);
        const { teacherComment, score } = req.body;
        const fb = await prisma.feedback.update({
            where: { id },
            data: {
                teacherComment,
                score: score !== undefined && score !== null ? Number(score) : undefined,
                status: "REVIEWED",
                reviewedBy: reviewerId,
                reviewedAt: new Date(),
            },
        });
        try {
            await prisma.notification.create({
                data: {
                    userId: fb.studentId,
                    title: "📝 Giáo viên đã chấm bài",
                    message: `Bài "${fb.title}" đã được chấm${score !== undefined && score !== null ? ` — ${score} điểm` : ""}. Xem phản hồi chi tiết.`,
                    type: "TEACHER_WARNING",
                },
            });
        }
        catch { }
        return res.json({ success: true, data: fb });
    }
    catch {
        return res.status(500).json({ success: false, message: "Lỗi chấm bài" });
    }
};
exports.reviewFeedback = reviewFeedback;
// ─────────────────────────────────────────────
// MỚI: Admin/GV xem TẤT CẢ vở ghi của 1 học viên
// GET /api/class/feedback/student/:studentId
// ─────────────────────────────────────────────
const getStudentFeedback = async (req, res) => {
    try {
        const studentId = String(req.params.studentId);
        const [student, feedbacks] = await Promise.all([
            prisma.user.findUnique({
                where: { id: studentId },
                select: { id: true, fullName: true, studentCode: true, course: true, email: true },
            }),
            prisma.feedback.findMany({
                where: { studentId },
                orderBy: { createdAt: "desc" },
                include: { reviewer: { select: { fullName: true } } },
            }),
        ]);
        if (!student)
            return res.status(404).json({ success: false, message: "Không tìm thấy học viên" });
        const reviewed = feedbacks.filter((f) => f.status === "REVIEWED");
        const scores = reviewed.filter((f) => f.score != null).map((f) => f.score);
        const avgScore = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 : null;
        return res.json({
            success: true,
            data: {
                student,
                feedbacks,
                stats: {
                    total: feedbacks.length,
                    pending: feedbacks.filter((f) => f.status === "PENDING").length,
                    reviewed: reviewed.length,
                    avgScore,
                },
            },
        });
    }
    catch {
        return res.status(500).json({ success: false, message: "Lỗi tải dữ liệu vở ghi" });
    }
};
exports.getStudentFeedback = getStudentFeedback;
// ─────────────────────────────────────────────
// MỚI: Admin/GV CHỦ ĐỘNG tạo nhận xét cho 1 HV
// POST /api/class/feedback/create-for-student
// ─────────────────────────────────────────────
const createFeedbackForStudent = async (req, res) => {
    try {
        const reviewerId = uid(req);
        const { studentId, title, studentWork, teacherComment, score } = req.body;
        if (!studentId || !title) {
            return res.status(400).json({ success: false, message: "Thiếu học viên hoặc tiêu đề" });
        }
        const hasReview = (teacherComment != null && teacherComment !== "") || (score != null);
        const fb = await prisma.feedback.create({
            data: {
                studentId,
                title,
                studentWork: studentWork || null,
                teacherComment: teacherComment || null,
                score: score != null ? Number(score) : null,
                status: hasReview ? "REVIEWED" : "PENDING",
                reviewedBy: hasReview ? reviewerId : null,
                reviewedAt: hasReview ? new Date() : null,
            },
        });
        if (hasReview) {
            try {
                await prisma.notification.create({
                    data: {
                        userId: studentId,
                        title: "📝 Giáo viên có nhận xét mới",
                        message: `Nhận xét mới: "${title}"${score != null ? ` — ${score} điểm` : ""}. Xem chi tiết trong Vở ghi.`,
                        type: "TEACHER_WARNING",
                    },
                });
            }
            catch { }
        }
        return res.status(201).json({ success: true, data: fb });
    }
    catch {
        return res.status(500).json({ success: false, message: "Lỗi tạo nhận xét" });
    }
};
exports.createFeedbackForStudent = createFeedbackForStudent;
// ─────────────────────────────────────────────
// MỚI: Admin/GV xoá 1 nhận xét / vở ghi
// DELETE /api/class/feedback/:id
// ─────────────────────────────────────────────
const deleteFeedback = async (req, res) => {
    try {
        const id = String(req.params.id);
        const existing = await prisma.feedback.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, message: "Không tìm thấy nhận xét" });
        }
        await prisma.feedback.delete({ where: { id } });
        return res.json({ success: true, message: "Đã xoá nhận xét" });
    }
    catch {
        return res.status(500).json({ success: false, message: "Lỗi xoá nhận xét" });
    }
};
exports.deleteFeedback = deleteFeedback;
//# sourceMappingURL=classContent.controller.js.map