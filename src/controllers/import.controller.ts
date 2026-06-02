// FILE: src/controllers/import.controller.ts — Import học viên từ CSV (Admin only)
// Thêm route: router.post("/import-csv", authenticate, authorize("ADMIN"), uploadCSV, importStudentsFromCSV);
// Trong user.routes.ts hoặc tạo import.routes.ts

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";

const prisma = new PrismaClient();

function removeDiacritics(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
}

function generateCode(fullName: string): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = String(now.getFullYear()).slice(-2);
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return `vesta${mm}${yy}${removeDiacritics(parts[0]).toLowerCase()}`;
  const firstName = removeDiacritics(parts[parts.length - 1]).toLowerCase();
  const middleInits = parts.slice(1, -1).map((p) => removeDiacritics(p)[0].toLowerCase()).join("");
  const lastInit = removeDiacritics(parts[0])[0].toLowerCase();
  return `vesta${mm}${yy}${firstName}${middleInits}${lastInit}`;
}

// Column name mapping (Vietnamese → English)
const COL_MAP: Record<string, string> = {
  "Họ và tên": "fullName", "Ho va ten": "fullName", "fullName": "fullName", "name": "fullName", "Tên": "fullName",
  "Email": "email", "EMAIL": "email", "email": "email",
  "SĐT": "phone", "SDT": "phone", "Số điện thoại": "phone", "phone": "phone", "Phone": "phone",
  "CCCD": "cccd", "cccd": "cccd",
  "Khoá học": "course", "Khoa hoc": "course", "course": "course", "Khóa học": "course",
  "Hình thức học": "studyMode", "studyMode": "studyMode", "HÌNH THỨC HỌC": "studyMode",
  "Ghi chú": "notes", "notes": "notes", "NOTES": "notes", "NOTE KHÁC": "notes",
};

function mapHeaders(rawHeaders: string[]): string[] {
  return rawHeaders.map((h) => {
    const clean = h.trim().replace(/"/g, "").replace(/^\uFEFF/, "");
    return COL_MAP[clean] || clean;
  });
}

export const importStudentsFromCSV = async (req: Request, res: Response) => {
  try {
    const file = (req as any).file;
    if (!file) return res.status(400).json({ success: false, message: "Vui lòng upload file CSV" });

    const content = fs.readFileSync(file.path, "utf-8");
    fs.unlinkSync(file.path); // cleanup

    const lines = content.split("\n").filter((l) => l.trim());
    if (lines.length < 2) return res.status(400).json({ success: false, message: "File CSV trống hoặc không hợp lệ" });

    const rawHeaders = lines[0].split(",");
    const headers = mapHeaders(rawHeaders);

    const results = { success: 0, failed: 0, errors: [] as any[], accounts: [] as any[] };

    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""));
      const row: any = {};
      headers.forEach((h, j) => { row[h] = vals[j] || ""; });

      const fullName = row.fullName?.trim();
      const phone = row.phone?.trim();
      const email = row.email?.trim();

      // Validate
      if (!fullName) {
        results.failed++;
        results.errors.push({ row: i + 1, name: "???", reason: "Thiếu họ tên" });
        continue;
      }
      if (!phone) {
        results.failed++;
        results.errors.push({ row: i + 1, name: fullName, reason: "Thiếu số điện thoại" });
        continue;
      }

      // Check duplicates
      if (email) {
        const dup = await prisma.user.findFirst({ where: { email } });
        if (dup) { results.failed++; results.errors.push({ row: i + 1, name: fullName, reason: `Email ${email} đã tồn tại` }); continue; }
      }
      const dupPhone = await prisma.user.findFirst({ where: { phone } });
      if (dupPhone) { results.failed++; results.errors.push({ row: i + 1, name: fullName, reason: `SĐT ${phone} đã tồn tại` }); continue; }

      // Generate unique code
      let studentCode = generateCode(fullName);
      let exists = await prisma.user.findFirst({ where: { studentCode } });
      let suffix = 1;
      while (exists) { studentCode = `${generateCode(fullName)}${suffix}`; exists = await prisma.user.findFirst({ where: { studentCode } }); suffix++; }

      // Create account
      try {
        const passwordHash = await bcrypt.hash(phone, 10);
        await prisma.user.create({
          data: {
            fullName,
            email: email || undefined,
            phone,
            studentCode,
            passwordHash,
            role: "STUDENT",
            isActive: true,
            cccd: row.cccd?.trim() || undefined,
            course: row.course?.trim() || undefined,
            studyMode: row.studyMode?.trim() || undefined,
            notes: row.notes?.trim() || undefined,
            regStatus: "CONFIRMED",
          },
        });
        results.success++;
        results.accounts.push({ fullName, studentCode, password: phone, email });
      } catch (err: any) {
        results.failed++;
        results.errors.push({ row: i + 1, name: fullName, reason: err.message?.slice(0, 80) || "Lỗi tạo tài khoản" });
      }
    }

    console.log(`\n📥 Import CSV: ${results.success} thành công, ${results.failed} lỗi\n`);
    return res.json({ success: true, data: results });
  } catch (error) {
    console.error("Import CSV error:", error);
    return res.status(500).json({ success: false, message: "Lỗi xử lý file" });
  }
};