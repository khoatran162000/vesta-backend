// FILE: src/routes/workCalendar.routes.ts — /work-calendar (đăng nhập; dùng chung nhân sự)
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import * as pc from "../controllers/personalCalendar.controller";
const router = Router();
router.use(authenticate);
router.get("/", pc.getWorkCalendar);
router.put("/", pc.saveWorkCalendar);
export default router;
