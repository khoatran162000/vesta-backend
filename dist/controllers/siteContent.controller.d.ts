import { Request, Response } from "express";
export declare const listSiteContent: (_req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getSiteContent: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const upsertSiteContent: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
