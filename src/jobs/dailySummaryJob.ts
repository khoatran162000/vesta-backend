// FILE: src/jobs/dailySummaryJob.ts — Job 0h VN: đẩy thông báo tóm tắt học tập trong ngày cho ADMIN
import prisma from "../config/database";
import { buildDailySummary } from "../lib/dailySummary";

const VN_OFFSET_MS = 7 * 3600 * 1000;

// Ngày VN vừa kết thúc (chạy lúc ~00:0x giờ VN → lùi 1h để lấy đúng ngày hôm trước)
function endedVnDate(): string {
  return new Date(Date.now() + VN_OFFSET_MS - 3600 * 1000).toISOString().slice(0, 10);
}

export async function runDailySummary(forDate?: string) {
  const date = forDate || endedVnDate();
  const s = await buildDailySummary(date);

  const link = `/theo-doi/hom-nay?date=${date}`;
  const title = `Tóm tắt học tập ngày ${s.label}`;
  let message: string;
  if (s.stats.attempts === 0) {
    message = `Ngày ${s.label}: chưa có học sinh nào làm bài.`;
  } else {
    const parts = [`Ngày ${s.label}: ${s.stats.students} học sinh làm bài, tổng ${s.stats.attempts} lượt (bài tập ${s.stats.baiTap}, đề thi ${s.stats.deThi}).`];
    if (s.stats.avgScore != null) parts.push(`Điểm trung bình ${s.stats.avgScore}/10.`);
    parts.push("Bấm để xem chi tiết từng lớp và từng học sinh.");
    message = parts.join(" ");
  }

  // Chống gửi trùng (server restart trong ngày): đã có thông báo cùng link → bỏ qua
  const dup = await prisma.notification.findFirst({ where: { link, type: "SYSTEM_AUTO" }, select: { id: true } });
  if (dup) { console.log(`[DailySummary] Đã gửi cho ngày ${date}, bỏ qua.`); return; }

  const admins = await prisma.user.findMany({ where: { role: "ADMIN", isActive: true }, select: { id: true } });
  if (!admins.length) return;

  await prisma.notification.createMany({
    data: admins.map((a) => ({ userId: a.id, title, message, type: "SYSTEM_AUTO" as const, link })),
  });
  console.log(`[DailySummary] Đã gửi tóm tắt ngày ${date} cho ${admins.length} admin.`);
}
