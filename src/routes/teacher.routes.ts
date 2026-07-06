// FILE: src/routes/teacher.routes.ts
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import { uploadThumbnail } from "../middlewares/upload.middleware";
import * as tc from "../controllers/teacher.controller";

const router = Router();
const staff = ["ADMIN", "TEACHER"];

router.get("/", tc.listTeachers);
router.get("/:id", authenticate, authorize(...staff), tc.getTeacher);
router.post("/", authenticate, authorize(...staff), uploadThumbnail, tc.createTeacher);
router.put("/:id", authenticate, authorize(...staff), uploadThumbnail, tc.updateTeacher);
router.delete("/:id", authenticate, authorize(...staff), tc.deleteTeacher);

export default router;