// FILE: src/routes/consultation.routes.ts
import { Router } from "express";
import {
  submitConsultation,
  listConsultations,
  countNewConsultations,
  updateConsultation,
  deleteConsultation,
} from "../controllers/consultation.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";

const router = Router();

router.post("/", submitConsultation); // PUBLIC — landing gửi yêu cầu

// ── ADMIN: xem & quản lý yêu cầu tư vấn ──
router.get("/count", authenticate, authorize("ADMIN"), countNewConsultations); // badge sidebar
router.get("/", authenticate, authorize("ADMIN"), listConsultations);
router.patch("/:id", authenticate, authorize("ADMIN"), updateConsultation);
router.delete("/:id", authenticate, authorize("ADMIN"), deleteConsultation);

export default router;