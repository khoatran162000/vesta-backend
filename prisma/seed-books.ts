// FILE: prisma/seed-books.ts — Seed 6 sách hiện tại (chạy 1 lần)
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const BOOKS = [
  { title: "Giáo trình 5+", price: "269.000đ", highlight: false, orderIndex: 0 },
  { title: "Giáo trình 6+", price: "289.000đ", highlight: false, orderIndex: 1 },
  { title: "Giáo trình 7+", price: "279.000đ", highlight: false, orderIndex: 2 },
  { title: "SPARK 1", price: "777.000đ", highlight: false, orderIndex: 3 },
  { title: "SPARK 2", price: "888.000đ", highlight: false, orderIndex: 4 },
  { title: "Combo 2 cuốn", price: "1.456.000đ", highlight: true, orderIndex: 5 },
];

async function main() {
  for (const b of BOOKS) {
    const existing = await prisma.book.findFirst({ where: { title: b.title } });
    if (existing) { await prisma.book.update({ where: { id: existing.id }, data: b }); console.log(`↻ ${b.title}`); }
    else { await prisma.book.create({ data: b }); console.log(`✓ ${b.title}`); }
  }
  console.log("Xong seed sách.");
}
main().catch(console.error).finally(() => prisma.$disconnect());