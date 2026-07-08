"use strict";
/**
 * FILE: category.controller.ts
 * PATH: apps/api/src/controllers/category.controller.ts
 * MÔ TẢ: Quản lý Categories (cấu trúc cây) — list tree, create, update, delete
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
exports.listCategories = listCategories;
exports.listCategoriesFlat = listCategoriesFlat;
exports.getCategoryById = getCategoryById;
exports.createCategory = createCategory;
exports.updateCategory = updateCategory;
exports.deleteCategory = deleteCategory;
const database_1 = __importDefault(require("../config/database"));
const api = __importStar(require("../utils/apiResponse"));
// GET /api/categories — trả về cây danh mục
async function listCategories(_req, res) {
    try {
        const categories = await database_1.default.category.findMany({
            include: {
                children: {
                    include: {
                        children: {
                            include: { children: true, _count: { select: { exams: true } } },
                        },
                        _count: { select: { exams: true } },
                    },
                },
                _count: { select: { exams: true } },
            },
            where: { parentId: null }, // Chỉ lấy root categories
            orderBy: { createdAt: "asc" },
        });
        return api.success(res, categories);
    }
    catch (err) {
        console.error("List categories error:", err);
        return api.error(res, "Lỗi server", 500);
    }
}
// GET /api/categories/flat — danh sách phẳng (cho dropdown select)
async function listCategoriesFlat(_req, res) {
    try {
        const categories = await database_1.default.category.findMany({
            include: {
                parent: { select: { name: true } },
                _count: { select: { exams: true } },
            },
            orderBy: { createdAt: "asc" },
        });
        return api.success(res, categories);
    }
    catch (err) {
        return api.error(res, "Lỗi server", 500);
    }
}
// GET /api/categories/:id
async function getCategoryById(req, res) {
    try {
        const id = req.params.id;
        const category = await database_1.default.category.findUnique({
            where: { id },
            include: {
                parent: { select: { id: true, name: true } },
                children: { select: { id: true, name: true } },
                exams: {
                    select: { id: true, title: true, status: true, duration: true, totalScore: true, _count: { select: { questions: true } } },
                    orderBy: { createdAt: "desc" },
                },
            },
        });
        if (!category)
            return api.error(res, "Danh mục không tồn tại", 404);
        return api.success(res, category);
    }
    catch (err) {
        return api.error(res, "Lỗi server", 500);
    }
}
// POST /api/categories
async function createCategory(req, res) {
    try {
        const { name, description, parentId } = req.body;
        if (!name)
            return api.error(res, "Tên danh mục không được để trống");
        if (parentId) {
            const parent = await database_1.default.category.findUnique({ where: { id: parentId } });
            if (!parent)
                return api.error(res, "Danh mục cha không tồn tại", 404);
        }
        const category = await database_1.default.category.create({
            data: { name, description: description || null, parentId: parentId || null },
        });
        return api.created(res, category, "Tạo danh mục thành công");
    }
    catch (err) {
        console.error("Create category error:", err);
        return api.error(res, "Lỗi server", 500);
    }
}
// PUT /api/categories/:id
async function updateCategory(req, res) {
    try {
        const id = req.params.id;
        const { name, description, parentId } = req.body;
        const existing = await database_1.default.category.findUnique({ where: { id } });
        if (!existing)
            return api.error(res, "Danh mục không tồn tại", 404);
        // Không cho đặt parent là chính nó
        if (parentId === id)
            return api.error(res, "Danh mục không thể là cha của chính nó");
        const updateData = {};
        if (name !== undefined)
            updateData.name = name;
        if (description !== undefined)
            updateData.description = description;
        if (parentId !== undefined)
            updateData.parentId = parentId || null;
        const category = await database_1.default.category.update({
            where: { id },
            data: updateData,
        });
        return api.success(res, category, "Cập nhật danh mục thành công");
    }
    catch (err) {
        return api.error(res, "Lỗi server", 500);
    }
}
// DELETE /api/categories/:id
async function deleteCategory(req, res) {
    try {
        const id = req.params.id;
        const existing = await database_1.default.category.findUnique({
            where: { id },
            include: { children: true, exams: true },
        });
        if (!existing)
            return api.error(res, "Danh mục không tồn tại", 404);
        if (existing.children.length > 0) {
            return api.error(res, "Không thể xoá danh mục đang có danh mục con. Xoá danh mục con trước.");
        }
        if (existing.exams.length > 0) {
            return api.error(res, "Không thể xoá danh mục đang có đề thi. Di chuyển hoặc xoá đề thi trước.");
        }
        await database_1.default.category.delete({ where: { id } });
        return api.success(res, null, "Xoá danh mục thành công");
    }
    catch (err) {
        return api.error(res, "Lỗi server", 500);
    }
}
//# sourceMappingURL=category.controller.js.map