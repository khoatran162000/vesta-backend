/**
 * FILE: seed.ts
 * PATH: apps/api/prisma/seed.ts
 * MÔ TẢ: Tạo tài khoản Admin + Content Creator + Teacher + bài viết mẫu
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  // === Tạo Admin ===
  const adminPassword = await bcrypt.hash("Admin@123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@vestauni.vn" },
    update: {},
    create: {
      email: "admin@vestauni.vn",
      passwordHash: adminPassword,
      fullName: "Super Admin",
      role: "ADMIN",
      isActive: true,
    },
  });
  console.log(`✅ Admin: ${admin.email} / Admin@123`);

  // === Tạo Content Creator (Marketing) ===
  const mktPassword = await bcrypt.hash("Marketing@123", 12);
  const mkt = await prisma.user.upsert({
    where: { email: "marketing@vestauni.vn" },
    update: {},
    create: {
      email: "marketing@vestauni.vn",
      passwordHash: mktPassword,
      fullName: "Marketing Manager",
      role: "CONTENT_CREATOR",
      isActive: true,
    },
  });
  console.log(`✅ Content Creator: ${mkt.email} / Marketing@123`);

  // === Tạo Teacher ===
  const teacherPassword = await bcrypt.hash("Teacher@123", 12);
  const teacher = await prisma.user.upsert({
    where: { email: "teacher@vestauni.vn" },
    update: {},
    create: {
      email: "lyleteacher@vestauni.vn",
      passwordHash: teacherPassword,
      fullName: "Ly Le Teacher",
      role: "TEACHER",
      isActive: true,
    },
  });
  console.log(`✅ Teacher: ${teacher.email} / Teacher@123`);

  // === Tạo bài viết mẫu ===
  const posts = [
    {
      authorId: mkt.id,
      title: "10 Mẹo Luyện Listening IELTS Hiệu Quả",
      slug: "10-meo-luyen-listening-ielts-hieu-qua",
      excerpt: "Listening là kỹ năng khiến nhiều thí sinh lo lắng nhất. Bài viết chia sẻ 10 phương pháp giúp cải thiện band điểm.",
      content: "<h2>Tại sao Listening lại khó?</h2><p>Phần thi Listening yêu cầu nghe và trả lời 40 câu hỏi trong 30 phút. Âm thanh chỉ phát <strong>một lần duy nhất</strong>.</p><h2>1. Nghe chủ động</h2><p>Dành 20 phút mỗi ngày nghe tập trung 100% thay vì bật podcast làm nhạc nền.</p><h2>2. Làm quen nhiều giọng</h2><p>IELTS dùng giọng Anh, Úc, Mỹ. Hãy xoay vòng giữa BBC, CNN, ABC Australia.</p><h2>3. Phương pháp Nghe-Viết-So</h2><ul><li><strong>Nghe</strong> đoạn audio 1-2 phút</li><li><strong>Viết</strong> lại mọi thứ (dictation)</li><li><strong>So</strong> với transcript gốc</li></ul>",
      thumbnailUrl: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=800&h=450&fit=crop",
      tags: JSON.stringify(["Listening", "Tips", "Beginner"]),
      status: "PUBLISHED",
    },
    {
      authorId: teacher.id,
      title: "Cách Viết IELTS Writing Task 2 Đạt Band 7+",
      slug: "cach-viet-ielts-writing-task-2-dat-band-7",
      excerpt: "Writing Task 2 chiếm 2/3 điểm Writing. Phân tích chi tiết cấu trúc bài luận và lỗi cần tránh.",
      content: "<h2>Task 2 quan trọng như thế nào?</h2><p>Task 2 chiếm <strong>gấp đôi</strong> số điểm so với Task 1.</p><h2>4 tiêu chí chấm điểm</h2><ul><li><strong>Task Response:</strong> Trả lời đúng câu hỏi</li><li><strong>Coherence & Cohesion:</strong> Mạch lạc</li><li><strong>Lexical Resource:</strong> Vốn từ phong phú</li><li><strong>Grammatical Range:</strong> Ngữ pháp đa dạng</li></ul><h2>Cấu trúc bài luận chuẩn band 7</h2><ul><li><strong>Introduction (3-4 câu):</strong> Paraphrase đề + thesis statement</li><li><strong>Body 1 (6-8 câu):</strong> Luận điểm 1 + giải thích + ví dụ</li><li><strong>Body 2 (6-8 câu):</strong> Luận điểm 2 + giải thích + ví dụ</li><li><strong>Conclusion (2-3 câu):</strong> Tóm tắt quan điểm</li></ul><blockquote><p>\"Bí quyết Writing band 7 không phải viết hay — mà là viết đúng cấu trúc và ít lỗi ngữ pháp.\"</p></blockquote>",
      thumbnailUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&h=450&fit=crop",
      tags: JSON.stringify(["Writing", "Task 2", "Band 7+"]),
      status: "PUBLISHED",
    },
    {
      authorId: mkt.id,
      title: "Từ Vựng IELTS Theo Chủ Đề: 50 Từ Must-Know",
      slug: "tu-vung-ielts-theo-chu-de-50-tu-must-know",
      excerpt: "Tổng hợp 50 từ vựng học thuật theo 5 chủ đề thường gặp: Education, Technology, Environment, Health, Society.",
      content: "<h2>Education</h2><ul><li><strong>curriculum</strong> — chương trình học</li><li><strong>academic performance</strong> — thành tích học tập</li><li><strong>vocational training</strong> — đào tạo nghề</li></ul><h2>Technology</h2><ul><li><strong>artificial intelligence</strong> — trí tuệ nhân tạo</li><li><strong>automation</strong> — tự động hóa</li><li><strong>digital literacy</strong> — kỹ năng số</li></ul><blockquote><p>\"Biết 50 từ nhưng dùng được cả 50 — tốt hơn biết 500 từ nhưng chỉ dùng được 50.\"</p></blockquote>",
      thumbnailUrl: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&h=450&fit=crop",
      tags: JSON.stringify(["Vocabulary", "Band 6+", "Study Guide"]),
      status: "PUBLISHED",
    },
    {
      authorId: teacher.id,
      title: "Speaking IELTS Part 2: Cách Nói Đủ 2 Phút Không Hết Ý",
      slug: "speaking-ielts-part-2-cach-noi-2-phut-khong-het-y",
      excerpt: "Part 2 yêu cầu nói liên tục 2 phút — nỗi sợ lớn nhất của thí sinh Việt. Framework PAST giúp triển khai ý mượt mà.",
      content: "<h2>Framework PAST</h2><ul><li><strong>P — Point:</strong> Nêu câu trả lời chính</li><li><strong>A — Add detail:</strong> Thêm chi tiết (khi nào, ở đâu, với ai)</li><li><strong>S — Story:</strong> Kể một câu chuyện ngắn</li><li><strong>T — Thought:</strong> Chia sẻ cảm xúc, suy nghĩ</li></ul><h2>5 mẹo bổ sung</h2><p><strong>1. Nói chậm lại:</strong> Nói chậm + rõ ràng tốt hơn nói nhanh + vấp.</p><p><strong>2. Dùng discourse markers:</strong> \"Well\", \"Actually\", \"To be honest\" — giúp mua thêm vài giây suy nghĩ.</p><p><strong>3. Luyện với đồng hồ:</strong> Bấm giờ 2 phút mỗi khi luyện tập.</p><blockquote><p>\"Part 2 không phải bài thuyết trình — đó là cuộc trò chuyện một chiều.\"</p></blockquote>",
      thumbnailUrl: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=450&fit=crop",
      tags: JSON.stringify(["Speaking", "Part 2", "Framework"]),
      status: "PUBLISHED",
    },
  ];

  for (const post of posts) {
    await prisma.post.upsert({
      where: { slug: post.slug },
      update: {},
      create: post,
    });
    console.log(`✅ Post: ${post.title}`);
  }

  console.log("\n🎉 Seed hoàn tất!");
  console.log("───────────────────────────────────────────");
  console.log("Tài khoản đăng nhập CMS:");
  console.log("  Admin:     admin@vestauni.vn / Admin@123");
  console.log("  Marketing: marketing@vestauni.vn / Marketing@123");
  console.log("  Teacher:   teacher@vestauni.vn / Teacher@123");
  console.log("───────────────────────────────────────────");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());