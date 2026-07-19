// FILE: src/routes/student.routes.ts — Routes hoàn chỉnh cho Student Portal
// GHI ĐÈ file hiện tại
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import * as student from "../controllers/student.controller";

const router = Router();

// Tất cả endpoints yêu cầu đăng nhập
router.use(authenticate);

// ─── Dashboard ───
router.get("/dashboard", student.getDashboard);
router.get("/progress", student.getProgress);

// ─── Exam Browsing ───
router.get("/categories", student.getCategories);
router.get("/exams", student.getExams);

// ─── Exam Engine ───
router.post("/exams/:examId/start", student.startExam);
router.get("/attempts/:attemptId", student.getAttempt);
router.put("/attempts/:attemptId/save", student.saveAnswers);
router.post("/attempts/:attemptId/submit", student.submitExam);

// ─── History & Review ───
router.get("/history", student.getHistory);
router.get("/history/:attemptId", student.getAttemptReview);

// ─── Notifications ───
router.get("/notifications", student.getNotifications);
router.patch("/notifications/read-all", student.markAllRead);

export default router;