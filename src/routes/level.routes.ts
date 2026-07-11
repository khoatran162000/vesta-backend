// FILE: src/routes/level.routes.ts
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import * as lv from "../controllers/level.controller";
const router = Router();
const staff = ["ADMIN", "TEACHER"];
router.get("/", lv.listLevels);                                   // public đọc
router.post("/", authenticate, authorize(...staff), lv.createLevel);
router.put("/:id", authenticate, authorize(...staff), lv.updateLevel);
router.delete("/:id", authenticate, authorize(...staff), lv.deleteLevel);
export default router;