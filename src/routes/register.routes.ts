// FILE: src/routes/register.routes.ts — Route đăng ký học viên
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import { registerStudent } from "../controllers/register.controller";

const router = Router();

// Chỉ ADMIN — chị chốt: GV không được tạo tài khoản học viên.
// Route này trước để PUBLIC nhưng KHÔNG landing/student nào gọi (đã grep),
// chỉ trang admin "Tạo hàng loạt" dùng → khoá lại an toàn.
// Không khoá thì siết POST /users thành vô nghĩa: GV gọi thẳng /api/register là xong.
router.post("/", authenticate, authorize("ADMIN"), registerStudent);

export default router;