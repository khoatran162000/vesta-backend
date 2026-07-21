// FILE: src/jobs/scheduler.ts — Khoi dong cronjob (khong dung node-cron, tu tinh lich)
import { runWeeklyStudyCheck } from "./weeklyStudyCheck";
import prisma from "../config/database";

const HOUR = 3600 * 1000;
const CYCLE_DAYS = 3; // chu kỳ quét tiến độ (chốt: 3 ngày/lần)

// Lần quét gần nhất (nhìn lastFlagCheck mới nhất trong toàn bộ HS)
async function lastRunAt(): Promise<Date | null> {
  const latest = await prisma.user.findFirst({
    where: { role: "STUDENT", lastFlagCheck: { not: null } },
    orderBy: { lastFlagCheck: "desc" },
    select: { lastFlagCheck: true },
  });
  return latest?.lastFlagCheck ?? null;
}

// Đã tới hạn quét chu kỳ chưa? (>= CYCLE_DAYS kể từ lần quét gần nhất)
async function dueForCycle(): Promise<boolean> {
  const last = await lastRunAt();
  if (!last) return true; // chưa quét bao giờ → quét luôn
  const daysSince = (Date.now() - last.getTime()) / 86400000;
  return daysSince >= CYCLE_DAYS;
}

export function startScheduler() {
  // 1) CHẠY BÙ khi khởi động: nếu tới hạn chu kỳ → quét ngay.
  setTimeout(async () => {
    try {
      if (await dueForCycle()) {
        console.log("[Scheduler] Tới hạn chu kỳ — chạy quét tiến độ ngay...");
        await runWeeklyStudyCheck();
      } else {
        console.log("[Scheduler] Chưa tới hạn chu kỳ, bỏ qua chạy bù.");
      }
    } catch (e) { console.error("[Scheduler] Lỗi chạy bù:", e); }
  }, 15000);

  // 2) Kiểm tra mỗi giờ: tới hạn chu kỳ (>= 3 ngày) + giờ hợp lý (>=20h) → chạy quét tiến độ.
  setInterval(async () => {
    try {
      const now = new Date();
      if (now.getHours() >= 20 && (await dueForCycle())) {
        console.log("[Scheduler] Tới hạn chu kỳ 3 ngày — chạy quét tiến độ...");
        await runWeeklyStudyCheck();
      }
    } catch (e) { console.error("[Scheduler] Lỗi cron tiến độ:", e); }
  }, HOUR);

  console.log("[Scheduler] Đã đăng ký: quét tiến độ (3 ngày/lần, có chạy bù khi khởi động)");
}