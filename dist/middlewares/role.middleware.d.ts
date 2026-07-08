/**
 * FILE: role.middleware.ts
 * PATH: apps/api/src/middlewares/role.middleware.ts
 * MÔ TẢ: Kiểm tra quyền theo role — dùng sau authenticate middleware
 */
import { Request, Response, NextFunction } from "express";
export declare function authorize(...allowedRoles: string[]): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
