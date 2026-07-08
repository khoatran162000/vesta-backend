"use strict";
/**
 * FILE: question.controller.ts
 * PATH: apps/api/src/controllers/question.controller.ts
 * MÔ TẢ: Quản lý câu hỏi — list by exam, create, update, delete, reorder
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
exports.listQuestions = listQuestions;
exports.getQuestionById = getQuestionById;
exports.createQuestion = createQuestion;
exports.updateQuestion = updateQuestion;
exports.deleteQuestion = deleteQuestion;
exports.reorderQuestions = reorderQuestions;
const database_1 = __importDefault(require("../config/database"));
const api = __importStar(require("../utils/apiResponse"));
// GET /api/questions?examId=xxx
async function listQuestions(req, res) {
    try {
        const examId = req.query.examId;
        if (!examId)
            return api.error(res, "examId là bắt buộc");
        const questions = await database_1.default.question.findMany({
            where: { examId },
            orderBy: { orderIndex: "asc" },
        });
        return api.success(res, questions);
    }
    catch (err) {
        return api.error(res, "Lỗi server", 500);
    }
}
// GET /api/questions/:id
async function getQuestionById(req, res) {
    try {
        const id = req.params.id;
        const question = await database_1.default.question.findUnique({
            where: { id },
            include: { exam: { select: { id: true, title: true } } },
        });
        if (!question)
            return api.error(res, "Câu hỏi không tồn tại", 404);
        return api.success(res, question);
    }
    catch (err) {
        return api.error(res, "Lỗi server", 500);
    }
}
// POST /api/questions
async function createQuestion(req, res) {
    try {
        const { examId, type, content, mediaUrl, options, correctAnswer, explanation, score } = req.body;
        if (!examId || !type || !content || correctAnswer === undefined) {
            return api.error(res, "examId, loại câu hỏi, nội dung và đáp án đúng không được để trống");
        }
        // Kiểm tra exam tồn tại
        const exam = await database_1.default.exam.findUnique({ where: { id: examId } });
        if (!exam)
            return api.error(res, "Đề thi không tồn tại", 404);
        // Lấy orderIndex tiếp theo
        const lastQuestion = await database_1.default.question.findFirst({
            where: { examId },
            orderBy: { orderIndex: "desc" },
            select: { orderIndex: true },
        });
        const nextOrder = (lastQuestion?.orderIndex ?? -1) + 1;
        const question = await database_1.default.question.create({
            data: {
                examId,
                type,
                content,
                mediaUrl: mediaUrl || null,
                options: options ? (typeof options === "string" ? JSON.parse(options) : options) : null,
                correctAnswer: typeof correctAnswer === "string" ? JSON.parse(correctAnswer) : correctAnswer,
                explanation: explanation || null,
                orderIndex: nextOrder,
                score: score ? parseFloat(score) : 1,
            },
        });
        return api.created(res, question, "Tạo câu hỏi thành công");
    }
    catch (err) {
        console.error("Create question error:", err);
        return api.error(res, "Lỗi server", 500);
    }
}
// PUT /api/questions/:id
async function updateQuestion(req, res) {
    try {
        const id = req.params.id;
        const { type, content, mediaUrl, options, correctAnswer, explanation, score } = req.body;
        const existing = await database_1.default.question.findUnique({ where: { id } });
        if (!existing)
            return api.error(res, "Câu hỏi không tồn tại", 404);
        const updateData = {};
        if (type)
            updateData.type = type;
        if (content)
            updateData.content = content;
        if (mediaUrl !== undefined)
            updateData.mediaUrl = mediaUrl || null;
        if (options !== undefined) {
            updateData.options = typeof options === "string" ? JSON.parse(options) : options;
        }
        if (correctAnswer !== undefined) {
            updateData.correctAnswer = typeof correctAnswer === "string" ? JSON.parse(correctAnswer) : correctAnswer;
        }
        if (explanation !== undefined)
            updateData.explanation = explanation;
        if (score !== undefined)
            updateData.score = parseFloat(score);
        const question = await database_1.default.question.update({
            where: { id },
            data: updateData,
        });
        return api.success(res, question, "Cập nhật câu hỏi thành công");
    }
    catch (err) {
        return api.error(res, "Lỗi server", 500);
    }
}
// DELETE /api/questions/:id
async function deleteQuestion(req, res) {
    try {
        const id = req.params.id;
        const existing = await database_1.default.question.findUnique({ where: { id } });
        if (!existing)
            return api.error(res, "Câu hỏi không tồn tại", 404);
        await database_1.default.question.delete({ where: { id } });
        return api.success(res, null, "Xoá câu hỏi thành công");
    }
    catch (err) {
        return api.error(res, "Lỗi server", 500);
    }
}
// PUT /api/questions/reorder
async function reorderQuestions(req, res) {
    try {
        const { orders } = req.body;
        // orders: [{ id: "xxx", orderIndex: 0 }, { id: "yyy", orderIndex: 1 }, ...]
        if (!Array.isArray(orders))
            return api.error(res, "Dữ liệu không hợp lệ");
        for (const item of orders) {
            await database_1.default.question.update({
                where: { id: item.id },
                data: { orderIndex: item.orderIndex },
            });
        }
        return api.success(res, null, "Sắp xếp lại câu hỏi thành công");
    }
    catch (err) {
        return api.error(res, "Lỗi server", 500);
    }
}
//# sourceMappingURL=question.controller.js.map