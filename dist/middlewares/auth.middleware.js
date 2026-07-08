"use strict";
/**
 * FILE: auth.middleware.ts
 * PATH: apps/api/src/middlewares/auth.middleware.ts
 * MÔ TẢ: Xác thực JWT token — gắn user info vào req.user
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const jwt_1 = require("../utils/jwt");
const apiResponse_1 = require("../utils/apiResponse");
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return (0, apiResponse_1.error)(res, "Không có token xác thực", 401);
    }
    const token = authHeader.split(" ")[1];
    try {
        const payload = (0, jwt_1.verifyAccessToken)(token);
        req.user = payload;
        next();
    }
    catch (err) {
        return (0, apiResponse_1.error)(res, "Token không hợp lệ hoặc đã hết hạn", 401);
    }
}
//# sourceMappingURL=auth.middleware.js.map