/**
 * FILE: upload.middleware.ts
 * PATH: apps/api/src/middlewares/upload.middleware.ts
 * MÔ TẢ: Cấu hình Multer upload ảnh — blog thumbnails + content images + avatars
 */

import multer from "multer";
import path from "path";
import { v4 as uuid } from "uuid";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE || "10485760"); // 10MB

// Storage config
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(UPLOAD_DIR, "blog"));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuid()}${ext}`);
  },
});

// File filter — chỉ cho phép ảnh
function fileFilter(_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ chấp nhận file ảnh (JPEG, PNG, WebP, GIF)"));
  }
}

// Upload single thumbnail
export const uploadThumbnail = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE },
}).single("thumbnail");

// Upload multiple images (for blog content)
export const uploadImages = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE },
}).array("images", 10);

// Upload avatar
const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(UPLOAD_DIR, "avatars"));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuid()}${ext}`);
  },
});

export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single("avatar");

// Storage cho logo/favicon → uploads/logo/
const logoStorage = multer.diskStorage({
  destination: (_req, file, cb) => {
    // thumbnail (QR) vẫn vào blog/, logo+favicon vào logo/
    const sub = file.fieldname === "thumbnail" ? "blog" : "logo";
    cb(null, path.join(UPLOAD_DIR, sub));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".png";
    cb(null, `${uuid()}${ext}`);
  },
});
// Upload cho site-content: QR (thumbnail) + logo + favicon
export const uploadSiteFiles = multer({
  storage: logoStorage,
  fileFilter,
  limits: { fileSize: MAX_SIZE },
}).fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "logo", maxCount: 1 },
  { name: "favicon", maxCount: 1 },
]);