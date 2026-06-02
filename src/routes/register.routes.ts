// FILE: src/routes/register.routes.ts — Route đăng ký học viên (PUBLIC)
import { Router } from "express";
import { registerStudent } from "../controllers/register.controller";

const router = Router();

// PUBLIC — không cần đăng nhập
router.post("/", registerStudent);

export default router;