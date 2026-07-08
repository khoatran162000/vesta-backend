"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// FILE: src/routes/register.routes.ts — Route đăng ký học viên (PUBLIC)
const express_1 = require("express");
const register_controller_1 = require("../controllers/register.controller");
const router = (0, express_1.Router)();
// PUBLIC — không cần đăng nhập
router.post("/", register_controller_1.registerStudent);
exports.default = router;
//# sourceMappingURL=register.routes.js.map