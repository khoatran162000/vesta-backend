"use strict";
/**
 * FILE: post.controller.ts
 * PATH: apps/api/src/controllers/post.controller.ts
 * MÔ TẢ: CRUD bài viết blog — list, detail, create, update, delete, upload image
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
exports.listPosts = listPosts;
exports.getPostBySlug = getPostBySlug;
exports.listAllPosts = listAllPosts;
exports.getPostById = getPostById;
exports.createPost = createPost;
exports.updatePost = updatePost;
exports.deletePost = deletePost;
exports.uploadContentImage = uploadContentImage;
const slugify_1 = __importDefault(require("slugify"));
const database_1 = __importDefault(require("../config/database"));
const api = __importStar(require("../utils/apiResponse"));
// ═══════════════════════ PUBLIC ═══════════════════════
// GET /api/posts?status=PUBLISHED&page=1&limit=10&tag=Listening
async function listPosts(req, res) {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const status = req.query.status;
        const tag = req.query.tag;
        const skip = (page - 1) * limit;
        const where = {};
        if (status)
            where.status = status;
        if (tag) {
            where.tags = { string_contains: tag };
        }
        const [posts, total] = await Promise.all([
            database_1.default.post.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    excerpt: true,
                    thumbnailUrl: true,
                    tags: true,
                    status: true,
                    createdAt: true,
                    author: {
                        select: { fullName: true, avatarUrl: true },
                    },
                },
            }),
            database_1.default.post.count({ where }),
        ]);
        // Parse tags JSON string thành array
        const parsed = posts.map((p) => ({
            ...p,
            tags: typeof p.tags === "string" ? JSON.parse(p.tags) : p.tags,
        }));
        return api.paginated(res, parsed, total, page, limit);
    }
    catch (err) {
        console.error("List posts error:", err);
        return api.error(res, "Lỗi server", 500);
    }
}
// GET /api/posts/:slug
async function getPostBySlug(req, res) {
    try {
        const { slug } = req.params;
        const post = await database_1.default.post.findUnique({
            where: { slug },
            include: {
                author: { select: { fullName: true, avatarUrl: true } },
            },
        });
        if (!post) {
            return api.error(res, "Bài viết không tồn tại", 404);
        }
        const parsed = {
            ...post,
            tags: typeof post.tags === "string" ? JSON.parse(post.tags) : post.tags,
        };
        return api.success(res, parsed);
    }
    catch (err) {
        return api.error(res, "Lỗi server", 500);
    }
}
// ═══════════════════════ CMS (yêu cầu đăng nhập) ═══════════════════════
// GET /api/posts/admin/all?page=1&limit=20&status=DRAFT
async function listAllPosts(req, res) {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const status = req.query.status;
        const search = req.query.search;
        const skip = (page - 1) * limit;
        const where = {};
        if (status && status !== "ALL")
            where.status = status;
        if (search) {
            where.OR = [
                { title: { contains: search } },
                { tags: { string_contains: search } },
            ];
        }
        const [posts, total] = await Promise.all([
            database_1.default.post.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
                include: {
                    author: { select: { fullName: true } },
                },
            }),
            database_1.default.post.count({ where }),
        ]);
        const parsed = posts.map((p) => ({
            ...p,
            tags: typeof p.tags === "string" ? JSON.parse(p.tags) : p.tags,
        }));
        return api.paginated(res, parsed, total, page, limit);
    }
    catch (err) {
        return api.error(res, "Lỗi server", 500);
    }
}
// GET /api/posts/admin/:id
async function getPostById(req, res) {
    try {
        const post = await database_1.default.post.findUnique({
            where: { id: req.params.id },
            include: { author: { select: { fullName: true } } },
        });
        if (!post) {
            return api.error(res, "Bài viết không tồn tại", 404);
        }
        const parsed = {
            ...post,
            tags: typeof post.tags === "string" ? JSON.parse(post.tags) : post.tags,
        };
        return api.success(res, parsed);
    }
    catch (err) {
        return api.error(res, "Lỗi server", 500);
    }
}
// POST /api/posts
async function createPost(req, res) {
    try {
        const { title, excerpt, content, tags, status } = req.body;
        if (!title || !content) {
            return api.error(res, "Tiêu đề và nội dung không được để trống");
        }
        // Tạo slug từ title
        let slug = (0, slugify_1.default)(title, { lower: true, strict: true, locale: "vi" });
        // Đảm bảo slug unique
        const existing = await database_1.default.post.findUnique({ where: { slug } });
        if (existing) {
            slug = `${slug}-${Date.now()}`;
        }
        // Xử lý thumbnail
        const thumbnailUrl = req.file ? `/uploads/blog/${req.file.filename}` : null;
        // Ước tính readTime
        const textOnly = content.replace(/<[^>]*>/g, "");
        const wordCount = textOnly.split(/\s+/).filter(Boolean).length;
        const readTime = Math.max(1, Math.ceil(wordCount / 200));
        const post = await database_1.default.post.create({
            data: {
                authorId: req.user.userId,
                title,
                slug,
                excerpt: excerpt || null,
                content,
                thumbnailUrl,
                tags: typeof tags === "string" ? tags : JSON.stringify(tags || []),
                status: status || "DRAFT",
            },
            include: { author: { select: { fullName: true } } },
        });
        const parsed = {
            ...post,
            tags: typeof post.tags === "string" ? JSON.parse(post.tags) : post.tags,
            readTime: `${readTime} phút đọc`,
        };
        return api.created(res, parsed, "Tạo bài viết thành công");
    }
    catch (err) {
        console.error("Create post error:", err);
        return api.error(res, "Lỗi server", 500);
    }
}
// PUT /api/posts/:id
async function updatePost(req, res) {
    try {
        const { id } = req.params;
        const { title, excerpt, content, tags, status } = req.body;
        const existing = await database_1.default.post.findUnique({ where: { id } });
        if (!existing) {
            return api.error(res, "Bài viết không tồn tại", 404);
        }
        const updateData = {};
        if (title && title !== existing.title) {
            updateData.title = title;
            let newSlug = (0, slugify_1.default)(title, { lower: true, strict: true, locale: "vi" });
            const slugExists = await database_1.default.post.findFirst({
                where: { slug: newSlug, NOT: { id } },
            });
            if (slugExists)
                newSlug = `${newSlug}-${Date.now()}`;
            updateData.slug = newSlug;
        }
        if (excerpt !== undefined)
            updateData.excerpt = excerpt;
        if (content !== undefined)
            updateData.content = content;
        if (status !== undefined)
            updateData.status = status;
        if (tags !== undefined) {
            updateData.tags = typeof tags === "string" ? tags : JSON.stringify(tags);
        }
        // Thumbnail mới (nếu upload)
        if (req.file) {
            updateData.thumbnailUrl = `/uploads/blog/${req.file.filename}`;
        }
        const post = await database_1.default.post.update({
            where: { id },
            data: updateData,
            include: { author: { select: { fullName: true } } },
        });
        const parsed = {
            ...post,
            tags: typeof post.tags === "string" ? JSON.parse(post.tags) : post.tags,
        };
        return api.success(res, parsed, "Cập nhật bài viết thành công");
    }
    catch (err) {
        console.error("Update post error:", err);
        return api.error(res, "Lỗi server", 500);
    }
}
// DELETE /api/posts/:id
async function deletePost(req, res) {
    try {
        const { id } = req.params;
        const existing = await database_1.default.post.findUnique({ where: { id } });
        if (!existing) {
            return api.error(res, "Bài viết không tồn tại", 404);
        }
        await database_1.default.post.delete({ where: { id } });
        return api.success(res, null, "Xoá bài viết thành công");
    }
    catch (err) {
        return api.error(res, "Lỗi server", 500);
    }
}
// POST /api/posts/upload-image
async function uploadContentImage(req, res) {
    try {
        if (!req.file) {
            return api.error(res, "Không có file nào được upload");
        }
        const imageUrl = `/uploads/blog/${req.file.filename}`;
        return api.success(res, { url: imageUrl }, "Upload ảnh thành công");
    }
    catch (err) {
        return api.error(res, "Lỗi upload", 500);
    }
}
//# sourceMappingURL=post.controller.js.map