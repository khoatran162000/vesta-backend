"use strict";
/**
 * FILE: post.routes.ts
 * PATH: apps/api/src/routes/post.routes.ts
 * MÔ TẢ: Routes cho bài viết blog — public (đọc) + CMS (CRUD, upload)
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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const post = __importStar(require("../controllers/post.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const router = (0, express_1.Router)();
const cmsRoles = ["ADMIN", "CONTENT_CREATOR"];
// ═══════ PUBLIC — Trang blog đọc bài ═══════
router.get("/", post.listPosts);
router.get("/detail/:slug", post.getPostBySlug);
// ═══════ CMS — Quản trị bài viết (yêu cầu đăng nhập) ═══════
router.get("/admin/all", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)(...cmsRoles), post.listAllPosts);
router.get("/admin/:id", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)(...cmsRoles), post.getPostById);
router.post("/", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)(...cmsRoles), upload_middleware_1.uploadThumbnail, post.createPost);
router.put("/:id", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)(...cmsRoles), upload_middleware_1.uploadThumbnail, post.updatePost);
router.delete("/:id", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)(...cmsRoles), post.deletePost);
// Upload ảnh trong nội dung bài viết (TipTap editor)
router.post("/upload-image", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)(...cmsRoles), upload_middleware_1.uploadImages, post.uploadContentImage);
exports.default = router;
//# sourceMappingURL=post.routes.js.map