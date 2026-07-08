import { Request, Response } from "express";
type Params = {
    [key: string]: string;
};
export declare function listUsers(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getUserById(req: Request<Params>, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function createUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function updateUser(req: Request<Params>, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function toggleStatus(req: Request<Params>, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function bulkCreateStudents(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export {};
