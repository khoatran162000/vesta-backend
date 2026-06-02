// FILE: prisma/seed-vesta7.ts — Import dữ liệu lớp 7+ từ CSV + Report Card
// Chạy: npx tsx prisma/seed-vesta7.ts

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════
// 1. DANH SÁCH 15 HỌC VIÊN TỪ FILE CSV
// ═══════════════════════════════════════════════════════════
const STUDENTS = [
  { name: "Lê Hải An", email: "zinyeudau@gmail.com", username: "lehaian70925", password: "0374986594" },
  { name: "Lê Khánh Chi", email: null, username: "lekhanhchiluyende", password: "docnghechincham" },
  { name: "Lê Thuỷ Tường An", email: "an2009281@gmail.com", username: "lethuytuongan71225", password: "0975207314" },
  { name: "Lương Quỳnh Anh", email: null, username: "luongquynhanhde", password: "0869204160" },
  { name: "Mạc Tuấn Nguyên", email: null, username: "mactuannguyen71225", password: "0981912363" },
  { name: "Nguyễn Ngọc Anh", email: "nguyentringocanh@gmail.com", username: "ngocanh71225", password: "0984168390" },
  { name: "Nguyễn Công Thái Lâm", email: null, username: "nguyencongthailam71025", password: "0963140330" },
  { name: "Nguyễn Đức Trung", email: "trungnguyenptit2204@gmail.com", username: "nguyenductrung70925", password: "0965402922" },
  { name: "Nguyễn Gia Minh", email: "minhng.alaska@gmail.com", username: "nguyengiaminh70925", password: "" },
  { name: "Nguyễn Khánh An", email: "Khanhann1006@gmail.com", username: "nguyenkhanhan71225", password: "0902488106" },
  { name: "Nguyễn Phương Thảo", email: "thao091009@gmail.com", username: "nguyenphuongthao70925", password: "0982907375" },
  { name: "Nguyễn Thị Thu", email: null, username: "nguyenthithu71025", password: "0865622796" },
  { name: "Nguyễn Vũ Hoàng An", email: "annvh169@gmail.com", username: "nguyenvuhoangan71225", password: "0981884590" },
  { name: "Trần Uyên Nhi", email: "nhitu.a5nt1923@gmail.com", username: "tranuyennhi70825", password: "0343333506" },
  { name: "Vũ Thu Trang", email: "cheese231103@gmail.com", username: "vuthutrang71225", password: "0389512883" },
];

