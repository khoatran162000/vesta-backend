// FILE: src/routes/report.routes.ts
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import { uploadReportImageFile } from "../middlewares/upload.middleware";
import * as rp from "../controllers/report.controller";
const router = Router();
const staff = ["ADMIN", "TEACHER"];
// PUBLIC: link chia sẻ cho phụ huynh — KHÔNG cần đăng nhập. Đặt trước mọi route khác.
router.get("/share/:token", rp.getShareReport);
// Student: báo cáo của mình (đặt TRƯỚC /:id)
router.get("/my", authenticate, rp.getMyReports);
// Staff: upload ảnh báo cáo (đặt trước các route động)
router.post("/upload-image", authenticate, authorize(...staff), uploadReportImageFile, rp.uploadReportImage);
// Staff: danh sách + CRUD
router.get("/", authenticate, authorize(...staff), rp.listReports);
router.post("/", authenticate, authorize(...staff), rp.createReport);
router.put("/:id", authenticate, authorize(...staff), rp.updateReport);
router.delete("/:id", authenticate, authorize(...staff), rp.deleteReport);
// Detail: cả staff lẫn student
router.get("/:id", authenticate, rp.getReport);
export default router;