// FILE: src/routes/index.ts — Tất cả routes (cập nhật mới)
import { Router } from "express";
import authRoutes from "./auth.routes";
import postRoutes from "./post.routes";
import userRoutes from "./user.routes";
import categoryRoutes from "./category.routes";
import examRoutes from "./exam.routes";
import questionRoutes from "./question.routes";
import attemptRoutes from "./attempt.routes";
import notificationRoutes from "./notification.routes";
import studentRoutes from "./student.routes";
import registerRoutes from "./register.routes";
import classContentRoutes from "./classContent.routes";
import consultationRoutes from "./consultation.routes";
import interactiveRoutes from "./interactive.routes";
import scheduleRoutes from "./schedule.routes";
import reportRoutes from "./report.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/posts", postRoutes);
router.use("/users", userRoutes);
router.use("/categories", categoryRoutes);
router.use("/exams", examRoutes);
router.use("/questions", questionRoutes);
router.use("/attempts", attemptRoutes);
router.use("/notifications", notificationRoutes);
router.use("/student", studentRoutes);
router.use("/register", registerRoutes);
router.use("/class", classContentRoutes);
router.use("/consultation", consultationRoutes);
router.use("/interactive", interactiveRoutes);
router.use("/schedule", scheduleRoutes);
router.use("/reports", reportRoutes);

router.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;