// FILE: src/routes/book.routes.ts
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import * as bc from "../controllers/book.controller";

const router = Router();
const staff = ["ADMIN", "TEACHER"];

router.get("/", bc.listBooks);
router.get("/:id", authenticate, authorize(...staff), bc.getBook);
router.post("/", authenticate, authorize(...staff), bc.createBook);
router.put("/:id", authenticate, authorize(...staff), bc.updateBook);
router.delete("/:id", authenticate, authorize(...staff), bc.deleteBook);

export default router;