import { Request, Response } from "express";
export declare const listReports: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMyReports: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getReport: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createReport: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateReport: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteReport: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
