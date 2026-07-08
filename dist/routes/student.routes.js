"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// FILE: src/routes/student.routes.ts — Routes hoàn chỉnh cho Student Portal
// GHI ĐÈ file hiện tại
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const student = __importStar(require("../controllers/student.controller"));
const router = (0, express_1.Router)();
// Tất cả endpoints yêu cầu đăng nhập
router.use(auth_middleware_1.authenticate);
// ─── Dashboard ───
router.get("/dashboard", student.getDashboard);
// ─── Exam Browsing ───
router.get("/categories", student.getCategories);
router.get("/exams", student.getExams);
// ─── Exam Engine ───
router.post("/exams/:examId/start", student.startExam);
router.put("/attempts/:attemptId/save", student.saveAnswers);
router.post("/attempts/:attemptId/submit", student.submitExam);
// ─── History & Review ───
router.get("/history", student.getHistory);
router.get("/history/:attemptId", student.getAttemptReview);
// ─── Notifications ───
router.get("/notifications", student.getNotifications);
router.patch("/notifications/read-all", student.markAllRead);
exports.default = router;
//# sourceMappingURL=student.routes.js.map