// FILE: prisma/seed-courses.ts — Seed toàn bộ khoá học hiện tại (chạy 1 lần)
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const COURSES: any[] = [
  // ---- FULL ----
  { cardType: "FULL", orderIndex: 0, isSpecial: true, title: "LUYỆN THI CHUYÊN CẤP 3", badge: "LỚP 7-9",
    features: [
      { icon: "🎯", text: "Dành cho học sinh lớp 7-9" },
      { icon: "📚", text: "Học theo lộ trình 3 chặng: B2 → C1, C2 → Luyện đề chuyên" },
      { icon: "✏️", text: "Rèn IELTS Writing, CAE Writing, Reading, Listening, Use of English, kết hợp luyện đề chuyên Sở, chuyên Quốc gia." },
      { icon: "💡", text: "Sau mỗi 7 buổi có Progress Test. Phụ huynh nhận báo cáo kết quả hằng tháng. Có gia sư/mentor ốp bài, nhắc bài và theo sát việc học ở nhà." },
      { icon: "🎯", text: "Chuẩn đầu ra định hướng: C1-C2, tương đương IELTS 7+, Cambridge Advanced, đề chuyên Sở và chuyên Quốc gia." },
      { icon: "👩‍🏫", text: "Giảng dạy bởi Ms. Ly Le, cựu giáo viên Hà Nội - Amsterdam, cựu giảng viên ULIS, cựu giám khảo hỏi thi nói Cambridge KET/PET, IELTS 8.5, Speaking 9.0, 16 năm kinh nghiệm, đồng tác giả 2 cuốn sách: bài luận mẫu cho học sinh chuyên." },
    ],
    scheduleLabel: "HỌC PHÍ", schedule: "280.000 VND/buổi 2.5 tiếng · 2.240.000 VND/tháng",
    price: "Đóng 2 trình: giảm 5% · Đóng trọn 3 trình: giảm 15%, còn 45.696.000 VND" },
  { cardType: "FULL", orderIndex: 1, title: "IELTS 5+", badge: "CẤP TỐC 10 TUẦN",
    features: [
      { icon: "🧠", text: "Nạp 200 từ vựng học thuật/tuần, xoay quanh 10 chủ điểm thi IELTS." },
      { icon: "✏️", text: "Xây dựng ngữ pháp từ trình độ 2.0, cam kết viết thạo bài luận chuẩn 5.5 chỉ sau một khóa." },
      { icon: "💡", text: "Rèn kỹ năng nghe, nói, đọc, viết bài bản, đặc biệt đẩy bật kỹ năng đọc và nghe." },
    ],
    commitment: "Cam kết chuẩn đầu ra 5.0+", scheduleLabel: "THỜI LƯỢNG",
    schedule: "30 buổi | 18:00–20:00 T2,4,6 hoặc T3,4,7", price: "8.400.000 VND", onlinePrice: "Online: 7.800.000" },
  { cardType: "FULL", orderIndex: 2, title: "IELTS 6+", badge: "12 TUẦN",
    features: [
      { icon: "🧠", text: "Nạp 300 từ vựng học thuật/tuần, xoay quanh 10 chủ điểm thi IELTS." },
      { icon: "✏️", text: "Củng cố ngữ pháp viết chắc chắn, cam kết viết thạo bài luận chuẩn 6.5 chỉ sau một khóa." },
      { icon: "📝", text: "Rèn bài bản kỹ thuật viết Task 1 chuẩn 6.5." },
      { icon: "💡", text: "Luyện sâu kỹ năng đọc, nghe, chuẩn âm kỹ năng nói." },
    ],
    commitment: "Cam kết chuẩn đầu ra 6.0+", scheduleLabel: "THỜI LƯỢNG",
    schedule: "36 buổi | 20:00–22:00 T2,4,6", price: "12.000.000 VND", onlinePrice: "Online: 11.400.000" },
  { cardType: "FULL", orderIndex: 3, title: "IELTS 7+", badge: "45 BUỔI",
    features: [
      { icon: "🧠", text: "Nạp 500 từ vựng học thuật/tuần, xoay quanh 10 chủ điểm thi IELTS." },
      { icon: "📝", text: "Rèn bài bản kỹ thuật đọc, nghe đạt 8+." },
      { icon: "💎", text: "Học kỹ thuật trả lời câu hỏi Speaking dự đoán cho kỳ thi." },
      { icon: "✏️", text: "Cam kết viết thạo bài luận chuẩn 7+ chỉ sau một khóa." },
    ],
    commitment: "Cam kết chuẩn đầu ra 7.0+", scheduleLabel: "THỜI LƯỢNG",
    schedule: "45 buổi | 19:30–21:30 T3,5 (30 tuần) hoặc T3,5,7 (15 tuần)", price: "13.600.000 VND", onlinePrice: "Online: 12.800.000" },
  { cardType: "FULL", orderIndex: 4, title: "IELTS 1-1 Phá Tắc Band", badge: "LIÊN HỆ", badgeOutline: false,
    features: [
      { icon: "🚀", text: "Lộ trình học nhanh nhất, bài tập thiết kế riêng giúp tăng band có chiến thuật." },
      { icon: "🧠", text: "Nạp đủ lượng từ vựng cho các chủ điểm thi IELTS." },
      { icon: "📝", text: "Bài viết và ý mẫu cho 400 đề thi dự đoán." },
      { icon: "🎯", text: "Chấm chữa bài không giới hạn." },
      { icon: "💎", text: "Bài nói mẫu dựng sẵn với 350 câu hỏi thi dự đoán." },
    ],
    commitment: "Cam kết tăng ít nhất 1 band sau 1 khóa học.", cta: "💰 Liên hệ để được tư vấn phù hợp" },
  { cardType: "FULL", orderIndex: 5, title: "IELTS Intensive Bứt Phá", badge: "60 BUỔI",
    features: [
      { icon: "📊", text: "Đầu vào 6.0+ → Đầu ra 7.0 trở lên." },
      { icon: "🧠", text: "Ôn từ vựng, luyện đề đọc nghe, chữa viết nói không giới hạn." },
      { icon: "📝", text: "Đề dự đoán tỉ lệ trúng cao, ép học bổ sung từ vựng và chỉnh kĩ năng." },
      { icon: "✏️", text: "Template nói, viết độc đáo, không trùng mẫu đại trà. Bài viết được sửa kỹ kèm bài mẫu." },
    ],
    commitment: "Chống lười và tăng band hiệu quả.", scheduleLabel: "LỊCH HỌC",
    schedule: "60 buổi liên tục T2–T7: 10:00–12:00 (Đọc), 13:30–15:30 (Nghe), 15:30–16:30 (Viết)", price: "7.890.000 VND / 60 buổi" },
  // ---- HALF ----
  { cardType: "HALF", orderIndex: 6, title: "Viết / Nói — Phá Tắc Band", badge: "20 BUỔI",
    features: [
      { icon: "✏️", text: "Cam kết bật điểm viết lên band 7+." },
      { icon: "📝", text: "Phương pháp viết chuẩn theo 4 tiêu chí chấm điểm, luyện 100 đề dự đoán mới nhất." },
      { icon: "🎯", text: "Chấm và chữa bài không giới hạn, học đến khi đạt yêu cầu." },
    ],
    scheduleLabel: "LỊCH HỌC", schedule: "15:30 chiều T2, T4, T6 | Online & Offline", price: "7.800.000 VND / khóa" },
  { cardType: "HALF", orderIndex: 7, title: "Phát Âm Cơ Bản", badge: "24 BUỔI",
    features: [
      { icon: "🎯", text: "Cam kết chỉnh được tất cả các âm sai khi nói tiếng Anh." },
      { icon: "💎", text: "Luyện âm cơ bản, âm gió, âm cuối, nối âm và ngữ điệu tự nhiên. Bổ sung từ vựng A2, B1, luyện phản xạ nói hội thoại." },
      { icon: "🧑", text: "Đối tượng: mất gốc, phát âm sai, nói không rõ, thiếu tự tin, nói đều, nói lắp, nói ngọng. Lớp tối đa 5 bạn." },
    ],
    scheduleLabel: "LỊCH HỌC", schedule: "21:00–22:00 tối T3, T5, T7 | Online & Offline", price: "6.800.000 VND / khóa" },
  // ---- SUPPORT ----
  { cardType: "SUPPORT", orderIndex: 8, title: "Hỗ Trợ Đăng Ký Thi IELTS", badge: "ƯU ĐÃI",
    features: [
      { icon: "📝", text: "Đăng ký thi IELTS tại BC & IDP." },
      { icon: "🖥️", text: "Chọn ca thi Speaking phù hợp." },
      { icon: "🎁", text: "Quà tặng: Gói ôn luyện PREMIUM READY của BC trong 123 ngày." },
    ],
    specialPrice: "Lệ phí ưu đãi: 4.550.000 VND", originalPrice: "Giá gốc: 4.664.000" },
];

async function main() {
  for (const c of COURSES) {
    const existing = await prisma.course.findFirst({ where: { title: c.title } });
    if (existing) { await prisma.course.update({ where: { id: existing.id }, data: c }); console.log(`↻ ${c.title}`); }
    else { await prisma.course.create({ data: c }); console.log(`✓ ${c.title}`); }
  }
  console.log("Xong seed khoá học.");
}
main().catch(console.error).finally(() => prisma.$disconnect());