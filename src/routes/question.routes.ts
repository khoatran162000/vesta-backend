/**
 * FILE: question.routes.ts
 * PATH: apps/api/src/routes/question.routes.ts
 * MÔ TẢ: Routes quản lý câu hỏi — GV XEM, chỉ ADMIN sửa
 */

import { Router } from "express";
import * as question from "../controllers/question.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";

const router = Router();
const staff = ["ADMIN", "TEACHER"];

router.use(authenticate);

// Xem: ADMIN + TEACHER (GV cần xem đề + đáp án để dạy)
router.get("/", authorize(...staff), question.listQuestions);
router.get("/:id", authorize(...staff), question.getQuestionById);

// Sửa nội dung: CHỈ ADMIN
router.post("/", authorize("ADMIN"), question.createQuestion);
router.put("/reorder", authorize("ADMIN"), question.reorderQuestions);
router.put("/:id", authorize("ADMIN"), question.updateQuestion);
router.delete("/:id", authorize("ADMIN"), question.deleteQuestion);

export default router;