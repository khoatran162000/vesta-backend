// FILE: src/routes/personalCalendar.routes.ts — /personal-calendar (yêu cầu đăng nhập)
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import * as pc from "../controllers/personalCalendar.controller";
const router = Router();
router.use(authenticate);
router.get("/", pc.getMyCalendar);
router.put("/", pc.saveMyCalendar);
export default router;
