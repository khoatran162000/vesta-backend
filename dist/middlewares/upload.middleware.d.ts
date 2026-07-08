/**
 * FILE: upload.middleware.ts
 * PATH: apps/api/src/middlewares/upload.middleware.ts
 * MÔ TẢ: Cấu hình Multer upload ảnh — blog thumbnails + content images + avatars
 */
export declare const uploadThumbnail: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const uploadImages: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const uploadAvatar: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
