"use strict";
// FILE: src/app.ts — Entry point + cronjob scheduler
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const routes_1 = __importDefault(require("./routes"));
const scheduler_1 = require("./jobs/scheduler");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// ═══════════════════════ MIDDLEWARE ═══════════════════════
app.use((0, helmet_1.default)({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
const corsOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((s) => s.trim());
app.use((0, cors_1.default)({
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
app.use((0, cookie_parser_1.default)());
app.use((0, compression_1.default)());
app.set("trust proxy", true);
if (process.env.NODE_ENV === "development") {
    app.use((0, morgan_1.default)("dev"));
}
else {
    app.use((0, morgan_1.default)("combined"));
}
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, message: "Quá nhiều request, vui lòng thử lại sau." },
});
app.use("/api/auth/login", (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, message: "Quá nhiều lần đăng nhập, vui lòng thử lại sau 15 phút." },
}));
app.use("/api", limiter);
// ═══════════════════════ STATIC FILES ═══════════════════════
app.use("/uploads", express_1.default.static(path_1.default.join(process.cwd(), "uploads")));
// ═══════════════════════ ROUTES ═══════════════════════
app.use("/api", routes_1.default);
// ═══════════════════════ ERROR HANDLING ═══════════════════════
app.use((_req, res) => {
    res.status(404).json({ success: false, message: "Route không tồn tại" });
});
app.use((err, _req, res, _next) => {
    console.error("Unhandled error:", err);
    if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ success: false, message: "File quá lớn. Tối đa 10MB." });
    }
    if (err.message?.includes("Chỉ chấp nhận file ảnh")) {
        return res.status(400).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: "Lỗi server" });
});
// ═══════════════════════ START SERVER ═══════════════════════
app.listen(PORT, () => {
    console.log(`
  ╔══════════════════════════════════════════╗
  ║   🔥 VESTA API đang chạy!               ║
  ║   Port: ${PORT}                             ║
  ║   Mode: ${process.env.NODE_ENV || "development"}                  ║
  ║   API:  http://localhost:${PORT}/api        ║
  ╚══════════════════════════════════════════╝
  `);
    // Khởi động cronjob scheduler
    (0, scheduler_1.startScheduler)();
});
exports.default = app;
//# sourceMappingURL=app.js.map