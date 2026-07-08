import { Request, Response } from "express";
type Params = {
    [key: string]: string;
};
export declare function getDashboard(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getCategories(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getExams(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function startExam(req: Request<Params>, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function saveAnswers(req: Request<Params>, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function submitExam(req: Request<Params>, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getHistory(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getAttemptReview(req: Request<Params>, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getNotifications(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function markAllRead(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export {};
