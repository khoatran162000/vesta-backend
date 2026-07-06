// FILE: src/routes/course.routes.ts
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import * as cc from "../controllers/course.controller";

const router = Router();
const staff = ["ADMIN", "TEACHER"];

router.get("/", cc.listCourses);
router.get("/:id", authenticate, authorize(...staff), cc.getCourse);
router.post("/", authenticate, authorize(...staff), cc.createCourse);
router.put("/:id", authenticate, authorize(...staff), cc.updateCourse);
router.delete("/:id", authenticate, authorize(...staff), cc.deleteCourse);

export default router;