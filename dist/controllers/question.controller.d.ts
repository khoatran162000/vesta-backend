/**
 * FILE: question.controller.ts
 * PATH: apps/api/src/controllers/question.controller.ts
 * MÔ TẢ: Quản lý câu hỏi — list by exam, create, update, delete, reorder
 */
import { Request, Response } from "express";
type Params = {
    [key: string]: string;
};
export declare function listQuestions(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getQuestionById(req: Request<Params>, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function createQuestion(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function updateQuestion(req: Request<Params>, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function deleteQuestion(req: Request<Params>, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function reorderQuestions(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export {};
