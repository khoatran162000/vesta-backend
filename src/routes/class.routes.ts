// FILE: src/routes/class.routes.ts
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import * as cls from "../controllers/class.controller";
const router = Router();
const staff = ["ADMIN", "TEACHER"];
// Public — KHÔNG auth. Phải đặt trước "/:id" để không bị nuốt.
router.get("/public", cls.listPublicClasses);
router.get("/", authenticate, authorize(...staff), cls.listClasses);
router.post("/", authenticate, authorize(...staff), cls.createClass);
router.get("/:id", authenticate, authorize(...staff), cls.getClass);
router.put("/:id", authenticate, authorize(...staff), cls.updateClass);
router.delete("/:id", authenticate, authorize(...staff), cls.deleteClass);
router.post("/:id/enroll", authenticate, authorize(...staff), cls.enrollStudents);
router.delete("/:id/students/:studentId", authenticate, authorize(...staff), cls.unenrollStudent);
router.put("/:id/students/:studentId", authenticate, authorize(...staff), cls.updateEnrollment);
export default router;