"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// FILE: src/routes/consultation.routes.ts
const express_1 = require("express");
const consultation_controller_1 = require("../controllers/consultation.controller");
const router = (0, express_1.Router)();
router.post("/", consultation_controller_1.submitConsultation); // PUBLIC
exports.default = router;
//# sourceMappingURL=consultation.routes.js.map