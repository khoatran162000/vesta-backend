import { Request, Response } from "express";
export declare const listBooks: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getBook: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createBook: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateBook: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteBook: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
