"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExerciseAttempts = exports.checkExercisePublic = exports.getMyAttempts = exports.submitExercise = exports.deleteExercise = exports.updateExercise = exports.createExercise = exports.getExercise = exports.listExercises = void 0;
const client_1 = require("@prisma/client");
const gradeGaps_1 = require("../utils/gradeGaps");
const prisma = new client_1.PrismaClient();
function uid(req) {
    return req.user?.userId;
}
function getVisibilityFilter(user) {
    if (!user)
        return { visibility: "PUBLIC", isPublished: true };
    if (user.role === "ADMIN" || user.role === "TEACHER")
        return {};
    if (user.role === "STUDENT") {
        return {
            isPublished: true,
            OR: [
                { visibility: "PUBLIC" },
                { visibility: "STUDENT" },
                ...(user.course ? [{ visibility: "CLASS", visibleTo: { contains: user.course } }] : []),
            ],
        };
    }
    return { visibility: "PUBLIC", isPublished: true };
}
// Ẩn đáp án trong questions cũ (cho người đang làm)
function stripQuestionAnswers(questions, type) {
    const arr = typeof questions === "string" ? JSON.parse(questions) : questions;
    if (!Array.isArray(arr))
        return arr;
    if (type === "MATCHING") {
        // Giữ left + id, ẩn right (đáp án). Trộn thứ tự "right" để học viên nối.
        const rights = arr.map((q) => q.right).sort(() => Math.random() - 0.5);
        return {
            pairs: arr.map((q) => ({ id: q.id, left: q.left })),
            choices: rights,
        };
    }
    return arr.map((q) => {
        const { correctAnswer, explanation, ...rest } = q;
        return rest;
    });
}
// Một bài là kiểu GAP nếu có gaps không rỗng
function isGapExercise(ex) {
    if (!ex?.gaps)
        return false;
    const g = typeof ex.gaps === "string" ? JSON.parse(ex.gaps) : ex.gaps;
    return g && typeof g === "object" && Object.keys(g).length > 0;
}
// ─── List exercises ───
const listExercises = async (req, res) => {
    try {
        const user = req.user;
        const { postId } = req.query;
        const where = getVisibilityFilter(user);
        if (postId)
            where.postId = postId;
        const data = await prisma.interactiveExercise.findMany({
            where,
            orderBy: { orderIndex: "asc" },
            include: { creator: { select: { fullName: true } } },
        });
        const isStaff = user?.role === "ADMIN" || user?.role === "TEACHER";
        const safe = data.map((ex) => {
            const qs = typeof ex.questions === "string" ? JSON.parse(ex.questions) : ex.questions;
            const gapObj = ex.gaps ? (typeof ex.gaps === "string" ? JSON.parse(ex.gaps) : ex.gaps) : null;
            const gapCount = gapObj ? Object.keys(gapObj).length : 0;
            return {
                ...ex,
                questions: isStaff ? ex.questions : undefined,
                gaps: isStaff ? ex.gaps : undefined,
                content: isStaff ? ex.content : undefined,
                questionCount: gapCount > 0 ? gapCount : (Array.isArray(qs) ? qs.length : 0),
            };
        });
        return res.json({ success: true, data: safe });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};
exports.listExercises = listExercises;
// ─── Detail exercise ───
const getExercise = async (req, res) => {
    try {
        const user = req.user;
        const ex = await prisma.interactiveExercise.findUnique({
            where: { id: String(req.params.id) },
            include: { creator: { select: { fullName: true } }, post: { select: { title: true, slug: true } } },
        });
        if (!ex)
            return res.status(404).json({ success: false, message: "Không tìm thấy" });
        if (!user && ex.visibility !== "PUBLIC") {
            return res.status(401).json({ success: false, message: "Vui lòng đăng nhập" });
        }
        if (user?.role === "STUDENT" && ex.visibility === "CLASS") {
            if (!user.course || !ex.visibleTo?.includes(user.course)) {
                return res.status(403).json({ success: false, message: "Bạn không có quyền xem bài này" });
            }
        }
        const isStaff = user?.role === "ADMIN" || user?.role === "TEACHER";
        if (isStaff) {
            return res.json({ success: true, data: ex });
        }
        // Người làm bài: ẩn đáp án (cả gaps lẫn questions)
        const data = {
            ...ex,
            questions: stripQuestionAnswers(ex.questions, ex.type),
            gaps: ex.gaps ? (0, gradeGaps_1.stripGapAnswers)(typeof ex.gaps === "string" ? JSON.parse(ex.gaps) : ex.gaps) : ex.gaps,
        };
        return res.json({ success: true, data });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};
exports.getExercise = getExercise;
// ─── Create exercise ───
const createExercise = async (req, res) => {
    try {
        const userId = uid(req);
        const { postId, title, description, type, questions, content, gaps, distractors, visibility, visibleTo, isPublished, orderIndex } = req.body;
        if (!title || !type) {
            return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc" });
        }
        // Phải có HOẶC questions HOẶC gaps
        const hasGaps = gaps && Object.keys(gaps).length > 0;
        if (!hasGaps && !questions) {
            return res.status(400).json({ success: false, message: "Bài tập cần có câu hỏi hoặc chỗ trống" });
        }
        const ex = await prisma.interactiveExercise.create({
            data: {
                postId: postId || null,
                title, description, type,
                questions: questions ?? [],
                content: content ?? null,
                gaps: hasGaps ? (0, gradeGaps_1.normalizeGaps)(gaps) : undefined,
                distractors: distractors ?? undefined,
                visibility: visibility || "PUBLIC",
                visibleTo: visibleTo || null,
                isPublished: isPublished || false,
                orderIndex: orderIndex || 0,
                createdBy: userId,
            },
        });
        return res.status(201).json({ success: true, data: ex });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Lỗi tạo bài tập" });
    }
};
exports.createExercise = createExercise;
// ─── Update exercise ───
const updateExercise = async (req, res) => {
    try {
        const { creator, post, attempts, createdBy, id: _id, createdAt, updatedAt, questionCount, gaps, ...rest } = req.body;
        const data = { ...rest };
        // Nếu có gaps trong body thì chuẩn hoá lại trước khi lưu
        if (gaps !== undefined) {
            data.gaps = gaps && Object.keys(gaps).length > 0 ? (0, gradeGaps_1.normalizeGaps)(gaps) : undefined;
        }
        const ex = await prisma.interactiveExercise.update({
            where: { id: String(req.params.id) },
            data,
        });
        return res.json({ success: true, data: ex });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Lỗi cập nhật" });
    }
};
exports.updateExercise = updateExercise;
// ─── Delete exercise ───
const deleteExercise = async (req, res) => {
    try {
        await prisma.interactiveExercise.delete({ where: { id: String(req.params.id) } });
        return res.json({ success: true, message: "Đã xoá" });
    }
    catch {
        return res.status(500).json({ success: false, message: "Lỗi xoá" });
    }
};
exports.deleteExercise = deleteExercise;
// Chấm 1 bài (dùng chung cho submit + check). Trả { score, maxScore, percent, detail }
function gradeExercise(ex, answers) {
    if (isGapExercise(ex)) {
        const gaps = typeof ex.gaps === "string" ? JSON.parse(ex.gaps) : ex.gaps;
        const r = (0, gradeGaps_1.gradeGaps)(gaps, answers);
        return {
            score: r.percent, // % để đồng nhất thang điểm cũ
            correct: r.score,
            total: r.maxScore,
            detail: r.detail,
        };
    }
    // Bài cũ kiểu questions
    const questions = typeof ex.questions === "string" ? JSON.parse(ex.questions) : ex.questions;
    let correct = 0, total = 0;
    const detail = [];
    // MATCHING: mỗi cặp {id, left, right}; answers[pairId] = giá trị "right" học viên nối
    if (ex.type === "MATCHING" && Array.isArray(questions)) {
        for (const q of questions) {
            total++;
            const studentAns = answers?.[q.id];
            const isCorrect = String(studentAns ?? "").trim() === String(q.right ?? "").trim();
            if (isCorrect)
                correct++;
            detail.push({
                id: q.id,
                content: q.left,
                studentAnswer: studentAns ?? null,
                correctAnswer: q.right,
                isCorrect,
                explanation: null,
            });
        }
        const score = total > 0 ? Math.round((correct / total) * 100) : 0;
        return { score, correct, total, detail };
    }
    if (Array.isArray(questions)) {
        for (const q of questions) {
            total++;
            const studentAns = answers?.[q.id];
            const isCorrect = JSON.stringify(studentAns) === JSON.stringify(q.correctAnswer);
            if (isCorrect)
                correct++;
            detail.push({
                id: q.id, content: q.content,
                studentAnswer: studentAns ?? null,
                correctAnswer: q.correctAnswer,
                isCorrect,
                explanation: q.explanation || null,
            });
        }
    }
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    return { score, correct, total, detail };
}
// ─── Student submit (CÓ lưu) ───
const submitExercise = async (req, res) => {
    try {
        const studentId = uid(req);
        const id = String(req.params.id);
        const { answers } = req.body;
        const ex = await prisma.interactiveExercise.findUnique({ where: { id } });
        if (!ex)
            return res.status(404).json({ success: false, message: "Không tìm thấy" });
        const result = gradeExercise(ex, answers);
        const attempt = await prisma.interactiveAttempt.create({
            data: {
                exerciseId: id, studentId: studentId, answers,
                score: result.score, totalScore: result.total,
                detail: result.detail,
            },
        });
        return res.json({ success: true, data: { ...attempt, correct: result.correct, total: result.total, detail: result.detail } });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Lỗi nộp bài" });
    }
};
exports.submitExercise = submitExercise;
// ─── Get student attempts ───
const getMyAttempts = async (req, res) => {
    const studentId = uid(req);
    const data = await prisma.interactiveAttempt.findMany({
        where: { studentId },
        orderBy: { createdAt: "desc" },
        include: { exercise: { select: { title: true, type: true } } },
    });
    return res.json({ success: true, data });
};
exports.getMyAttempts = getMyAttempts;
// ─── Public check (KHÔNG lưu) ───
const checkExercisePublic = async (req, res) => {
    try {
        const id = String(req.params.id);
        const { answers } = req.body;
        const ex = await prisma.interactiveExercise.findUnique({ where: { id } });
        if (!ex)
            return res.status(404).json({ success: false, message: "Không tìm thấy" });
        if (ex.visibility !== "PUBLIC") {
            return res.status(403).json({ success: false, message: "Bài này yêu cầu đăng nhập" });
        }
        const result = gradeExercise(ex, answers);
        return res.json({ success: true, data: result });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Lỗi chấm bài" });
    }
};
exports.checkExercisePublic = checkExercisePublic;
// ─── Admin/Teacher: xem thống kê lượt làm của 1 bài ───
const getExerciseAttempts = async (req, res) => {
    try {
        const exerciseId = String(req.params.id);
        const ex = await prisma.interactiveExercise.findUnique({
            where: { id: exerciseId },
            select: { id: true, title: true, type: true },
        });
        if (!ex)
            return res.status(404).json({ success: false, message: "Không tìm thấy bài tập" });
        const attempts = await prisma.interactiveAttempt.findMany({
            where: { exerciseId },
            orderBy: { createdAt: "desc" },
            include: { student: { select: { id: true, fullName: true, studentCode: true } } },
        });
        // Gộp theo HV: giữ lượt MỚI NHẤT của mỗi học viên (đã sort desc nên gặp đầu là mới nhất)
        const seen = new Set();
        const latest = [];
        for (const a of attempts) {
            const key = a.studentId || `guest-${a.id}`;
            if (seen.has(key))
                continue;
            seen.add(key);
            latest.push({
                attemptId: a.id,
                studentId: a.studentId,
                studentName: a.student?.fullName || "(khách vãng lai)",
                studentCode: a.student?.studentCode || null,
                score: a.score,
                detail: a.detail,
                createdAt: a.createdAt,
            });
        }
        const scored = latest.filter((x) => typeof x.score === "number");
        const avg = scored.length ? Math.round(scored.reduce((s, x) => s + x.score, 0) / scored.length) : null;
        return res.json({
            success: true,
            data: {
                exercise: ex,
                totalAttempts: attempts.length,
                totalStudents: latest.length,
                avgScore: avg,
                students: latest,
            },
        });
    }
    catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
};
exports.getExerciseAttempts = getExerciseAttempts;
//# sourceMappingURL=interactive.controller.js.map