// FILE: src/routes/book.routes.ts
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import * as bc from "../controllers/book.controller";

const router = Router();
const staff = ["ADMIN", "TEACHER"];

router.get("/", bc.listBooks);
router.get("/:id", authenticate, authorize(...staff), bc.getBook);
// Sách & giáo trình = nội dung: chỉ ADMIN sửa
router.post("/", authenticate, authorize("ADMIN"), bc.createBook);
router.put("/:id", authenticate, authorize("ADMIN"), bc.updateBook);
router.delete("/:id", authenticate, authorize("ADMIN"), bc.deleteBook);

export default router;