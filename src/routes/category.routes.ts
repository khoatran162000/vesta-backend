/**
 * FILE: category.routes.ts
 * PATH: apps/api/src/routes/category.routes.ts
 * MÔ TẢ: Routes quản lý danh mục đề thi — GV XEM, chỉ ADMIN sửa
 */

import { Router } from "express";
import * as category from "../controllers/category.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";

const router = Router();
const staff = ["ADMIN", "TEACHER"];

router.use(authenticate);

router.get("/", authorize(...staff), category.listCategories);
router.get("/flat", authorize(...staff), category.listCategoriesFlat);
router.get("/:id", authorize(...staff), category.getCategoryById);

router.post("/", authorize("ADMIN"), category.createCategory);
router.put("/:id", authorize("ADMIN"), category.updateCategory);
router.delete("/:id", authorize("ADMIN"), category.deleteCategory);

export default router;