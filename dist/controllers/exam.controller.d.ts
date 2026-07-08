/**
 * FILE: exam.controller.ts
 * PATH: apps/api/src/controllers/exam.controller.ts
 * MÔ TẢ: Quản lý đề thi — list, create, update, delete, toggle publish
 */
import { Request, Response } from "express";
type Params = {
    [key: string]: string;
};
export declare function listExams(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getExamById(req: Request<Params>, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function createExam(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function updateExam(req: Request<Params>, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function deleteExam(req: Request<Params>, res: Response): Promise<Response<any, Record<string, any>>>;
export {};
