// FILE: prisma/seed-site-content.ts — Seed 4 khối tĩnh landing
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const BLOCKS = [
  {
    key: "hero", label: "Hero (banner đầu trang)",
    data: { title: "VESTA UNI", subtitle: "Fast Track To High Scores" },
  },
  {
    key: "philosophy", label: "Phong cách dạy & Nội quy học viên",
    data: { items: [
      { html: `Mọi khóa học đều <strong>đảm bảo đầu ra</strong>, nhưng học viên cần cam kết làm đủ bài tập hằng ngày (60-90 phút luyện). Chương trình học thiết kế theo chuẩn thi, giáo viên chỉ cho học viên kĩ thuật học chuẩn nhất, nhưng học viên cần làm bài thực sự thì mới lên trình. ✨ Nếu học viên liên tục có ý thức học không tốt, giáo viên sẽ buộc dừng học. Học viên bị buộc dừng sẽ không còn tiếp cận kho học liệu và không được hoàn học phí.` },
      { html: `✨ Giáo viên thông báo tiến độ học vào giữa và cuối khóa. Ngoài hai thời điểm trên, phụ huynh và học viên muốn cập nhật tiến độ, mời chủ động liên hệ qua email: <strong><a href="mailto:huongly.ams@gmail.com" class="underline">huongly.ams@gmail.com</a></strong> hoặc Zalo: <strong>0336781368</strong>. Địa chỉ học trực tiếp: <strong>Ngõ 60 Hoàng Quốc Việt, Cầu Giấy, Hà Nội</strong>. Học online cùng lịch với học trực tiếp. Học online hay offline đều hiệu quả như nhau vì giáo viên có phương pháp sát sao, kiểm soát tốt việc học của các con sao cho không bị mất tập trung.` },
    ] },
  },
  {
    key: "tuition", label: "Thông tin học phí",
    data: {
      notes: [
        { style: "normal", html: `🎓 Học phí được đóng theo khóa, trước khai giảng 1 tuần. Bao gồm phí mở tài khoản, tài liệu, link luyện tập kĩ năng hàng ngày, gói chấm chữa không giới hạn, số buổi học trực tiếp và dịch vụ hỗ trợ 24/7.` },
        { style: "normal", html: `🎓 Học viên có thể <strong>học thử miễn phí buổi đầu</strong>, nhưng do lượng đăng kí đông, cần dự tính trước việc bị lùi sang khóa sau. Học viên xin nghỉ học sau buổi đầu và sau khi được giao tài khoản vào hệ thống sẽ không được hoàn học phí.` },
        { style: "highlight", html: `🎁 GIẢM 5% cho học sinh cũ`, sub: `Học bổng 30% cho hoàn cảnh khó khăn — gửi thư xin bài test, cần đạt 90%` },
        { style: "normal", html: `☆ Thanh toán qua chuyển khoản hoặc quẹt thẻ POS (phụ thu 0.7%)` },
      ],
      bank: {
        label: "Chuyển khoản đến",
        name: "VESTA UNI — TECHCOMBANK 123777789",
        note: "Nội dung: TÊN HỌC VIÊN, SĐT, TÊN KHÓA HỌC, CCCD người đóng phí",
        qrUrl: "/images/qr-bank.jpg",
      },
    },
  },
  {
    key: "books_spark", label: "Mô tả SPARK (mục Sách)",
    data: { html: `<strong class="font-bold text-royal">SPARK tập 1 & 2:</strong> Tuyển tập ý chi tiết cho tất cả các bài luận IELTS — gồm hơn 600 đề kèm ý chi tiết, giúp viết nhanh bài luận chuẩn IELTS mang tính tranh biện cao. Cung cấp từ chuyên ngành, từ học thuật trình độ cao, cùng cấu trúc câu mẫu sẵn.` },
  },
];

async function main() {
  for (const b of BLOCKS) {
    await prisma.siteContent.upsert({ where: { key: b.key }, update: { label: b.label, data: b.data }, create: b });
    console.log(`✓ ${b.key}`);
  }
  console.log("Xong seed site content.");
}
main().catch(console.error).finally(() => prisma.$disconnect());