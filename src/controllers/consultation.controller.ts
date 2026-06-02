// FILE: src/controllers/consultation.controller.ts — Đặt lịch tư vấn
import { Request, Response } from "express";

export const submitConsultation = async (req: Request, res: Response) => {
  try {
    const { name, phone, email, question, preferredTime } = req.body;
    if (!name || !phone) return res.status(400).json({ success: false, message: "Thiếu họ tên hoặc SĐT" });

    // Log ra console (luôn hoạt động)
    console.log(`\n📅 YÊU CẦU TƯ VẤN MỚI:`);
    console.log(`   Họ tên: ${name}`);
    console.log(`   SĐT: ${phone}`);
    console.log(`   Email: ${email || "—"}`);
    console.log(`   Thời gian: ${preferredTime || "—"}`);
    console.log(`   Câu hỏi: ${question || "—"}\n`);

    // Gửi email nếu đã cấu hình SMTP
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