// FILE: src/jobs/openingReminderCheck.ts — Nhắc HV trước ngày khai giảng lớp (B2).
// Nguồn khai giảng: Class.startDate. Người nhận: HV ghi danh (ClassEnrollment STUDYING) + đóng phí + active.
// Chống trùng: dedup theo Notification.link (mỗi lớp × mốc gửi đúng 1 lần; kèm ngày KG nên dời lịch vẫn nhắc lại đúng).
import prisma from "../config/database";

const REMINDER_OFFSETS = [3, 1]; // nhắc trước 3 ngày và 1 ngày (sửa tuỳ ý: thêm 7 hoặc 0)
const isPaid = (regStatus: string | null) => regStatus === "CONFIRMED" || regStatus === "PAID";

function ymd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${dd}`;
}
function fmtDate(d: Date): string {
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${dd}/${m}/${d.getUTCFullYear()}`;
}

export async function runOpeningReminderCheck(): Promise<{ sent: number }> {
  const now = new Date();
  const todayMid = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const maxOffset = Math.max(...REMINDER_OFFSETS);
  const soon = new Date(todayMid + (maxOffset + 1) * 86400000);
  const result = { sent: 0 };

  // Lớp còn hoạt động, có ngày khai giảng, rơi trong khoảng maxOffset ngày tới
  const classes = await prisma.class.findMany({
    where: {
      isActive: true,
      status: "ACTIVE",
      startDate: { gte: new Date(todayMid), lt: soon },
    },
    select: { id: true, name: true, schedule: true, room: true, startDate: true },
  });

  for (const c of classes) {
    if (!c.startDate) continue;
    const sd = c.startDate;
    const startMid = Date.UTC(sd.getUTCFullYear(), sd.getUTCMonth(), sd.getUTCDate());
    const daysLeft = Math.round((startMid - todayMid) / 86400000);
    if (!REMINDER_OFFSETS.includes(daysLeft)) continue;

    const enrollments = await prisma.classEnrollment.findMany({
      where: { classId: c.id, status: "STUDYING" },
      select: { student: { select: { id: true, regStatus: true, isActive: true } } },
    });

    const when = daysLeft === 1 ? "ngày mai" : `còn ${daysLeft} ngày`;
    const title = daysLeft === 1 ? "🎓 Ngày mai lớp khai giảng!" : `🎓 Còn ${daysLeft} ngày nữa khai giảng`;
    const detail = [c.schedule ? `Lịch học: ${c.schedule}` : null, c.room ? `Phòng: ${c.room}` : null]
      .filter(Boolean)
      .join(" · ");
    const message =
      `Lớp "${c.name}" của bạn sẽ khai giảng vào ${fmtDate(sd)} (${when}). ` +
      (detail ? detail + ". " : "") +
      "Xem lịch làm bài và chuẩn bị cho buổi học đầu tiên nhé!";
    const link = `/lich-lam-bai?c=${c.id}&kg=${ymd(sd)}&d=${daysLeft}`;

    for (const e of enrollments) {
      const s = e.student;
      if (!s || !s.isActive || !isPaid(s.regStatus)) continue;
      const dup = await prisma.notification.findFirst({ where: { userId: s.id, link } });
      if (dup) continue;
      await prisma.notification.create({
        data: { userId: s.id, title, message, type: "SYSTEM_AUTO", link },
      });
      result.sent++;
    }
  }

  console.log(`[OpeningReminder] đã gửi:${result.sent} (${now.toISOString()})`);
  return result;
}
