// FILE: src/routes/level.routes.ts
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import * as lv from "../controllers/level.controller";
const router = Router();
router.get("/", lv.listLevels);                                   // public đọc
// Trình độ = cấu hình hệ thống: chỉ ADMIN
router.post("/", authenticate, authorize("ADMIN"), lv.createLevel);
router.put("/:id", authenticate, authorize("ADMIN"), lv.updateLevel);
router.delete("/:id", authenticate, authorize("ADMIN"), lv.deleteLevel);
export default router;