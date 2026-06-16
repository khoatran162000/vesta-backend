// FILE: src/routes/report.routes.ts
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import * as rp from "../controllers/report.controller";
const router = Router();
const staff = ["ADMIN", "TEACHER"];

// Student: báo cáo của mình (đặt TRƯỚC /:id để không bị nuốt)
router.get("/my", authenticate, rp.getMyReports);

// Staff: danh sách + CRUD
router.get("/", authenticate, authorize(...staff), rp.listReports);
router.post("/", authenticate, authorize(...staff), rp.createReport);
router.put("/:id", authenticate, authorize(...staff), rp.updateReport);
router.delete("/:id", authenticate, authorize(...staff), rp.deleteReport);

// Detail: cả staff lẫn student (controller tự kiểm tra quyền)
router.get("/:id", authenticate, rp.getReport);

export default router;