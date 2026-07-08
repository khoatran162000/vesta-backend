/**
 * FILE: category.controller.ts
 * PATH: apps/api/src/controllers/category.controller.ts
 * MÔ TẢ: Quản lý Categories (cấu trúc cây) — list tree, create, update, delete
 */
import { Request, Response } from "express";
type Params = {
    [key: string]: string;
};
export declare function listCategories(_req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function listCategoriesFlat(_req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getCategoryById(req: Request<Params>, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function createCategory(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function updateCategory(req: Request<Params>, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function deleteCategory(req: Request<Params>, res: Response): Promise<Response<any, Record<string, any>>>;
export {};
