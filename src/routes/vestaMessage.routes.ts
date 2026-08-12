// FILE: src/routes/vestaMessage.routes.ts — Tâm sự với Vesta (admin đọc/trả lời)
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import * as vm from "../controllers/vestaMessage.controller";
const router = Router();
router.use(authenticate);
router.get("/count-new", authorize("ADMIN", "TEACHER"), vm.countNew);
router.get("/", authorize("ADMIN", "TEACHER"), vm.listAllMessages);
router.patch("/:id", authorize("ADMIN", "TEACHER"), vm.updateMessage);
export default router;
