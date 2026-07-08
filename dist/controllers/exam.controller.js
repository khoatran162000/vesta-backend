"use strict";
/**
 * FILE: exam.controller.ts
 * PATH: apps/api/src/controllers/exam.controller.ts
 * MÔ TẢ: Quản lý đề thi — list, create, update, delete, toggle publish
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listExams = listExams;
exports.getExamById = getExamById;
exports.createExam = createExam;
exports.updateExam = updateExam;
exports.deleteExam = deleteExam;
const database_1 = __importDefault(require("../config/database"));
const api = __importStar(require("../utils/apiResponse"));
// GET /api/exams?categoryId=xxx&status=PUBLISHED&page=1&limit=20
async function listExams(req, res) {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const categoryId = req.query.categoryId;
        const status = req.query.status;
        const search = req.query.search;
        const skip = (page - 1) * limit;
        const where = {};
        if (categoryId)
            where.categoryId = categoryId;
        if (status)
            where.status = status;
        if (search)
            where.title = { contains: search };
        const [exams, total] = await Promise.all([
            database_1.default.exam.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
                include: {
                    category: { select: { id: true, name: true } },
                    _count: { select: { questions: true, examAttempts: true } },
                },
            }),
            database_1.default.exam.count({ where }),
        ]);
        return api.paginated(res, exams, total, page, limit);
    }
    catch (err) {
        console.error("List exams error:", err);
        return api.error(res, "Lỗi server", 500);
    }
}
// GET /api/exams/:id
async function getExamById(req, res) {
    try {
        const id = req.params.id;
        const exam = await database_1.default.exam.findUnique({
            where: { id },
            include: {
                category: { select: { id: true, name: true } },
                questions: { orderBy: { orderIndex: "asc" } },
                _count: { select: { examAttempts: true } },
            },
        });
        if (!exam)
            return api.error(res, "Đề thi không tồn tại", 404);
        return api.success(res, exam);
    }
    catch (err) {
        return api.error(res, "Lỗi server", 500);
    }
}
// POST /api/exams
async function createExam(req, res) {
    try {
        const { categoryId, title, description, duration, totalScore } = req.body;
        if (!categoryId || !title || !duration || totalScore === undefined) {
            return api.error(res, "Category, tiêu đề, thời gian và tổng điểm không được để trống");
        }
        const category = await database_1.default.category.findUnique({ where: { id: categoryId } });
        if (!category)
            return api.error(res, "Danh mục không tồn tại", 404);
        const exam = await database_1.default.exam.create({
            data: {
                categoryId,
                title,
                description: description || null,
                duration: parseInt(duration),
                totalScore: parseFloat(totalScore),
                status: "DRAFT",
            },
            include: { category: { select: { id: true, name: true } } },
        });
        return api.created(res, exam, "Tạo đề thi thành công");
    }
    catch (err) {
        console.error("Create exam error:", err);
        return api.error(res, "Lỗi server", 500);
    }
}
// PUT /api/exams/:id
async function updateExam(req, res) {
    try {
        const id = req.params.id;
        const { categoryId, title, description, duration, totalScore, status } = req.body;
        const existing = await database_1.default.exam.findUnique({ where: { id } });
        if (!existing)
            return api.error(res, "Đề thi không tồn tại", 404);
        const updateData = {};
        if (categoryId)
            updateData.categoryId = categoryId;
        if (title)
            updateData.title = title;
        if (description !== undefined)
            updateData.description = description;
        if (duration)
            updateData.duration = parseInt(duration);
        if (totalScore !== undefined)
            updateData.totalScore = parseFloat(totalScore);
        if (status)
            updateData.status = status;
        const exam = await database_1.default.exam.update({
            where: { id },
            data: updateData,
            include: { category: { select: { id: true, name: true } } },
        });
        return api.success(res, exam, "Cập nhật đề thi thành công");
    }
    catch (err) {
        return api.error(res, "Lỗi server", 500);
    }
}
// DELETE /api/exams/:id
async function deleteExam(req, res) {
    try {
        const id = req.params.id;
        const existing = await database_1.default.exam.findUnique({
            where: { id },
            include: { _count: { select: { examAttempts: true } } },
        });
        if (!existing)
            return api.error(res, "Đề thi không tồn tại", 404);
        if (existing._count.examAttempts > 0) {
            return api.error(res, `Không thể xoá đề thi đã có ${existing._count.examAttempts} lượt làm bài. Hãy chuyển sang Bản nháp thay vì xoá.`);
        }
        // Cascade delete questions
        await database_1.default.exam.delete({ where: { id } });
        return api.success(res, null, "Xoá đề thi thành công");
    }
    catch (err) {
        return api.error(res, "Lỗi server", 500);
    }
}
//# sourceMappingURL=exam.controller.js.map