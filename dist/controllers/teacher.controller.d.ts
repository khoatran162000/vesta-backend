import { Request, Response } from "express";
export declare const listTeachers: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getTeacher: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createTeacher: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateTeacher: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteTeacher: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
