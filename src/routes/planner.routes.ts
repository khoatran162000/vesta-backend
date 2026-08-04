// FILE: src/routes/planner.routes.ts
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import * as planner from "../controllers/planner.controller";
import { carryOverPlanner } from "../controllers/planner.controller";
const router = Router();
// Xem: mọi tài khoản đăng nhập. Sửa: chỉ ADMIN.
router.get("/", authenticate, planner.getPlanner);
router.post("/", authenticate, authorize("ADMIN"), planner.createPlanner);
router.patch("/", authenticate, authorize("ADMIN"), planner.updatePlanner);
router.post("/carry-over", authenticate, authorize("ADMIN"), carryOverPlanner);
router.delete("/", authenticate, authorize("ADMIN"), planner.deletePlanner);
export default router;