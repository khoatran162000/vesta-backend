// FILE: src/jobs/openingReminderRun.ts — chạy tay để test B2: node dist/jobs/openingReminderRun.js
import { runOpeningReminderCheck } from "./openingReminderCheck";
import prisma from "../config/database";
runOpeningReminderCheck()
  .then((r) => { console.log("KẾT QUẢ:", r); return prisma.$disconnect(); })
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
