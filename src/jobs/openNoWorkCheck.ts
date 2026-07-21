// FILE: src/jobs/openNoWorkCheck.ts — Đếm "mở bài không làm" trong ngày.
// Luật (chị chốt): trong 1 ngày, mở ≥5 bài KHÁC NHAU mà không tương tác (không submit)
//   → lần đầu cắm cờ 🚩 + nhắc; nếu đang bị cờ mà tái phạm → khoá tạm phần học.
// Chỉ đếm bài KHÁC NHAU (distinct) → F5 nhiều lần 1 bài không bị tính oan.
import prisma from "../config/database";
const OPEN_NO_WORK_LIMIT = 5;   // số bài mở-không-làm/ngày để xử lý
const isPaid = (regStatus: string | null) => regStatus === "CONFIRMED" || regStatus === "PAID";

export async function runOpenNoWorkCheck(): Promise<{ flagged: number; locked: number }> {
  const now = new Date();
  const dayStart = new Date(now); dayStart.setHours(0, 0, 0, 0);
  const result = { flagged: 0, locked: 0 };

  const students = await prisma.user.findMany({
    where: { role: "STUDENT", isActive: true },
    select: { id: true, regStatus: true, studyFlag: true, lockedAt: true },
  });

  for (const s of students) {
    if (!isPaid(s.regStatus)) continue;
    // View trong ngày, chưa tương tác
    const views = await prisma.exerciseView.findMany({
      where: { studentId: s.id, openedAt: { gte: dayStart }, interacted: false },
      select: { exerciseId: true },
    });
    const distinctOpened = new Set(views.map((v) => v.exerciseId)).size;
    if (distinctOpened < OPEN_NO_WORK_LIMIT) continue;

    // Vi phạm: ≥5 bài mở-không-làm hôm nay
    if (s.lockedAt) continue; // đã khoá → bỏ qua
    if (!s.studyFlag) {
      // Lần đầu → cắm cờ + nhắc
      await prisma.user.update({ where: { id: s.id }, data: { studyFlag: true, flaggedAt: now } });
      await prisma.notification.create({
        data: {
          userId: s.id,
          title: "⚠️ Cảnh báo: mở nhiều bài nhưng không làm",
          message: `Hôm nay bạn đã mở ${distinctOpened} bài nhưng không làm bài nào. Vui lòng làm bài nghiêm túc — nếu tiếp tục, tài khoản sẽ bị tạm khoá phần học.`,
          type: "SYSTEM_AUTO",
        },
      });
      result.flagged++;
    } else {
      // Đang bị cờ mà vẫn tái phạm → khoá tạm
      await prisma.user.update({ where: { id: s.id }, data: { lockedAt: now } });
      await prisma.notification.create({
        data: {
          userId: s.id,
          title: "🔒 Tài khoản đã bị tạm khoá phần học",
          message: `Bạn tiếp tục mở nhiều bài mà không làm (${distinctOpened} bài hôm nay). Phần học đã tạm khoá — hãy làm bài nghiêm túc hoặc liên hệ trung tâm để mở lại.`,
          type: "SYSTEM_AUTO",
        },
      });
      result.locked++;
    }
  }
  return result;
}