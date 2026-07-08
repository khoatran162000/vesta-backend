/**
 * FILE: apiResponse.ts
 * PATH: apps/api/src/utils/apiResponse.ts
 * MÔ TẢ: Format response thống nhất cho toàn bộ API
 */
import { Response } from "express";
export declare function success(res: Response, data: any, message?: string, statusCode?: number): Response<any, Record<string, any>>;
export declare function created(res: Response, data: any, message?: string): Response<any, Record<string, any>>;
export declare function paginated(res: Response, data: any[], total: number, page: number, limit: number, message?: string): Response<any, Record<string, any>>;
export declare function error(res: Response, message: string, statusCode?: number, errors?: any): Response<any, Record<string, any>>;
