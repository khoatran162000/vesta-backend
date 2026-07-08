/**
 * FILE: post.controller.ts
 * PATH: apps/api/src/controllers/post.controller.ts
 * MÔ TẢ: CRUD bài viết blog — list, detail, create, update, delete, upload image
 */
import { Request, Response } from "express";
type Params = {
    [key: string]: string;
};
export declare function listPosts(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getPostBySlug(req: Request<Params>, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function listAllPosts(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getPostById(req: Request<Params>, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function createPost(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function updatePost(req: Request<Params>, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function deletePost(req: Request<Params>, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function uploadContentImage(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export {};
