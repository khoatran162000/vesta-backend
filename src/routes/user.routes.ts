/**
 * FILE: user.routes.ts
 * PATH: apps/api/src/routes/user.routes.ts
 * MÔ TẢ: Routes quản lý tài khoản — ADMIN + TEACHER
 */
import multer from "multer";
import { importStudentsFromCSV } from "../controllers/import.controller";
const uploadCSV = multer({ dest: "uploads/temp/" }).single("file");
import { Router } from "express";
import * as user from "../controllers/user.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
const router = Router();
router.use(authenticate);

// ADMIN + TEACHER có thể xem danh sách
router.get("/", authorize("ADMIN", "TEACHER"), user.listUsers);

// ADMIN tạo mọi loại
router.post("/", authorize("ADMIN"), user.createUser);
router.post("/bulk-create", authorize("ADMIN"), user.bulkCreateStudents);

// ── Route "chữ cố định" PHẢI đứng TRÊN các route /:id (không thì bị nuốt thành id) ──
router.patch("/bulk-reg-status", authorize("ADMIN"), user.bulkSetRegStatus);
router.post("/bulk-delete", authorize("ADMIN"), user.bulkDeleteUsers);

// Route có :id
router.get("/:id", authorize("ADMIN", "TEACHER"), user.getUserById);
router.put("/:id", authorize("ADMIN"), user.updateUser);
router.patch("/:id/toggle-status", authorize("ADMIN"), user.toggleStatus);
router.post("/:id/reset-password", authorize("ADMIN"), user.resetPassword);
router.delete("/:id/hard", authorize("ADMIN"), user.deleteUserHard);
router.patch("/:id/unlock", authorize("ADMIN"), user.unlockStudent);

// Admin import học viên từ CSV
router.post("/import-csv", authenticate, authorize("ADMIN"), uploadCSV, importStudentsFromCSV);

export default router;