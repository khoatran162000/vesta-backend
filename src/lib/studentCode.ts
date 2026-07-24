// FILE: src/lib/studentCode.ts
// Sinh mã tài khoản học viên theo công thức của trung tâm:
//   {tên} + {lớp} + {ddmmyy}   (nối thẳng, không dấu ngăn cách)
// Quy tắc: bỏ dấu tiếng Việt, bỏ khoảng trắng, thường hoá.
//   BỎ dấu + (HS đỡ khó gõ khi đăng nhập). GIỮ dấu - (lớp 1-1, và đuôi chống trùng -2, -3).
// VD: Lê Hương Ly · 7+ · 24/07/2026 → lehuongly7240726
//     Lê Hương Ly · Phát Âm · 24/07/2026 → lehuonglyphatam240726
import prisma from "../config/database";
function removeDiacritics(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
}
// Tên: chỉ giữ chữ + số (bỏ mọi ký tự lạ)
function slugName(fullName: string): string {
  return removeDiacritics(fullName).toLowerCase().replace(/[^a-z0-9]/g, "");
}
// Lớp: bỏ dấu, bỏ space, thường hoá.
//   Tên lớp trong hệ thống có kèm tháng/năm khai giảng ("7+0726" = band 7+ khoá 07/26).
//   → BỎ 4 số tháng/năm ở cuối, chỉ lấy band, tránh lặp với phần ngày đăng ký.
//   BỎ dấu + cho HS đỡ khó gõ. GIỮ - (lớp 1-1, và đuôi chống trùng -2).
// VD: "7+0726" → "7" · "5+0526" → "5" · "1-1" → "1-1" · "Phát Âm" → "phatam"
function slugCourse(course: string): string {
  let s = removeDiacritics(course).toLowerCase().replace(/[^a-z0-9+\-]/g, "");
  const stripped = s.replace(/\d{4}$/, "");   // bỏ mmyy cuối nếu vẫn còn phần phía trước
  if (stripped.length > 0) s = stripped;
  return s.replace(/\+/g, "");                // bỏ dấu +
}
// Ngày đăng ký → ddmmyy (pad 0 để không trùng: 1/12/26 và 11/2/26 khác nhau)
function ddmmyy(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);
  return `${dd}${mm}${yy}`;
}
// Sinh mã cơ sở (chưa kiểm trùng)
export function buildStudentCode(fullName: string, course?: string | null, startDate?: Date | null): string {
  const namePart = slugName(fullName);
  const coursePart = course ? slugCourse(course) : "";
  const datePart = ddmmyy(startDate || new Date());
  return `${namePart}${coursePart}${datePart}`;
}
// Sinh mã UNIQUE — nếu trùng thì thêm đuôi -2, -3, ...
export async function generateUniqueStudentCode(
  fullName: string, course?: string | null, startDate?: Date | null
): Promise<string> {
  const base = buildStudentCode(fullName, course, startDate);
  let code = base;
  let suffix = 2;
  // Trùng tên + lớp + ngày (vd 2 bạn cùng tên cùng lớp nhập cùng ngày) → nối -2, -3
  while (await prisma.user.findUnique({ where: { studentCode: code } })) {
    code = `${base}-${suffix}`;
    suffix++;
  }
  return code;
}