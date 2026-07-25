// FILE: src/controllers/consultation.controller.ts — Đặt lịch tư vấn (lưu DB + log + email)
import { Request, Response } from "express";
import prisma from "../config/database";
import * as api from "../utils/apiResponse";

type Params = { [key: string]: string };

// POST /api/consultation — PUBLIC: landing gửi yêu cầu tư vấn
export const submitConsultation = async (req: Request, res: Response) => {
  try {
    const { name, phone, email, question, preferredTime } = req.body;
    if (!name || !phone) return res.status(400).json({ success: false, message: "Thiếu họ tên hoặc SĐT" });

    // 1) Lưu DB để admin xem lại (nguồn chính)
    try {
      await prisma.consultation.create({
        data: {
          name: String(name).trim(),
          phone: String(phone).trim(),
          email: email ? String(email).trim() : null,
          preferredTime: preferredTime || null,
          question: question || null,
        },
      });
    } catch (dbErr) {
      console.error("  ⚠ Lưu consultation vào DB thất bại:", dbErr);
    }

    // 2) Log ra console (luôn hoạt động)
    console.log(`\n📅 YÊU CẦU TƯ VẤN MỚI:`);
    console.log(`   Họ tên: ${name}`);
    console.log(`   SĐT: ${phone}`);
    console.log(`   Email: ${email || "—"}`);
    console.log(`   Thời gian: ${preferredTime || "—"}`);
    console.log(`   Câu hỏi: ${question || "—"}\n`);

    // 3) Gửi email nếu đã cấu hình SMTP
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      try {
        const nodemailer = require("nodemailer");
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || "587"),
          secure: process.env.SMTP_SECURE === "true",
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
        const htmlContent = `
          <h2>📅 Yêu cầu tư vấn mới từ website</h2>
          <table style="border-collapse:collapse;width:100%;max-width:500px;">
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Họ tên</td><td style="padding:8px;border:1px solid #ddd;">${name}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">SĐT</td><td style="padding:8px;border:1px solid #ddd;">${phone}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Email</td><td style="padding:8px;border:1px solid #ddd;">${email || "—"}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Thời gian</td><td style="padding:8px;border:1px solid #ddd;">${preferredTime || "—"}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Câu hỏi</td><td style="padding:8px;border:1px solid #ddd;">${question || "—"}</td></tr>
          </table>
          <p style="margin-top:16px;color:#666;">Gửi từ hệ thống VESTA UNI</p>
        `;
        await transporter.sendMail({
          from: `"VESTA UNI Website" <${process.env.SMTP_USER}>`,
          to: "huongly.ams@gmail.com, vestaunivn@gmail.com",
          subject: `[Tư vấn] ${name} — ${phone}`,
          html: htmlContent,
        });
        console.log("  ✅ Email đã gửi đến GV");
      } catch (emailErr) {
        console.error("  ⚠ Gửi email thất bại:", emailErr);
      }
    }

    return res.json({ success: true, message: "Đã gửi yêu cầu tư vấn" });
  } catch (error) {
    console.error("Consultation error:", error);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// GET /api/consultation?status=NEW&page=1 — ADMIN: danh sách yêu cầu tư vấn
export const listConsultations = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const status = req.query.status as string;
    const search = req.query.search as string;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ];
    }
    const [items, total, newCount] = await Promise.all([
      prisma.consultation.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
      prisma.consultation.count({ where }),
      prisma.consultation.count({ where: { status: "NEW" } }),
    ]);
    // Tự chứa (không dùng api.paginated vì cần trả thêm newCount cho badge)
    return api.success(res, {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      newCount,
    });
  } catch (err) {
    console.error("List consultations error:", err);
    return api.error(res, "Lỗi server", 500);
  }
};

// PATCH /api/consultation/:id — ADMIN: cập nhật trạng thái / ghi chú
export const updateConsultation = async (req: Request<Params>, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, note, handledBy } = req.body;
    const existing = await prisma.consultation.findUnique({ where: { id } });
    if (!existing) return api.error(res, "Không tìm thấy yêu cầu", 404);
    const data: any = {};
    if (status !== undefined) {
      if (!["NEW", "CONTACTED", "DONE", "SPAM"].includes(status)) return api.error(res, "Trạng thái không hợp lệ");
      data.status = status;
    }
    if (note !== undefined) data.note = note || null;
    if (handledBy !== undefined) data.handledBy = handledBy || null;
    const updated = await prisma.consultation.update({ where: { id }, data });
    return api.success(res, updated, "Đã cập nhật");
  } catch (err) {
    console.error("Update consultation error:", err);
    return api.error(res, "Lỗi server", 500);
  }
};

// DELETE /api/consultation/:id — ADMIN: xoá yêu cầu
export const deleteConsultation = async (req: Request<Params>, res: Response) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.consultation.findUnique({ where: { id } });
    if (!existing) return api.error(res, "Không tìm thấy yêu cầu", 404);
    await prisma.consultation.delete({ where: { id } });
    return api.success(res, { id }, "Đã xoá yêu cầu");
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
};