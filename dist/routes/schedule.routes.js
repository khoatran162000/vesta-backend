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
// FILE: src/routes/schedule.routes.ts
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const sc = __importStar(require("../controllers/schedule.controller"));
const router = (0, express_1.Router)();
const staff = ["ADMIN", "TEACHER"];
// Public: list + detail (ai cũng xem được lịch)
router.get("/", sc.listSchedules);
router.get("/:id", sc.getSchedule);
// Admin/Teacher: CRUD lịch học
router.post("/", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)(...staff), sc.createSchedule);
router.put("/:id", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)(...staff), sc.updateSchedule);
router.delete("/:id", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)(...staff), sc.deleteSchedule);
// Admin/Teacher: Tổng hợp kết quả học sinh
router.get("/reports/students", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)(...staff), sc.getStudentReport);
exports.default = router;
//# sourceMappingURL=schedule.routes.js.map