// ═══════════════════════════════════════════════════════════
// 2. NHẬT KÝ BUỔI HỌC TỪ REPORT CARD (DIARY sheet)
// ═══════════════════════════════════════════════════════════
const CLASS_DIARY = [
  { session: 1, date: "2025-12-16", topic: "Introduction — Thư cam kết academic style, kiểm tra từ vựng và cách học 300 từ/tuần.", homework: "Viết thư cam kết, học 300 từ vựng", duration: "2.5h" },
  { session: 2, date: "2025-12-18", topic: "W1 - LINE GRAPH — Học cách viết Task 1 Line Graph, overview, xu hướng tăng giảm.", homework: "Hoàn thành LearnClick 90%, viết bài Line Graph", duration: "2.5h" },
  { session: 3, date: "2025-12-23", topic: "W1 - LINE GRAPH PRACTICE — Luyện viết Line Graph, chữa bài trên lớp.", homework: "Nộp bài Line Graph hoàn chỉnh", duration: "2.5h" },
  { session: 4, date: "2026-01-06", topic: "W1 - MAP — IELTS Writing Task 1 Map, trọng tâm map không gian kín, chia bài theo spatial reorganisation và functional changes.", homework: "Viết bài Map Practice", duration: "2.5h" },
  { session: 5, date: "2026-01-08", topic: "W1 - MAP PRACTICE — Luyện viết Map, chữa bài trên lớp.", homework: "Hoàn thành LearnClick Map 90%", duration: "2.5h" },
  { session: 6, date: "2026-02-24", topic: "W2 - IELTS WRITING BASICS — Academic Writing Style, Coherence & Cohesion, Stance & Engagement, sentence variety.", homework: "Viết mở bài đề 7: Should university education be free?", duration: "2.5h" },
  { session: 7, date: "2026-02-26", topic: "W2 - INTRODUCTION PRACTICE — Luyện viết mở bài Task 2 theo academic style.", homework: "Hoàn thành LearnClick introduction 90%", duration: "2.5h" },
  { session: 8, date: "2026-03-03", topic: "W2 - ARGUMENTATIVE 100 — Phân biệt Account vs Opinion, Stance & Engagement, viết mở bài argumentative cho đề 'Should museums be free?'", homework: "Chép template argumentative 100, làm LearnClick 90%", duration: "2.5h" },
  { session: 9, date: "2026-03-05", topic: "W2 - ARGUMENTATIVE 80-20 — Cách chọn thesis 100% vs 80-20, tránh viết ba phải, luyện bài argumentative theo hướng có lập trường chính.", homework: "Làm link lecture ngoài calendar, nộp bài 80-20", duration: "2.5h" },
  { session: 10, date: "2026-03-10", topic: "W2 - ARGUMENTATIVE PRACTICE — Ôn Argumentative, luyện viết trên lớp.", homework: "Hoàn thành bài viết argumentative", duration: "2.5h" },
  { session: 11, date: "2026-03-12", topic: "W2 - DISCUSSION — Cách viết bài Discussion: trình bày hai quan điểm, nêu opinion rõ cuối bài.", homework: "Chép template discussion, nộp bài viết", duration: "2.5h" },
  { session: 12, date: "2026-03-17", topic: "W2 - DISCUSSION PRACTICE / REVISION — Ôn Discussion, chữa bài trên lớp.", homework: "Viết lại bài discussion theo feedback", duration: "2.5h" },
  { session: 13, date: "2026-03-26", topic: "W2 - ACCOUNT 1 — Phân biệt Account với Opinion/Discussion, viết bài theo hướng khách quan, triển khai cause-solution.", homework: "Vocab check 90%, vở template cause-solution, link Account 90%", duration: "2.5h" },
  { session: 14, date: "2026-03-31", topic: "W2 - ACCOUNT 2 — Account mixed: đoạn why khách quan, đoạn advantages/disadvantages chủ quan khi đề hỏi positive/negative.", homework: "Hoàn thành link Account2 90%, nộp bài viết", duration: "2.5h" },
  { session: 15, date: "2026-02-10", topic: "SPEAKING PART 1 — Template 'I'm the kind of person who', luyện 5 câu trả lời linh hoạt.", homework: "Viết script 5 câu, ghi hình speaking, vocab check", duration: "2.5h" },
  { session: 16, date: "2026-02-17", topic: "SPEAKING PART 1 — Template 'Used to but now', luyện phrasal verbs và connected speech.", homework: "Viết script, ghi hình, vocab check", duration: "2.5h" },
  { session: 17, date: "2026-03-03", topic: "SPEAKING PART 1 — Template 'It depends', luyện trả lời linh hoạt hai mặt.", homework: "Viết script 5 câu, vocab check", duration: "2.5h" },
  { session: 18, date: "2026-03-24", topic: "SPEAKING PART 2 — Describing People + positive event, viết script 18-20 câu.", homework: "Viết script Part 2, Part 1+3, homework 'a city you want to visit'", duration: "2.5h" },
  { session: 19, date: "2026-04-07", topic: "SPEAKING PART 2 — Describing a place with good service, ghi hình speaking.", homework: "Ghi hình speaking full mặt, nộp video", duration: "2.5h" },
  { session: 20, date: "2026-04-14", topic: "SPEAKING TEST 2 — Speaking test thực hành, chấm chữa recording.", homework: "Luyện nói lại script, sửa pronunciation", duration: "2.5h" },
];

