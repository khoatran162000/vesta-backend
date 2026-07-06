// FILE: prisma/seed-teachers.ts — Seed 2 giáo viên VESTA (chạy 1 lần)
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const TEACHERS = [
  {
    name: "Ms. Ly Le",
    ma: "(M.A.)",
    subtitle: "Dạy cả online và offline các trình độ, Chuyên Phá Tắc Band",
    photoUrl: null,
    orderIndex: 0,
    isPublished: true,
    badges: [
      { num: "16", label: "Năm KN" },
      { num: "8.5", label: "IELTS" },
      { num: "9.0", label: "Speaking" },
    ],
    credentials: [
      { icon: "podium", text: "Cựu giám khảo hội thi nói Cambridge, hệ KET, PET" },
      { icon: "landmark", text: "Cựu giảng viên ĐHNN - ĐHQGHN (ULIS), cựu giáo viên Hà Nội - Amsterdam và Greenfield School, hệ Cambridge" },
      { icon: "cap", text: "Cựu học sinh chuyên Anh Hà Nội - Amsterdam và cựu sinh viên lớp Chất lượng cao, Đại học Ngoại ngữ - ĐHQGHN" },
      { icon: "users", text: "Kinh nghiệm giảng dạy 16 năm, chuyên IELTS, huấn luyện đội tuyển tiếng Anh quốc gia HN - Amsterdam kỹ năng Viết, Nói" },
      { icon: "scale", text: "Thạc sĩ ngành Lý luận giảng dạy (Victoria University, Úc)" },
      { icon: "briefcase", text: "Thạc sĩ ngành Quản trị kinh doanh quốc tế (Derby University, Anh)" },
      { icon: "book", text: 'Đồng tác giả cuốn "Bài luận mẫu tiếng Anh cho học sinh chuyên" và "...cho học sinh THPT 3 miền"' },
      { icon: "star", text: "Điểm IELTS Tổng: 8.5 (2021), Nói: 9.0 (2017), kinh nghiệm thi cả trên máy và trên giấy" },
      { icon: "target", text: "Chấm Nói, Viết sát tay, dự đoán đề chuẩn, học sinh điểm cao" },
    ],
  },
  {
    name: "Mr. Nguyễn Đức Anh",
    ma: null,
    subtitle: "Dạy cả online và offline các trình độ, Chuyên Phá Tắc Band",
    photoUrl: null,
    orderIndex: 1,
    isPublished: true,
    badges: [
      { num: "7", label: "Năm KN" },
      { num: "7.5", label: "IELTS" },
      { num: "8.5", label: "Reading" },
    ],
    credentials: [
      { icon: "podium", text: "Cử nhân Xuất Sắc chuyên ngành sư phạm Tiếng Anh, Đại học Ngoại Ngữ, ĐHQGHN (ULIS)" },
      { icon: "star", text: "IELTS 7.5 (Overall) — 8.5 Reading | 7.0 Speaking | 7.0 Writing" },
      { icon: "briefcase", text: "Có 7 năm kinh nghiệm luyện thi IELTS, Tiếng Anh chuyên các cấp" },
      { icon: "cap", text: "Chuyên giảng dạy các kỹ năng: Reading, Listening, Speaking từ cơ bản đến nâng cao" },
      { icon: "users", text: "Kinh nghiệm hướng dẫn học sinh, sinh viên đạt band cao, cải thiện điểm số vượt bậc" },
      { icon: "target", text: "Phương pháp giảng dạy khoa học, dễ hiểu, cá nhân hóa theo từng học viên" },
      { icon: "book", text: "Cập nhật kiến thức và đề thi mới nhất, bám sát xu hướng ra đề IELTS" },
      { icon: "award", text: "Truyền cảm hứng, tạo động lực, giúp học viên tự tin chinh phục mục tiêu" },
    ],
  },
];

async function main() {
  for (const t of TEACHERS) {
    const existing = await prisma.teacher.findFirst({ where: { name: t.name } });
    if (existing) {
      await prisma.teacher.update({ where: { id: existing.id }, data: t as any });
      console.log(`↻ Cập nhật: ${t.name}`);
    } else {
      await prisma.teacher.create({ data: t as any });
      console.log(`✓ Tạo mới: ${t.name}`);
    }
  }
  console.log("Xong seed giáo viên.");
}

main().catch(console.error).finally(() => prisma.$disconnect());