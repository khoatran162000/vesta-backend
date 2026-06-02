// FILE: src/routes/schedule.routes.ts
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import * as sc from "../controllers/schedule.controller";

const router = Router();
const staff = ["ADMIN", "TEACHER"];

// Public: list + detail (ai cũng xem được lịch)
router.get("/", sc.listSchedules);
router.get("/:id", sc.getSchedule);

// Admin/Teacher: CRUD lịch học
router.post("/", authenticate, authorize(...staff), sc.createSchedule);
router.put("/:id", authenticate, authorize(...staff), sc.updateSchedule);
router.delete("/:id", authenticate, authorize(...staff), sc.deleteSchedule);

// Admin/Teacher: Tổng hợp kết quả học sinh
router.get("/reports/students", authenticate, authorize(...staff), sc.getStudentReport);

export default router;