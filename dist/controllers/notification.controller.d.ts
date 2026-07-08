import { Request, Response } from "express";
type Params = {
    [key: string]: string;
};
export declare function listNotifications(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function sendNotification(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function markAsRead(req: Request<Params>, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function markAllAsRead(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function listSentNotifications(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export {};
