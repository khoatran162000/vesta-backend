"use strict";
// FILE: src/controllers/notification.controller.ts — Gui thong bao: ca nhan, nhom, tat ca
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
exports.listNotifications = listNotifications;
exports.sendNotification = sendNotification;
exports.markAsRead = markAsRead;
exports.markAllAsRead = markAllAsRead;
exports.listSentNotifications = listSentNotifications;
const database_1 = __importDefault(require("../config/database"));
const api = __importStar(require("../utils/apiResponse"));
// GET /api/notifications?userId=xxx&page=1&limit=20
async function listNotifications(req, res) {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const userId = req.query.userId || req.user.userId;
        const skip = (page - 1) * limit;
        const [notifications, total, unreadCount] = await Promise.all([
            database_1.default.notification.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            database_1.default.notification.count({ where: { userId } }),
            database_1.default.notification.count({ where: { userId, isRead: false } }),
        ]);
        return res.json({
            success: true,
            data: notifications,
            unreadCount,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        });
    }
    catch (err) {
        return api.error(res, "Lỗi server", 500);
    }
}
// POST /api/notifications/send
// Body: { title, message, type?, userIds?, sendToAll? }
async function sendNotification(req, res) {
    try {
        const { userIds, title, message, type, sendToAll } = req.body;
        if (!title || !message) {
            return api.error(res, "Tiêu đề và nội dung không được để trống");
        }
        let targetIds = [];
        if (sendToAll) {
            // Gửi tất cả học viên đang hoạt động
            const students = await database_1.default.user.findMany({
                where: { role: "STUDENT", isActive: true },
                select: { id: true },
            });
            targetIds = students.map((s) => s.id);
        }
        else if (userIds && Array.isArray(userIds) && userIds.length > 0) {
            // Gửi cho danh sách cụ thể
            targetIds = userIds;
        }
        else {
            return api.error(res, "Chưa chọn người nhận. Chọn userIds hoặc sendToAll.");
        }
        if (targetIds.length === 0) {
            return api.error(res, "Không tìm thấy người nhận nào");
        }
        const notifications = await database_1.default.notification.createMany({
            data: targetIds.map((userId) => ({
                userId,
                title,
                message,
                type: type || "TEACHER_WARNING",
                isRead: false,
            })),
        });
        return api.created(res, { sent: notifications.count }, `Đã gửi thông báo đến ${notifications.count} người`);
    }
    catch (err) {
        console.error("Send notification error:", err);
        return api.error(res, "Lỗi server", 500);
    }
}
// PATCH /api/notifications/:id/read
async function markAsRead(req, res) {
    try {
        const id = req.params.id;
        await database_1.default.notification.update({
            where: { id },
            data: { isRead: true },
        });
        return api.success(res, null, "Đã đánh dấu đã đọc");
    }
    catch (err) {
        return api.error(res, "Lỗi server", 500);
    }
}
// PATCH /api/notifications/read-all
async function markAllAsRead(req, res) {
    try {
        await database_1.default.notification.updateMany({
            where: { userId: req.user.userId, isRead: false },
            data: { isRead: true },
        });
        return api.success(res, null, "Đã đánh dấu tất cả đã đọc");
    }
    catch (err) {
        return api.error(res, "Lỗi server", 500);
    }
}
// GET /api/notifications/admin/sent — Xem lịch sử thông báo đã gửi (Admin/Teacher)
async function listSentNotifications(req, res) {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;
        const [notifications, total] = await Promise.all([
            database_1.default.notification.findMany({
                where: { type: "TEACHER_WARNING" },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
                include: {
                    user: { select: { fullName: true, email: true } },
                },
            }),
            database_1.default.notification.count({ where: { type: "TEACHER_WARNING" } }),
        ]);
        return api.paginated(res, notifications, total, page, limit);
    }
    catch (err) {
        return api.error(res, "Lỗi server", 500);
    }
}
//# sourceMappingURL=notification.controller.js.map