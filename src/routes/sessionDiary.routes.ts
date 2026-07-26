// FILE: src/routes/sessionDiary.routes.ts
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import * as diary from "../controllers/sessionDiary.controller";

const router = Router();
const staff = ["ADMIN", "TEACHER"];

router.get("/list", authenticate, authorize(...staff), diary.listSessionDiaries);
router.get("/", authenticate, authorize(...staff), diary.getSessionDiary);
router.post("/", authenticate, authorize(...staff), diary.saveSessionDiary);
router.delete("/:id", authenticate, authorize(...staff), diary.deleteSessionDiary);

export default router;