// FILE: src/controllers/register.controller.ts — Đăng ký học viên mới (PUBLIC)

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/** Bỏ dấu tiếng Việt */
function removeDiacritics(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
}

/**
 * Tạo mã học viên: vesta{MM}{YY}{tên}{chữ đầu các từ còn lại}
 * VD: Trần Ngọc Khoa (05/2026) → vesta0526khoant
 *     Lê Hương Ly (05/2026) → vesta0526lyhl
 */
function generateCode(fullName: string): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = String(now.getFullYear()).slice(-2);

  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) {
    return `vesta${mm}${yy}${removeDiacritics(parts[0]).toLowerCase()}`;
  }

  // Tên (từ cuối)
  const firstName = removeDiacritics(parts[parts.length - 1]).toLowerCase();
  // Đệm (các từ giữa) → lấy chữ cái đầu
  const middleInits = parts.slice(1, -1).map((p) => removeDiacritics(p)[0].toLowerCase()).join("");
  // Họ (từ đầu) → lấy chữ cái đầu
  const lastInit = removeDiacritics(parts[0])[0].toLowerCase();

  return `vesta${mm}${yy}${firstName}${middleInits}${lastInit}`;
}

/**
 * POST /api/register — Đăng ký học viên (PUBLIC, không cần auth)
 * Body: { fullName, email, phone, cccd?, course?, studyMode?, notes? }
 */
export const registerStudent = async (req: Request, res: Response) => {
  try {
    const { fullName, email, phone, cccd, course, studyMode, notes } = req.body;

    // Validate
    if (!fullName?.trim()) return res.status(400).json({ success: false, message: "Vui lòng nhập họ và tên" });
    if (!email?.trim()) return res.status(400).json({ success: false, message: "Vui lòng nhập email" });
    if (!phone?.trim()) return res.status(400).json({ success: false, message: "Vui lòng nhập số điện thoại" });

    // Kiểm tra trùng
    const dupEmail = await prisma.user.findFirst({ where: { email: email.trim() } });
    if (dupEmail) return res.status(400).json({ success: false, message: "Email đã được sử dụng" });

    const dupPhone = await prisma.user.findFirst({ where: { phone: phone.trim() } });
    if (dupPhone) return res.status(400).json({ success: false, message: "Số điện thoại đã được đăng ký" });

    // Tạo mã học viên (unique)
    let studentCode = generateCode(fullName.trim());
    let exists = await prisma.user.findFirst({ where: { studentCode } });
    let suffix = 1;
    while (exists) {
      studentCode = `${generateCode(fullName.trim())}${suffix}`;
      exists = await prisma.user.findFirst({ where: { studentCode } });
      suffix++;
    }

    // Tạo tài khoản — password = số điện thoại
    const rawPassword = phone.trim();
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const student = await prisma.user.create({
      data: {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        studentCode,
        passwordHash,
        role: "STUDENT",
        isActive: true,
        cccd: cccd?.trim() || null,
        course: course || null,
        studyMode: studyMode || null,
        notes: notes?.trim() || null,
        regStatus: "TEST", // Mặc định: chờ test
      },
    });

    // Tạo notification chào mừng
    try {
      await prisma.notification.create({
        data: {
          userId: student.id,
          title: "🎉 Chào mừng đến VESTA UNI!",
          message: `Chào ${fullName.trim()}, chúc mừng bạn đã gia nhập. Mã học viên: ${studentCode}. Hãy làm bài kiểm tra trình độ để bắt đầu!`,
          type: "SYSTEM_AUTO",
        },
      });
    } catch {}

    // Log thông tin (thay bằng gửi email khi cấu hình SMTP)
    console.log(`\n✅ Học viên mới: ${fullName.trim()}`);
    console.log(`   Mã HV: ${studentCode}`);
    console.log(`   Pass:  ${rawPassword}\n`);

    return res.status(201).json({
      success: true,
      message: "Đăng ký thành công!",
      data: {
        id: student.id,
        fullName: student.fullName,
        email: student.email,
        phone: student.phone,
        studentCode,
        password: rawPassword, // Hiện 1 lần duy nhất cho học viên lưu
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};