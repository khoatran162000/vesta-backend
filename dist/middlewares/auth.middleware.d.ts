/**
 * FILE: auth.middleware.ts
 * PATH: apps/api/src/middlewares/auth.middleware.ts
 * MÔ TẢ: Xác thực JWT token — gắn user info vào req.user
 */
import { Request, Response, NextFunction } from "express";
import { TokenPayload } from "../utils/jwt";
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}
export declare function authenticate(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
