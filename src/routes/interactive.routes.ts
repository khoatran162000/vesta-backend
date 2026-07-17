// FILE: src/routes/interactive.routes.ts
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { optionalAuthenticate } from "../middlewares/optionalAuth.middleware";
import { authorize } from "../middlewares/role.middleware";
import * as ix from "../controllers/interactive.controller";

const router = Router();
const staff = ["ADMIN", "TEACHER"];

// Public: list (filter theo role nếu đã login)
router.get("/", optionalAuthenticate, ix.listExercises);
router.get("/:id", optionalAuthenticate, ix.getExercise);
router.post("/:id/check", ix.checkExercisePublic);  // Public chấm bài không lưu (khách)

// Student: submit + xem attempts
router.post("/:id/submit", authenticate, ix.submitExercise);
router.get("/my/attempts", authenticate, ix.getMyAttempts);

// Admin/Teacher: CRUD
router.get("/:id/attempts", authenticate, authorize(...staff), ix.getExerciseAttempts);
// Bài tập = nội dung của trung tâm: chỉ ADMIN tạo/sửa/xoá
router.post("/", authenticate, authorize("ADMIN"), ix.createExercise);
router.put("/:id", authenticate, authorize("ADMIN"), ix.updateExercise);
router.delete("/:id", authenticate, authorize("ADMIN"), ix.deleteExercise);

export default router;
