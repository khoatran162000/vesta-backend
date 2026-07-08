"use strict";
/**
 * FILE: apiResponse.ts
 * PATH: apps/api/src/utils/apiResponse.ts
 * MÔ TẢ: Format response thống nhất cho toàn bộ API
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.success = success;
exports.created = created;
exports.paginated = paginated;
exports.error = error;
function success(res, data, message = "Success", statusCode = 200) {
    return res.status(statusCode).json({ success: true, message, data });
}
function created(res, data, message = "Created") {
    return success(res, data, message, 201);
}
function paginated(res, data, total, page, limit, message = "Success") {
    return res.status(200).json({
        success: true,
        message,
        data,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
}
function error(res, message, statusCode = 400, errors) {
    return res.status(statusCode).json({ success: false, message, errors });
}
//# sourceMappingURL=apiResponse.js.map