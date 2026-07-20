// FILE: src/routes/siteContent.routes.ts
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import { uploadSiteFiles } from "../middlewares/upload.middleware";
import * as sc from "../controllers/siteContent.controller";

const router = Router();
// Nội dung trang chủ = CMS, cùng nhóm với bài viết blog (post.routes dùng cmsRoles)
const cmsRoles = ["ADMIN", "CONTENT_CREATOR"];

router.get("/", sc.listSiteContent);
router.get("/:key", sc.getSiteContent);
router.put("/:key", authenticate, authorize(...cmsRoles), uploadSiteFiles, sc.upsertSiteContent);

export default router;