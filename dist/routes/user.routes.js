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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * FILE: user.routes.ts
 * PATH: apps/api/src/routes/user.routes.ts
 * MÔ TẢ: Routes quản lý tài khoản — ADMIN + TEACHER
 */
const multer_1 = __importDefault(require("multer"));
const import_controller_1 = require("../controllers/import.controller");
const uploadCSV = (0, multer_1.default)({ dest: "uploads/temp/" }).single("file");
const express_1 = require("express");
const user = __importStar(require("../controllers/user.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// ADMIN + TEACHER có thể xem danh sách
router.get("/", (0, role_middleware_1.authorize)("ADMIN", "TEACHER"), user.listUsers);
router.get("/:id", (0, role_middleware_1.authorize)("ADMIN", "TEACHER"), user.getUserById);
// ADMIN tạo mọi loại, TEACHER chỉ tạo STUDENT
router.post("/", (0, role_middleware_1.authorize)("ADMIN", "TEACHER"), user.createUser);
router.post("/bulk-create", (0, role_middleware_1.authorize)("ADMIN", "TEACHER"), user.bulkCreateStudents);
// Chỉ ADMIN mới sửa/khoá tài khoản
router.put("/:id", (0, role_middleware_1.authorize)("ADMIN"), user.updateUser);
router.patch("/:id/toggle-status", (0, role_middleware_1.authorize)("ADMIN"), user.toggleStatus);
// Admin import học viên từ CSV
router.post("/import-csv", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)("ADMIN"), uploadCSV, import_controller_1.importStudentsFromCSV);
exports.default = router;
//# sourceMappingURL=user.routes.js.map