import { Request, Response } from "express";
export declare const importStudentsFromCSV: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
