// FILE: src/routes/classContent.routes.ts — GHI ĐÈ
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import * as cc from "../controllers/classContent.controller";

const router = Router();
const staff = ["ADMIN", "TEACHER"];

// ── Nhật ký buổi học ──
router.get("/diaries", authenticate, cc.listDiaries);
router.post("/diaries", authenticate, authorize(...staff), cc.createDiary);
router.put("/diaries/:id", authenticate, authorize(...staff), cc.updateDiary);
router.delete("/diaries/:id", authenticate, authorize(...staff), cc.deleteDiary);

// ── Tài liệu ──
router.get("/materials", authenticate, cc.listMaterials);
router.post("/materials", authenticate, authorize(...staff), cc.createMaterial);
router.put("/materials/:id", authenticate, authorize(...staff), cc.updateMaterial);
router.delete("/materials/:id", authenticate, authorize(...staff), cc.deleteMaterial);

// ── Feedback / Vở ghi ──
router.post("/feedback/submit", authenticate, cc.submitWork);              // Student nộp bài
router.get("/feedback/my", authenticate, cc.getMyFeedback);                // Student xem feedback của mình
router.get("/feedback", authenticate, authorize(...staff), cc.listFeedback);  // Admin xem tất cả

// ── MỚI: theo từng học viên (đặt TRƯỚC /feedback/:id/review để tránh nhầm route) ──
router.get("/feedback/student/:studentId", authenticate, authorize(...staff), cc.getStudentFeedback);   // Xem vở ghi của 1 HV
router.post("/feedback/create-for-student", authenticate, authorize(...staff), cc.createFeedbackForStudent); // GV tạo nhận xét

router.put("/feedback/:id/review", authenticate, authorize(...staff), cc.reviewFeedback); // GV chấm

router.delete("/feedback/:id", authenticate, authorize(...staff), cc.deleteFeedback); // GV xoá nhận xét

export default router;
