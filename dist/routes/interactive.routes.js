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
// FILE: src/routes/interactive.routes.ts
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const ix = __importStar(require("../controllers/interactive.controller"));
const router = (0, express_1.Router)();
const staff = ["ADMIN", "TEACHER"];
// Public: list (filter theo role nếu đã login)
router.get("/", ix.listExercises);
router.get("/:id", ix.getExercise);
router.post("/:id/check", ix.checkExercisePublic); // Public chấm bài không lưu (khách)
// Student: submit + xem attempts
router.post("/:id/submit", auth_middleware_1.authenticate, ix.submitExercise);
router.get("/my/attempts", auth_middleware_1.authenticate, ix.getMyAttempts);
// Admin/Teacher: CRUD
router.get("/:id/attempts", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)(...staff), ix.getExerciseAttempts);
router.post("/", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)(...staff), ix.createExercise);
router.put("/:id", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)(...staff), ix.updateExercise);
router.delete("/:id", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)(...staff), ix.deleteExercise);
exports.default = router;
//# sourceMappingURL=interactive.routes.js.map