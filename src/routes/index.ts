/**
 * FILE: index.ts
 * PATH: apps/api/src/routes/index.ts
 * MÔ TẢ: Tổng hợp tất cả routes — mount vào /api prefix
 */

import { Router } from "express";
import authRoutes from "./auth.routes";
import postRoutes from "./post.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/posts", postRoutes);

// Health check
router.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;