// FILE: src/jobs/scheduler.ts — Khoi dong cronjob (khong dung node-cron, tu tinh lich)
import { runWeeklyStudyCheck } from "./weeklyStudyCheck";
import prisma from "../config/database";

const HOUR = 3600 * 1000;

// Đầu tuần này (thứ 2 00:00) — mốc để biết tuần này đã quét chưa
function startOfWeek(d = new Date()): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // T2=0 ... CN=6
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x;
}

// Tuần này đã quét chưa? (nhìn lastFlagCheck mới nhất trong toàn bộ HS)
async function alreadyRanThisWeek(): Promise<boolean> {
  const latest = await prisma.user.findFirst({
    where: { role: "STUDENT", lastFlagCheck: { not: null } },
    orderBy: { lastFlagCheck: "desc" },
    select: { lastFlagCheck: true },
  });
  return !!latest?.lastFlagCheck && latest.lastFlagCheck >= startOfWeek();
}

export function startScheduler() {
  // 1) CHẠY BÙ khi khởi động: nếu tuần này chưa quét (server restart lỡ nhịp CN) → quét ngay.
  setTimeout(async () => {
    try {
      if (!(await alreadyRanThisWeek())) {
        console.log("[Scheduler] Tuần này chưa quét — chạy bù ngay...");
        await runWeeklyStudyCheck();
      } else {
        console.log("[Scheduler] Tuần này đã quét, bỏ qua chạy bù.");
      }
    } catch (e) { console.error("[Scheduler] Lỗi chạy bù:", e); }
  }, 15000);

  // 2) Kiểm tra mỗi giờ: đúng tối Chủ nhật (>=20h) và tuần này chưa quét → chạy.
  setInterval(async () => {
    try {
      const now = new Date();
      const isSundayNight = now.getDay() === 0 && now.getHours() >= 20;
      if (isSundayNight && !(await alreadyRanThisWeek())) {
        console.log("[Scheduler] Tối Chủ nhật — chạy quét tuần...");
        await runWeeklyStudyCheck();
      }
    } catch (e) { console.error("[Scheduler] Lỗi cron:", e); }
  }, HOUR);

  console.log("[Scheduler] Đã đăng ký: weeklyStudyCheck (tối CN, có chạy bù khi khởi động)");
}