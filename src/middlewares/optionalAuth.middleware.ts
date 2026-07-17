/**
 * FILE: optionalAuth.middleware.ts
 * MÔ TẢ: Gắn req.user NẾU có token hợp lệ; không có token vẫn cho qua.
 * Dùng cho route vừa phục vụ khách vãng lai, vừa cần biết role khi đã đăng nhập
 * (vd: GET /interactive/:id — khách xem bài không đáp án, staff xem kèm đáp án).
 */
import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";

export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      req.user = verifyAccessToken(authHeader.split(" ")[1]);
    } catch {
      // token hỏng / hết hạn → coi như khách, KHÔNG chặn request
    }
  }
  next();
}