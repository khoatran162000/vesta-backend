// FILE: prisma/seed-enroll-guides.ts — nạp 5 file HTML hướng dẫn nhập học vào SiteContent (chạy 1 lần)
// Chạy: cd ~/Documents/VestaUni/vesta-backend && npx tsx prisma/seed-enroll-guides.ts
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import os from "os";
const prisma = new PrismaClient();
// Path 5 file HTML. Tự nhận local (Mac) hay server:
//   - Local: ~/Documents/VestaUni/vesta-landing/public/nhap-hoc
//   - Server: /var/www/landing/public/nhap-hoc
const LOCAL_DIR = path.join(os.homedir(), "Documents/VestaUni/vesta-landing/public/nhap-hoc");
const SERVER_DIR = "/var/www/landing/public/nhap-hoc";
const NHAPHOC_DIR = fs.existsSync(LOCAL_DIR) ? LOCAL_DIR : SERVER_DIR;
const GUIDES = [
  { key: "enroll_ielts4plus", label: "Hướng dẫn nhập học IELTS 4+", file: "ielts4plus.html", slug: "ielts4plus" },
  { key: "enroll_ielts5plus", label: "Hướng dẫn nhập học IELTS 5+", file: "ielts5plus.html", slug: "ielts5plus" },
  { key: "enroll_ielts6plus", label: "Hướng dẫn nhập học IELTS 6+", file: "ielts6plus.html", slug: "ielts6plus" },
  { key: "enroll_ielts7plus", label: "Hướng dẫn nhập học IELTS 7+", file: "ielts7plus.html", slug: "ielts7plus" },
  { key: "enroll_intensive", label: "Hướng dẫn nhập học 789 Intensive", file: "intensive.html", slug: "intensive" },
];
async function main() {
  console.log(`Đọc file từ: ${NHAPHOC_DIR}\n`);
  for (const g of GUIDES) {
    const p = path.join(NHAPHOC_DIR, g.file);
    if (!fs.existsSync(p)) { console.log(`✗ BỎ QUA (không thấy): ${p}`); continue; }
    const html = fs.readFileSync(p, "utf-8");
    await prisma.siteContent.upsert({
      where: { key: g.key },
      update: { data: { html, slug: g.slug }, label: g.label },
      create: { key: g.key, label: g.label, data: { html, slug: g.slug } },
    });
    console.log(`✓ ${g.key}  (${(html.length / 1024).toFixed(0)} KB)`);
  }
  console.log("\nXong.");
}
main().catch((e) => { console.error("LỖI:", e); process.exit(1); }).finally(() => prisma.$disconnect());