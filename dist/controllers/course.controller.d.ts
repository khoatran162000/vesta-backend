import { Request, Response } from "express";
export declare const listCourses: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getCourse: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createCourse: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateCourse: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteCourse: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
