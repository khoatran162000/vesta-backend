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
// Hồ sơ GV hiện trên landing = nội dung: chỉ ADMIN sửa
router.post("/", authenticate, authorize("ADMIN"), uploadThumbnail, tc.createTeacher);
router.put("/:id", authenticate, authorize("ADMIN"), uploadThumbnail, tc.updateTeacher);
router.delete("/:id", authenticate, authorize("ADMIN"), tc.deleteTeacher);

export default router;