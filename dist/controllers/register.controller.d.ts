import { Request, Response } from "express";
/**
 * POST /api/register — Đăng ký học viên (PUBLIC, không cần auth)
 * Body: { fullName, email, phone, cccd?, course?, studyMode?, notes? }
 */
export declare const registerStudent: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
