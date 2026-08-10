// FILE: seed-calendar.js — Nạp dữ liệu lịch làm bài (calendar-seed.json) vào SiteContent key "calendar_all"
// Chạy 1 lần: node seed-calendar.js
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // calendar-seed.json nằm ở thư mục VestaUni (cha của vesta-backend)
  const seedPath = path.join(__dirname, "calendar-seed.json");
  if (!fs.existsSync(seedPath)) {
    console.error("Khong thay calendar-seed.json tai:", seedPath);
    process.exit(1);
  }
  const D = JSON.parse(fs.readFileSync(seedPath, "utf8"));

  const levels = Object.keys(D);
  let classes = 0, days = 0;
  for (const lv of levels) for (const c of D[lv]) { classes++; for (const w of c.w) days += w.d.length; }

  const item = await prisma.siteContent.upsert({
    where: { key: "calendar_all" },
    update: { data: D, label: "Lịch làm bài cả năm" },
    create: { key: "calendar_all", label: "Lịch làm bài cả năm", data: D },
  });

  console.log("Da seed calendar_all.");
  console.log("Levels:", levels.join(", "), "| Lop:", classes, "| O ngay:", days);
  console.log("SiteContent id:", item.id, "| updatedAt:", item.updatedAt);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());