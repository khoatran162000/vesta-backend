import { Request, Response } from "express";
export declare const listSchedules: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getSchedule: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createSchedule: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateSchedule: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteSchedule: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getStudentReport: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
