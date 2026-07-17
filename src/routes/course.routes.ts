// FILE: src/routes/course.routes.ts
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import * as cc from "../controllers/course.controller";

const router = Router();
const staff = ["ADMIN", "TEACHER"];

router.get("/", cc.listCourses);
router.get("/:id", authenticate, authorize(...staff), cc.getCourse);
// Nội dung khoá học: chỉ ADMIN sửa
router.post("/", authenticate, authorize("ADMIN"), cc.createCourse);
router.put("/:id", authenticate, authorize("ADMIN"), cc.updateCourse);
router.delete("/:id", authenticate, authorize("ADMIN"), cc.deleteCourse);

export default router;