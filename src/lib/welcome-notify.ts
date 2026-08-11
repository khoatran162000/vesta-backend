// FILE: src/lib/welcome-notify.ts  (Phần 3 — VESTA UNI)
// Push 1 thông báo chào mừng + deep-link trang Hướng dẫn buổi đầu cho HV đóng phí.
// Idempotent: claim nguyên tử trên User.welcomeNotifiedAt -> mỗi HV chỉ nhận ĐÚNG 1 lần,
// dù đi qua bất kỳ đường nào (tạo lẻ / bulk import / chấm bài / đổi regStatus sau).
import { PrismaClient } from "@prisma/client";

const GUIDE_LINK = "/huong-dan-buoi-dau";           // deep-link nội bộ Student Portal (giống link: /bao-cao/...)
const PAID_STATUSES = ["CONFIRMED", "PAID"];

/**
 * Gửi thông báo chào mừng nếu userId là HS đóng phí và chưa từng được gửi.
 * @returns true nếu vừa gửi, false nếu bỏ qua (không phải HS đóng phí / đã gửi rồi).
 */
export async function pushWelcomeIfNeeded(prisma: PrismaClient, userId: string): Promise<boolean> {
  // Claim nguyên tử: chỉ 1 lần set được cờ -> chống double-send khi bulk import chạy song song
  const claim = await prisma.user.updateMany({
    where: {
      id: userId,
      role: "STUDENT",
      regStatus: { in: PAID_STATUSES },
      welcomeNotifiedAt: null,
    },
    data: { welcomeNotifiedAt: new Date() },
  });
  if (claim.count === 0) return false; // không phải HS đóng phí, hoặc đã gửi rồi

  try {
    await prisma.notification.create({
      data: {
        userId,
        title: "Chào mừng bạn đến với VESTA UNI 🎉",
        message:
          "Tài khoản của bạn đã được kích hoạt. Trước buổi học đầu tiên, bạn dành vài phút đọc " +
          "Hướng dẫn buổi đầu để nắm cách đăng nhập, làm bài và xem lịch. Bấm để xem chi tiết.",
        type: "SYSTEM_AUTO",     // đổi nếu enum của bạn dùng giá trị khác cho thông báo hệ thống
        link: GUIDE_LINK,
      },
    });
    return true;
  } catch (err) {
    // Lỗi tạo notification -> nhả cờ về null để lần sau thử lại (không mất thông báo)
    await prisma.user
      .updateMany({ where: { id: userId }, data: { welcomeNotifiedAt: null } })
      .catch(() => {});
    console.error("[welcome-notify] lỗi:", err);
    return false;
  }
}
