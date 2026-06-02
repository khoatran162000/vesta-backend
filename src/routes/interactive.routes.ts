// FILE: src/routes/interactive.routes.ts
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import * as ix from "../controllers/interactive.controller";

const router = Router();
const staff = ["ADMIN", "TEACHER"];

// Public: list (filter theo role nếu đã login)
router.get("/", ix.listExercises);
router.get("/:id", ix.getExercise);
router.post("/:id/check", ix.checkExercisePublic);  // Public chấm bài không lưu (khách)

// Student: submit + xem attempts
router.post("/:id/submit", authenticate, ix.submitExercise);
router.get("/my/attempts", authenticate, ix.getMyAttempts);

// Admin/Teacher: CRUD
router.post("/", authenticate, authorize(...staff), ix.createExercise);
router.put("/:id", authenticate, authorize(...staff), ix.updateExercise);
router.delete("/:id", authenticate, authorize(...staff), ix.deleteExercise);

export default router;
