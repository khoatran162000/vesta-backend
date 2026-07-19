// FILE: src/controllers/class.controller.ts — Lớp học + ghi danh học viên
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const VALID_STATUS = ["ACTIVE", "ENROLL_CLOSED", "FINISHED"];

function uid(req: Request): string {
  return (req as any).user?.userId || "";
}

// ─── List lớp (staff): lọc theo level/status, kèm sĩ số ───
export const listClasses = async (req: Request, res: Response) => {
  try {
    const { course, status } = req.query;
    const where: any = {};
    if (course) where.course = String(course);
    if (status) where.status = String(status);
    const data = await prisma.class.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { enrollments: true } },
        creator: { select: { fullName: true } },
      },
    });
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi tải danh sách lớp" });
  }
};

// Public: danh sách lớp đang mở theo khoá, kèm slot còn trống. KHÔNG auth, chỉ trả field an toàn.
export const listPublicClasses = async (req: Request, res: Response) => {
  try {
    const { course } = req.query;
    const where: any = { status: { in: ["ACTIVE", "ENROLL_CLOSED"] }, isActive: true };
    if (course) where.course = String(course);
    const classes = await prisma.class.findMany({
      where,
      orderBy: { startDate: "asc" },
      select: {
        id: true, name: true, course: true, teacher: true,
        schedule: true, startDate: true, maxStudents: true, status: true,
        _count: { select: { enrollments: { where: { status: "STUDYING" } } } },
      },
    });
    const data = classes.map((c) => {
      const enrolled = c._count.enrollments;
      const max = c.maxStudents ?? null;
      const slotsLeft = max !== null ? Math.max(0, max - enrolled) : null;
      return {
        id: c.id, name: c.name, course: c.course, teacher: c.teacher,
        schedule: c.schedule, startDate: c.startDate,
        maxStudents: max, enrolled, status: c.status,
        slotsLeft,                       // null = không giới hạn; số = còn trống
        isFull: slotsLeft !== null && slotsLeft <= 0,
      };
    });
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi tải danh sách lớp" });
  }
};

// ─── Detail 1 lớp + danh sách HS ───
export const getClass = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const cls = await prisma.class.findUnique({
      where: { id },
      include: {
        enrollments: {
          include: { student: { select: { id: true, fullName: true, studentCode: true, course: true, email: true } } },
          orderBy: { joinedAt: "asc" },
        },
        creator: { select: { fullName: true } },
      },
    });
    if (!cls) return res.status(404).json({ success: false, message: "Không tìm thấy lớp" });
    return res.json({ success: true, data: cls });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi tải lớp" });
  }
};

// ─── Create (staff) ───
export const createClass = async (req: Request, res: Response) => {
  try {
    const { name, classCode, course, teacher, schedule, room, startDate, maxStudents, status, notes } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Thiếu tên lớp" });
    const cls = await prisma.class.create({
      data: {
        name,
        classCode: classCode || null,
        course: course || null,
        teacher: teacher || null,
        schedule: schedule || null,
        room: room || null,
        startDate: startDate ? new Date(startDate) : null,
        maxStudents: maxStudents ? parseInt(maxStudents) : null,
        status: VALID_STATUS.includes(status) ? status : "ACTIVE",
        notes: notes || null,
        createdBy: uid(req),
      },
    });
    return res.status(201).json({ success: true, data: cls });
  } catch (error: any) {
    if (error?.code === "P2002") return res.status(400).json({ success: false, message: "Mã lớp đã tồn tại" });
    return res.status(500).json({ success: false, message: "Lỗi tạo lớp" });
  }
};

// ─── Update (staff) ───
export const updateClass = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { name, classCode, course, teacher, schedule, room, startDate, maxStudents, status, notes, isActive } = req.body;
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (classCode !== undefined) data.classCode = classCode || null;
    if (course !== undefined) data.course = course || null;
    if (teacher !== undefined) data.teacher = teacher || null;
    if (schedule !== undefined) data.schedule = schedule || null;
    if (room !== undefined) data.room = room || null;
    if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
    if (maxStudents !== undefined) data.maxStudents = maxStudents ? parseInt(maxStudents) : null;
    if (status !== undefined) data.status = VALID_STATUS.includes(status) ? status : "ACTIVE";
    if (notes !== undefined) data.notes = notes || null;
    if (isActive !== undefined) data.isActive = !!isActive;
    const cls = await prisma.class.update({ where: { id }, data });
    return res.json({ success: true, data: cls });
  } catch (error: any) {
    if (error?.code === "P2002") return res.status(400).json({ success: false, message: "Mã lớp đã tồn tại" });
    return res.status(500).json({ success: false, message: "Lỗi cập nhật lớp" });
  }
};

// ─── Delete (staff) — xoá lớp (enrollment tự cascade) ───
export const deleteClass = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    await prisma.class.delete({ where: { id } });
    return res.json({ success: true, message: "Đã xoá lớp" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi xoá lớp" });
  }
};

// ─── Ghi danh: thêm nhiều HS vào lớp cùng lúc ───
export const enrollStudents = async (req: Request, res: Response) => {
  try {
    const classId = String(req.params.id);
    const { studentIds } = req.body as { studentIds: string[] };
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, message: "Chưa chọn học viên" });
    }
    // createMany + skipDuplicates: HS đã có trong lớp thì bỏ qua, không lỗi
    await prisma.classEnrollment.createMany({
      data: studentIds.map((sid) => ({ classId, studentId: sid })),
      skipDuplicates: true,
    });
    return res.json({ success: true, message: `Đã thêm ${studentIds.length} học viên` });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi ghi danh học viên" });
  }
};

// ─── Gỡ 1 HS khỏi lớp ───
export const unenrollStudent = async (req: Request, res: Response) => {
  try {
    const classId = String(req.params.id);
    const studentId = String(req.params.studentId);
    await prisma.classEnrollment.deleteMany({ where: { classId, studentId } });
    return res.json({ success: true, message: "Đã gỡ học viên khỏi lớp" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi gỡ học viên" });
  }
};

// GET /api/classes/of-student/:studentId — các lớp mà 1 HS đang thuộc
export const getClassesOfStudent = async (req: Request, res: Response) => {
  try {
    const studentId = String(req.params.studentId);
    const enrollments = await prisma.classEnrollment.findMany({
      where: { studentId },
      select: {
        status: true,
        class: { select: { id: true, name: true, course: true, status: true } },
      },
    });
    const data = enrollments
      .filter((e) => e.class)
      .map((e) => ({ ...e.class, enrollStatus: e.status }));
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi tải lớp của học viên" });
  }
};

// ─── Đổi trạng thái ghi danh (STUDYING/COMPLETED/LEFT) ───
export const updateEnrollment = async (req: Request, res: Response) => {
  try {
    const classId = String(req.params.id);
    const studentId = String(req.params.studentId);
    const { status } = req.body;
    const allowed = ["STUDYING", "COMPLETED", "TESTED", "RESERVED", "LEFT"];
    if (!allowed.includes(status)) return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
    await prisma.classEnrollment.updateMany({ where: { classId, studentId }, data: { status } });
    return res.json({ success: true, message: "Đã cập nhật trạng thái" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi cập nhật trạng thái" });
  }
};