// FILE: src/utils/mailer.ts — Gửi email qua Gmail (App Password)
import nodemailer from "nodemailer";

const GMAIL_USER = process.env.GMAIL_USER || "";
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || "";

let transporter: nodemailer.Transporter | null = null;
function getTransporter() {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    });
  }
  return transporter;
}

// Gửi email HTML đơn giản. Trả true nếu gửi được, false nếu lỗi/chưa cấu hình.
export async function sendMail(to: string, subject: string, html: string): Promise<boolean> {
  const t = getTransporter();
  if (!t || !to) return false;
  try {
    await t.sendMail({
      from: `"VESTA UNI" <${GMAIL_USER}>`,
      to, subject, html,
    });
    return true;
  } catch (e) {
    console.error("Send mail loi:", e);
    return false;
  }
}

// Email thông báo tài khoản mới (khi HS nộp bài chấm)
export async function sendNewAccountMail(to: string, fullName: string, studentCode: string, password: string): Promise<boolean> {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1a2a6c">
      <h2 style="color:#1a2a6c">VESTA UNI — Tài khoản của bạn</h2>
      <p>Chào ${fullName},</p>
      <p>Chúng tôi đã nhận bài của bạn. Hệ thống đã tạo tài khoản để bạn theo dõi và nhận bài chữa:</p>
      <div style="background:#faf8f4;border:1px solid #e8e4dc;border-radius:8px;padding:16px;margin:12px 0">
        <p style="margin:4px 0"><b>Mã học viên:</b> ${studentCode}</p>
        <p style="margin:4px 0"><b>Mật khẩu:</b> ${password}</p>
      </div>
      <p>Đăng nhập tại <a href="https://student.vestaedu.online" style="color:#c9a84c">student.vestaedu.online</a> và vào mục <b>Thông báo</b> để nhận bài chữa.</p>
      <p style="color:#6b7084;font-size:13px">Vui lòng đổi mật khẩu sau khi đăng nhập lần đầu.</p>
    </div>`;
  return sendMail(to, "VESTA UNI — Tài khoản & hướng dẫn nhận bài", html);
}
