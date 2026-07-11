import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const LEVELS = ["5+", "6+", "7+", "1-1", "Intensive", "Writing", "Phát Âm", "Chuyên Cấp 3"];
async function main() {
  for (let i = 0; i < LEVELS.length; i++) {
    await prisma.level.upsert({
      where: { code: LEVELS[i] },
      update: {},
      create: { code: LEVELS[i], order: i },
    });
  }
  console.log("Seeded levels:", LEVELS.length);
}
main().finally(() => prisma.$disconnect());