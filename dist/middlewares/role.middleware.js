"use strict";
/**
 * FILE: role.middleware.ts
 * PATH: apps/api/src/middlewares/role.middleware.ts
 * MÔ TẢ: Kiểm tra quyền theo role — dùng sau authenticate middleware
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = authorize;
const apiResponse_1 = require("../utils/apiResponse");
function authorize(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return (0, apiResponse_1.error)(res, "Chưa xác thực", 401);
        }
        if (!allowedRoles.includes(req.user.role)) {
            return (0, apiResponse_1.error)(res, "Bạn không có quyền thực hiện hành động này", 403);
        }
        next();
    };
}
//# sourceMappingURL=role.middleware.js.map