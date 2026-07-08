import { Request, Response } from "express";
type Params = {
    [key: string]: string;
};
export declare function listAttempts(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getAttemptById(req: Request<Params>, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getStudentStats(req: Request<Params>, res: Response): Promise<Response<any, Record<string, any>>>;
export {};
