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
// FILE: src/routes/classContent.routes.ts — GHI ĐÈ
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const cc = __importStar(require("../controllers/classContent.controller"));
const router = (0, express_1.Router)();
const staff = ["ADMIN", "TEACHER"];
// ── Nhật ký buổi học ──
router.get("/diaries", auth_middleware_1.authenticate, cc.listDiaries);
router.post("/diaries", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)(...staff), cc.createDiary);
router.put("/diaries/:id", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)(...staff), cc.updateDiary);
router.delete("/diaries/:id", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)(...staff), cc.deleteDiary);
// ── Tài liệu ──
router.get("/materials", auth_middleware_1.authenticate, cc.listMaterials);
router.post("/materials", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)(...staff), cc.createMaterial);
router.put("/materials/:id", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)(...staff), cc.updateMaterial);
router.delete("/materials/:id", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)(...staff), cc.deleteMaterial);
// ── Feedback / Vở ghi ──
router.post("/feedback/submit", auth_middleware_1.authenticate, cc.submitWork); // Student nộp bài
router.get("/feedback/my", auth_middleware_1.authenticate, cc.getMyFeedback); // Student xem feedback của mình
router.get("/feedback", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)(...staff), cc.listFeedback); // Admin xem tất cả
// ── MỚI: theo từng học viên (đặt TRƯỚC /feedback/:id/review để tránh nhầm route) ──
router.get("/feedback/student/:studentId", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)(...staff), cc.getStudentFeedback); // Xem vở ghi của 1 HV
router.post("/feedback/create-for-student", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)(...staff), cc.createFeedbackForStudent); // GV tạo nhận xét
router.put("/feedback/:id/review", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)(...staff), cc.reviewFeedback); // GV chấm
router.delete("/feedback/:id", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)(...staff), cc.deleteFeedback); // GV xoá nhận xét
exports.default = router;
//# sourceMappingURL=classContent.routes.js.map