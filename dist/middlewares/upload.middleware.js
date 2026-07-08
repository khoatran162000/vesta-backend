"use strict";
/**
 * FILE: upload.middleware.ts
 * PATH: apps/api/src/middlewares/upload.middleware.ts
 * MÔ TẢ: Cấu hình Multer upload ảnh — blog thumbnails + content images + avatars
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAvatar = exports.uploadImages = exports.uploadThumbnail = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE || "10485760"); // 10MB
// Storage config
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, path_1.default.join(UPLOAD_DIR, "blog"));
    },
    filename: (_req, file, cb) => {
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        cb(null, `${(0, uuid_1.v4)()}${ext}`);
    },
});
// File filter — chỉ cho phép ảnh
function fileFilter(_req, file, cb) {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error("Chỉ chấp nhận file ảnh (JPEG, PNG, WebP, GIF)"));
    }
}
// Upload single thumbnail
exports.uploadThumbnail = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: { fileSize: MAX_SIZE },
}).single("thumbnail");
// Upload multiple images (for blog content)
exports.uploadImages = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: { fileSize: MAX_SIZE },
}).array("images", 10);
// Upload avatar
const avatarStorage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, path_1.default.join(UPLOAD_DIR, "avatars"));
    },
    filename: (_req, file, cb) => {
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        cb(null, `${(0, uuid_1.v4)()}${ext}`);
    },
});
exports.uploadAvatar = (0, multer_1.default)({
    storage: avatarStorage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single("avatar");
//# sourceMappingURL=upload.middleware.js.map