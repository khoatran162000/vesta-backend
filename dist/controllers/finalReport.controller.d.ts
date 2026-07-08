import { Request, Response } from "express";
export declare const getShareReport: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const listFinalReports: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMyFinalReports: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getFinalReport: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createFinalReport: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateFinalReport: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteFinalReport: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
