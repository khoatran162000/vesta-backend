// FILE: src/routes/material.routes.ts
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import { uploadMaterialFile } from "../middlewares/upload.middleware";
import * as m from "../controllers/material.controller";
const router = Router();
const cms = ["ADMIN", "CONTENT_CREATOR"];

// Tài liệu — public đọc
router.get("/materials", m.listMaterials);
router.get("/materials/:id/download", m.downloadFreeMaterial);
// Tài liệu — admin CRUD
router.post("/materials", authenticate, authorize(...cms), uploadMaterialFile, m.createMaterial);
router.put("/materials/:id", authenticate, authorize(...cms), uploadMaterialFile, m.updateMaterial);
router.delete("/materials/:id", authenticate, authorize(...cms), m.deleteMaterial);

// Đơn hàng — public tạo + tra
router.post("/orders", m.createOrder);
router.get("/orders/track", m.trackOrder);
// Đơn hàng — admin quản lý
router.get("/orders", authenticate, authorize(...cms), m.listOrders);
router.patch("/orders/:id", authenticate, authorize(...cms), uploadMaterialFile, m.updateOrder);

export default router;