// ═══════════════════════════════════════════════════════════
// 3. TÀI LIỆU HỌC (Links từ Report Card)
// ═══════════════════════════════════════════════════════════
const MATERIALS = [
  { title: "Padlet: Course Introduction", fileUrl: "https://padlet.com/huonglyams/7-1225-0126-introduction-pga4ikrupw2u10v1", fileType: "LINK", order: 1 },
  { title: "Padlet: W1 Line Graph", fileUrl: "https://padlet.com/huonglyams/7-0126-writing-task-1-line-graph-j202ow4pt9cqmkgl", fileType: "LINK", order: 2 },
  { title: "Padlet: W1 Process", fileUrl: "https://padlet.com/huonglyams/7-1225-0126-process-wi4riacayvz497nj", fileType: "LINK", order: 3 },
  { title: "Padlet: W2 Academic Writing Style", fileUrl: "https://padlet.com/huonglyams/7-1225-0126-ielts-writing-task-2-academic-writing-style-xl9s8qgw08m702s8", fileType: "LINK", order: 4 },
  { title: "Padlet: W2 Argumentative 100", fileUrl: "https://padlet.com/huonglyams/7-1225-0126-ielts-writing-task-2-argumentative-100-ers90tskuqe7nr1c", fileType: "LINK", order: 5 },
  { title: "Padlet: W2 Argumentative 80-20", fileUrl: "https://padlet.com/huonglyams/7-1225-0126-ielts-writing-task-2-argumentative-80-20-4oogxusw47gajteh", fileType: "LINK", order: 6 },
  { title: "Padlet: W2 Argumentative Practice", fileUrl: "https://padlet.com/huonglyams/7-1225-0126-ielts-writing-task-2-n-argumentative-nr7wuqdfu03a2yf0", fileType: "LINK", order: 7 },
  { title: "Padlet: W2 Discussion", fileUrl: "https://padlet.com/huonglyams/7-1225-0126-ielts-writing-task-2-discussion-3jw42c4opyytdt3n", fileType: "LINK", order: 8 },
  { title: "Padlet: W2 Discussion Revision", fileUrl: "https://padlet.com/huonglyams/7-1225-0126-ielts-writing-task-2-revision-of-discussion-fzn5241fqn1hwtp", fileType: "LINK", order: 9 },
  { title: "Padlet: W2 Account 1", fileUrl: "https://padlet.com/huonglyams/7-1225-0126-ielts-writing-task-2-account-1-f0tm5jrcwozk21do", fileType: "LINK", order: 10 },
  { title: "Padlet: W2 Account 2", fileUrl: "https://padlet.com/huonglyams/7-1225-0126-ielts-writing-task-2-account2-bjslfi4aemuh8xg8", fileType: "LINK", order: 11 },
  { title: "Padlet: Speaking Part 1 - It Depends", fileUrl: "https://padlet.com/huonglyams/7-ielts-speaking-1-it-depends-t7sbzgd8u1zfk738", fileType: "LINK", order: 12 },
  { title: "Padlet: Speaking Part 2 - People", fileUrl: "https://padlet.com/huonglyams/7-1226-ielts-speaking-part-2-describing-people-7pwmwa32oki8kqpg", fileType: "LINK", order: 13 },
  { title: "Padlet: Speaking Test 2", fileUrl: "https://padlet.com/huonglyams/7-1226-ielts-speaking-test-2-v4taq9om3clsfs2o", fileType: "LINK", order: 14 },
];

