"use strict";
// FILE: src/controllers/auth.controller.ts — Login bang email (Staff) HOAC studentCode (Student)
// CẬP NHẬT: getMe() trả thêm course + regStatus để Student Portal phân biệt paid/unpaid
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
exports.uploadAvatar = void 0;
exports.login = login;
exports.refreshToken = refreshToken;
exports.getMe = getMe;
exports.updateProfile = updateProfile;
exports.changePassword = changePassword;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = __importDefault(require("../config/database"));
const jwt_1 = require("../utils/jwt");
const api = __importStar(require("../utils/apiResponse"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
// ═══════════════════════ LOGIN ═══════════════════════
async function login(req, res) {
    try {
        const { email, studentCode, password } = req.body;
        if (!password) {
            return api.error(res, "Mật khẩu không được để trống");
        }
        if (!email && !studentCode) {
            return api.error(res, "Vui lòng nhập Email hoặc Mã học viên");
        }
        let user;
        if (studentCode) {
            user = await database_1.default.user.findUnique({ where: { studentCode } });
            if (!user)
                return api.error(res, "Mã học viên không tồn tại", 401);
        }
        else {
            user = await database_1.default.user.findUnique({ where: { email } });
            if (!user)
                return api.error(res, "Email không tồn tại", 401);
        }
        if (!user.isActive) {
            return api.error(res, "Tài khoản đã bị khoá. Liên hệ quản trị viên.", 403);
        }
        const isValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isValid)
            return api.error(res, "Mật khẩu không đúng", 401);
        const tokens = (0, jwt_1.generateTokenPair)({ userId: user.id, role: user.role });
        return api.success(res, {
            ...tokens,
            user: {
                id: user.id,
                email: user.email,
                studentCode: user.studentCode,
                fullName: user.fullName,
                role: user.role,
                avatarUrl: user.avatarUrl,
                course: user.course, // ← THÊM
                regStatus: user.regStatus, // ← THÊM
            },
        });
    }
    catch (err) {
        console.error("Login error:", err);
        return api.error(res, "Lỗi server", 500);
    }
}
// ═══════════════════════ REFRESH TOKEN ═══════════════════════
async function refreshToken(req, res) {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken)
            return api.error(res, "Refresh token không được để trống");
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || "refresh-secret");
        const user = await database_1.default.user.findUnique({ where: { id: decoded.userId } });
        if (!user || !user.isActive)
            return api.error(res, "Token không hợp lệ", 401);
        const tokens = (0, jwt_1.generateTokenPair)({ userId: user.id, role: user.role });
        return api.success(res, tokens);
    }
    catch (err) {
        return api.error(res, "Refresh token không hợp lệ hoặc đã hết hạn", 401);
    }
}
// ═══════════════════════ GET CURRENT USER ═══════════════════════
async function getMe(req, res) {
    try {
        const user = await database_1.default.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true, email: true, studentCode: true, fullName: true,
                phone: true, address: true, role: true, avatarUrl: true,
                isActive: true, createdAt: true,
                // ─── THÊM FIELDS HỌC VIÊN ───
                course: true,
                regStatus: true,
                studyMode: true,
                cccd: true,
                startDate: true,
            },
        });
        if (!user)
            return api.error(res, "Không tìm thấy tài khoản", 404);
        return api.success(res, user);
    }
    catch (err) {
        return api.error(res, "Lỗi server", 500);
    }
}
// ═══════════════════════ UPDATE PROFILE ═══════════════════════
const avatarStorage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, "uploads/avatars"),
    filename: (_req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path_1.default.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});
exports.uploadAvatar = (0, multer_1.default)({
    storage: avatarStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith("image/"))
            cb(null, true);
        else
            cb(new Error("Chỉ chấp nhận file ảnh"), false);
    },
}).single("avatar");
async function updateProfile(req, res) {
    try {
        const { fullName, phone, address } = req.body;
        const updateData = {};
        if (fullName)
            updateData.fullName = fullName;
        if (phone !== undefined)
            updateData.phone = phone || null;
        if (address !== undefined)
            updateData.address = address || null;
        if (req.file)
            updateData.avatarUrl = `/uploads/avatars/${req.file.filename}`;
        const user = await database_1.default.user.update({
            where: { id: req.user.userId },
            data: updateData,
            select: {
                id: true, email: true, studentCode: true, fullName: true,
                phone: true, address: true, role: true, avatarUrl: true,
            },
        });
        return api.success(res, user, "Cập nhật profile thành công");
    }
    catch (err) {
        return api.error(res, "Lỗi server", 500);
    }
}
// ═══════════════════════ CHANGE PASSWORD ═══════════════════════
async function changePassword(req, res) {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword)
            return api.error(res, "Mật khẩu cũ và mới không được để trống");
        if (newPassword.length < 6)
            return api.error(res, "Mật khẩu mới tối thiểu 6 ký tự");
        const user = await database_1.default.user.findUnique({ where: { id: req.user.userId } });
        if (!user)
            return api.error(res, "Không tìm thấy tài khoản", 404);
        const isValid = await bcryptjs_1.default.compare(currentPassword, user.passwordHash);
        if (!isValid)
            return api.error(res, "Mật khẩu hiện tại không đúng", 400);
        const newHash = await bcryptjs_1.default.hash(newPassword, 12);
        await database_1.default.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });
        return api.success(res, null, "Đổi mật khẩu thành công");
    }
    catch (err) {
        return api.error(res, "Lỗi server", 500);
    }
}
//# sourceMappingURL=auth.controller.js.map