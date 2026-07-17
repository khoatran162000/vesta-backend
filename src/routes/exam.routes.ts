/**
 * FILE: exam.routes.ts
 * PATH: apps/api/src/routes/exam.routes.ts
 * MÔ TẢ: Routes quản lý đề thi — GV XEM, chỉ ADMIN sửa
 */

import { Router } from "express";
import * as exam from "../controllers/exam.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";

const router = Router();
const staff = ["ADMIN", "TEACHER"];

router.use(authenticate);

router.get("/", authorize(...staff), exam.listExams);
router.get("/:id", authorize(...staff), exam.getExamById);

router.post("/", authorize("ADMIN"), exam.createExam);
router.put("/:id", authorize("ADMIN"), exam.updateExam);
router.delete("/:id", authorize("ADMIN"), exam.deleteExam);

export default router;