// ═══════════════════════════════════════════════════════════
// MAIN SEED FUNCTION
// ═══════════════════════════════════════════════════════════
async function main() {
  console.log("\n🌱 Bắt đầu import dữ liệu lớp 7+...\n");

  // Lấy/tạo admin user để làm creator
  let admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        fullName: "Admin VESTA",
        email: "admin@vestauni.vn",
        passwordHash: await bcrypt.hash("Admin@123", 10),
        role: "ADMIN",
        isActive: true,
      },
    });
    console.log("✅ Tạo admin: admin@vestauni.vn / Admin@123");
  }

  // ── Import Students ──
  console.log("\n📋 Import 15 học viên...");
  let created = 0, skipped = 0;

  for (const s of STUDENTS) {
    // Check trùng username
    const existing = await prisma.user.findFirst({
      where: { OR: [{ studentCode: s.username }, ...(s.email ? [{ email: s.email }] : [])] },
    });
    if (existing) {
      console.log(`  ⏭ ${s.name} — đã tồn tại (${existing.studentCode || existing.email})`);
      skipped++;
      continue;
    }

    const pw = s.password || s.username; // fallback password = username
    await prisma.user.create({
      data: {
        fullName: s.name,
        email: s.email,
        phone: s.password && s.password.match(/^0\d+$/) ? s.password : null,
        studentCode: s.username,
        passwordHash: await bcrypt.hash(pw, 10),
        role: "STUDENT",
        isActive: true,
        course: "7+",
        studyMode: "OFFLINE",
        regStatus: "CONFIRMED",
      },
    });
    console.log(`  ✅ ${s.name} → ${s.username} / ${pw}`);
    created++;
  }
  console.log(`  → ${created} tạo mới, ${skipped} bỏ qua\n`);

  // ── Import Class Diary ──
  console.log("📖 Import nhật ký buổi học...");
  const existingDiaries = await prisma.classDiary.count({ where: { course: "7+" } });
  if (existingDiaries > 0) {
    console.log(`  ⏭ Đã có ${existingDiaries} buổi — bỏ qua\n`);
  } else {
    for (const d of CLASS_DIARY) {
      await prisma.classDiary.create({
        data: {
          course: "7+",
          session: d.session,
          date: new Date(d.date),
          topic: d.topic,
          homework: d.homework,
          duration: d.duration,
          createdBy: admin.id,
        },
      });
    }
    console.log(`  ✅ ${CLASS_DIARY.length} buổi học imported\n`);
  }

  // ── Import Materials ──
  console.log("📁 Import tài liệu...");
  const existingMats = await prisma.material.count({ where: { course: "7+" } });
  if (existingMats > 0) {
    console.log(`  ⏭ Đã có ${existingMats} tài liệu — bỏ qua\n`);
  } else {
    for (const m of MATERIALS) {
      await prisma.material.create({
        data: {
          course: "7+",
          title: m.title,
          fileUrl: m.fileUrl,
          fileType: m.fileType,
          orderIndex: m.order,
          isPublished: true,
          createdBy: admin.id,
        },
      });
    }
    console.log(`  ✅ ${MATERIALS.length} tài liệu imported\n`);
  }

  // ── Tạo notification cho mỗi student ──
  console.log("🔔 Tạo thông báo chào mừng...");
  const students = await prisma.user.findMany({ where: { course: "7+", role: "STUDENT" } });
  for (const st of students) {
    const exists = await prisma.notification.findFirst({
      where: { userId: st.id, title: { contains: "Chào mừng" } },
    });
    if (!exists) {
      await prisma.notification.create({
        data: {
          userId: st.id,
          title: "🎉 Chào mừng đến VESTA UNI!",
          message: `Chào ${st.fullName}, mã học viên: ${st.studentCode}. Đăng nhập Student Portal để xem lộ trình, nhật ký buổi học và tài liệu.`,
          type: "SYSTEM_AUTO",
        },
      });
    }
  }
  console.log(`  ✅ Done\n`);

  console.log("═══════════════════════════════════════");
  console.log("🎉 IMPORT HOÀN TẤT!");
  console.log(`   Học viên: ${created} mới / ${skipped} đã có`);
  console.log(`   Nhật ký: ${CLASS_DIARY.length} buổi`);
  console.log(`   Tài liệu: ${MATERIALS.length} links`);
  console.log("═══════════════════════════════════════\n");

  // In bảng tài khoản
  console.log("📋 BẢNG TÀI KHOẢN HỌC VIÊN:");
  console.log("─".repeat(70));
  console.log("Họ tên".padEnd(25) + "Mã HV".padEnd(30) + "Mật khẩu");
  console.log("─".repeat(70));
  for (const s of STUDENTS) {
    const pw = s.password || s.username;
    console.log(s.name.padEnd(25) + s.username.padEnd(30) + pw);
  }
  console.log("─".repeat(70));
}

main()
  .catch((e) => { console.error("❌ Lỗi:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());