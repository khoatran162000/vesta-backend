"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// FILE: src/routes/report.routes.ts
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const rp = __importStar(require("../controllers/report.controller"));
const router = (0, express_1.Router)();
const staff = ["ADMIN", "TEACHER"];
// Student: báo cáo của mình (đặt TRƯỚC /:id để không bị nuốt)
router.get("/my", auth_middleware_1.authenticate, rp.getMyReports);
// Staff: danh sách + CRUD
router.get("/", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)(...staff), rp.listReports);
router.post("/", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)(...staff), rp.createReport);
router.put("/:id", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)(...staff), rp.updateReport);
router.delete("/:id", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)(...staff), rp.deleteReport);
// Detail: cả staff lẫn student (controller tự kiểm tra quyền)
router.get("/:id", auth_middleware_1.authenticate, rp.getReport);
exports.default = router;
//# sourceMappingURL=report.routes.js.map