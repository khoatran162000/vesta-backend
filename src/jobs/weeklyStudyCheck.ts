// FILE: src/jobs/weeklyStudyCheck.ts — Cron cắm cờ / khoá tạm theo tiến độ bài tập tương tác
// Luật (chị chốt): mỗi tuần HS phải làm đủ 4 bài tương tác KHÁC NHAU ≥85% trong 7 ngày.
//   Thiếu → cắm cờ 🚩 + nhắc. Cắm cờ >3 ngày vẫn thiếu → khoá tạm (khoá phần học, VẪN đăng nhập được).
//   Đủ bài → gỡ cờ + mở khoá. HS mới tạo ≤7 ngày → miễn tuần đầu.
import prisma from "../config/database";
import { countDistinctPassed } from "../lib/studentProgress";

const REQUIRED = 4;       // số bài khác nhau
const THRESHOLD = 85;     // %
const WINDOW_DAYS = 7;    // cửa sổ đếm
const GRACE_DAYS = 3;     // số ngày làm bù sau khi cắm cờ

const isPaid = (regStatus: string | null) => regStatus === "CONFIRMED" || regStatus === "PAID";

export async function runWeeklyStudyCheck(): Promise<{ flagged: number; locked: number; cleared: number }> {
  const now = new Date();
  const newbieCutoff = new Date(now.getTime() - WINDOW_DAYS * 86400 * 1000);
  const result = { flagged: 0, locked: 0, cleared: 0 };

  const students = await prisma.user.findMany({
    where: { role: "STUDENT", isActive: true },
    select: { id: true, fullName: true, regStatus: true, createdAt: true, studyFlag: true, flaggedAt: true, lockedAt: true },
  });

  for (const s of students) {
    // Chỉ áp cho HS đã ghi danh; HS mới tạo ≤7 ngày → miễn tuần đầu
    if (!isPaid(s.regStatus)) continue;
    if (s.createdAt > newbieCutoff) continue;

    const passed = await countDistinctPassed(s.id, THRESHOLD, WINDOW_DAYS);

    // ĐỦ BÀI → gỡ cờ + mở khoá nếu đang bị
    if (passed >= REQUIRED) {
      if (s.studyFlag || s.lockedAt) {
        await prisma.user.update({
          where: { id: s.id },
          data: { studyFlag: false, flaggedAt: null, lockedAt: null, lastFlagCheck: now },
        });
        result.cleared++;
      } else {
        await prisma.user.update({ where: { id: s.id }, data: { lastFlagCheck: now } });
      }
      continue;
    }

    // THIẾU BÀI
    if (!s.studyFlag) {
      // Chưa cắm cờ → cắm cờ + nhắc
      await prisma.user.update({
        where: { id: s.id },
        data: { studyFlag: true, flaggedAt: now, lastFlagCheck: now },
      });
      await prisma.notification.create({
        data: {
          userId: s.id,
          title: "⚠️ Nhắc nhở hoàn thành bài tập",
          message: `Tuần qua bạn mới hoàn thành ${passed}/${REQUIRED} bài tập đạt ${THRESHOLD}%. Hãy làm đủ trong ${GRACE_DAYS} ngày tới, nếu không tài khoản sẽ bị tạm khoá phần học.`,
          type: "SYSTEM_AUTO",
        },
      });
      result.flagged++;
    } else if (!s.lockedAt) {
      // Đã cắm cờ — quá 3 ngày mà vẫn thiếu → khoá tạm
      const flaggedAgo = s.flaggedAt ? (now.getTime() - s.flaggedAt.getTime()) / 86400000 : 999;
      if (flaggedAgo >= GRACE_DAYS) {
        await prisma.user.update({
          where: { id: s.id },
          data: { lockedAt: now, lastFlagCheck: now },
        });
        await prisma.notification.create({
          data: {
            userId: s.id,
            title: "🔒 Tài khoản đã bị tạm khoá phần học",
            message: `Bạn chưa hoàn thành đủ ${REQUIRED} bài tập sau ${GRACE_DAYS} ngày nhắc nhở. Phần học đã tạm khoá — hãy làm đủ bài để mở lại, hoặc liên hệ trung tâm.`,
            type: "SYSTEM_AUTO",
          },
        });
        result.locked++;
      } else {
        await prisma.user.update({ where: { id: s.id }, data: { lastFlagCheck: now } });
      }
    } else {
      await prisma.user.update({ where: { id: s.id }, data: { lastFlagCheck: now } });
    }
  }

  console.log(`[WeeklyStudyCheck] cờ:${result.flagged} khoá:${result.locked} gỡ:${result.cleared} (${now.toISOString()})`);
  return result;
}