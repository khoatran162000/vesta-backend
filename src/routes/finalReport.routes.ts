// FILE: src/routes/finalReport.routes.ts
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import * as fr from "../controllers/finalReport.controller";
const router = Router();
const staff = ["ADMIN", "TEACHER"];

// PUBLIC: link chia sẻ cho phụ huynh — KHÔNG cần đăng nhập. Đặt trước mọi route khác.
router.get("/share/:token", fr.getShareReport);

router.get("/my", authenticate, fr.getMyFinalReports);
router.get("/", authenticate, authorize(...staff), fr.listFinalReports);
router.post("/", authenticate, authorize(...staff), fr.createFinalReport);
router.put("/:id", authenticate, authorize(...staff), fr.updateFinalReport);
router.delete("/:id", authenticate, authorize(...staff), fr.deleteFinalReport);
router.get("/:id", authenticate, fr.getFinalReport);
export default router;