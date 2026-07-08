/**
 * FILE: database.ts
 * PATH: apps/api/src/config/database.ts
 * MÔ TẢ: Prisma Client singleton — tránh tạo nhiều connection khi dev
 */
import { PrismaClient } from "@prisma/client";
export declare const prisma: PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export default prisma;
