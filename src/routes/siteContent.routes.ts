// FILE: src/routes/siteContent.routes.ts
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import { uploadThumbnail } from "../middlewares/upload.middleware";
import * as sc from "../controllers/siteContent.controller";

const router = Router();
const staff = ["ADMIN", "TEACHER"];

router.get("/", sc.listSiteContent);
router.get("/:key", sc.getSiteContent);
router.put("/:key", authenticate, authorize(...staff), uploadThumbnail, sc.upsertSiteContent);

export default router;