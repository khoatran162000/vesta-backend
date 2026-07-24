// FILE: src/routes/attendance.routes.ts
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import * as att from "../controllers/attendance.controller";
const router = Router();
const staff = ["ADMIN", "TEACHER"];
// Student: lịch sử đi học của chính mình (đặt trước các route staff)
router.get("/my", authenticate, att.getMyAttendance);
// Staff: điểm danh
router.get("/sessions", authenticate, authorize(...staff), att.listSessions);
router.get("/", authenticate, authorize(...staff), att.getClassAttendance);
router.post("/mark", authenticate, authorize(...staff), att.markAttendance);
router.post("/mark-all", authenticate, authorize(...staff), att.markAllAttendance);
export default router;