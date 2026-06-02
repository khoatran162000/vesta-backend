// FILE: src/routes/consultation.routes.ts
import { Router } from "express";
import { submitConsultation } from "../controllers/consultation.controller";

const router = Router();
router.post("/", submitConsultation); // PUBLIC
export default router;