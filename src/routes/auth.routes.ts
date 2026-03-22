/**
 * FILE: auth.routes.ts
 * PATH: apps/api/src/routes/auth.routes.ts
 * MÔ TẢ: Routes cho xác thực — login, refresh, me, profile, change-password
 */

import { Router } from "express";
import * as auth from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { uploadAvatar } from "../middlewares/upload.middleware";

const router = Router();

// Public
router.post("/login", auth.login);
router.post("/refresh", auth.refresh);

// Protected
router.get("/me", authenticate, auth.getMe);
router.put("/profile", authenticate, uploadAvatar, auth.updateProfile);
router.put("/change-password", authenticate, auth.changePassword);

export default router;