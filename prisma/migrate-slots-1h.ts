// FILE: prisma/migrate-slots-1h.ts — Chuyển ca cũ (2h) sang ca 1h theo giờ bắt đầu. Chạy 1 lần.
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const MAP: Record<string, string> = {
  morning: "h8", morning9: "h9", morning2: "h10",
  afternoon: "h13", afternoon2: "h15", evening17: "h17",
  early: "h18", evening19: "h19", late: "h20",
};
async function main() {
  let n = 0;
  for (const [oldSlot, newSlot] of Object.entries(MAP)) {
    const r = await prisma.scheduleEntry.updateMany({ where: { slot: oldSlot }, data: { slot: newSlot } });
    if (r.count) console.log(`  ${oldSlot} → ${newSlot}: ${r.count} buổi`);
    n += r.count;
  }
  console.log(`Xong. Đã chuyển ${n} buổi sang ca 1 tiếng.`);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });