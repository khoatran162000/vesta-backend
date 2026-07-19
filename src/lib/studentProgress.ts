// FILE: src/lib/studentProgress.ts
// Tính tiến độ học tập của 1 HS — DÙNG CHUNG cho:
//   - Đ3: bảng tiến độ HS tự xem (/student/progress)
//   - Đ4: cron cắm cờ (đếm 4 bài tương tác ≥85% trong 7 ngày)
// Quy tắc: mỗi bài tập lấy % CAO NHẤT trong các lượt HS đã làm (không phải lượt mới nhất).
// Lý do: chị muốn "đã từng đạt chuẩn" — HS làm lại tệ hơn không bị mất thành tích.
import prisma from "../config/database";

export interface ExerciseProgress {
  exerciseId: string;
  title: string;
  type: string;
  attempted: boolean;   // đã làm lần nào chưa
  bestScore: number | null;  // % cao nhất (0-100), null nếu chưa làm
  attemptCount: number;
  lastAttemptAt: Date | null;
}

export interface ExamProgress {
  examTitle: string;
  score: number | null;      // điểm thô
  totalScore: number | null; // điểm tối đa của đề
  date: Date | null;
}

// Lấy khoá học của HS (để lọc bài visibility=CLASS)
async function getCourse(studentId: string): Promise<string | null> {
  const u = await prisma.user.findUnique({ where: { id: studentId }, select: { course: true } });
  return u?.course || null;
}

// Danh sách bài tập tương tác HS ĐƯỢC THẤY (khớp getVisibilityFilter bên interactive.controller)
async function visibleExercises(studentId: string) {
  const course = await getCourse(studentId);
  return prisma.interactiveExercise.findMany({
    where: {
      isPublished: true,
      OR: [
        { visibility: "PUBLIC" },
        { visibility: "STUDENT" },
        ...(course ? [{ visibility: "CLASS", visibleTo: { contains: course } as any }] : []),
      ],
    },
    orderBy: { orderIndex: "asc" },
    select: { id: true, title: true, type: true },
  });
}

// Tiến độ bài tập tương tác: mỗi bài → % cao nhất HS đạt
export async function interactiveProgress(studentId: string): Promise<ExerciseProgress[]> {
  const exercises = await visibleExercises(studentId);
  const attempts = await prisma.interactiveAttempt.findMany({
    where: { studentId },
    select: { exerciseId: true, score: true, createdAt: true },
  });

  // Gom theo exerciseId: best score + count + last time
  const byExercise = new Map<string, { best: number; count: number; last: Date }>();
  for (const a of attempts) {
    const cur = byExercise.get(a.exerciseId);
    const sc = a.score ?? 0;
    if (!cur) {
      byExercise.set(a.exerciseId, { best: sc, count: 1, last: a.createdAt });
    } else {
      cur.best = Math.max(cur.best, sc);
      cur.count++;
      if (a.createdAt > cur.last) cur.last = a.createdAt;
    }
  }

  return exercises.map((ex) => {
    const rec = byExercise.get(ex.id);
    return {
      exerciseId: ex.id,
      title: ex.title,
      type: ex.type,
      attempted: !!rec,
      bestScore: rec ? rec.best : null,
      attemptCount: rec ? rec.count : 0,
      lastAttemptAt: rec ? rec.last : null,
    };
  });
}

// Tiến độ đề thi: liệt kê các lượt đã nộp (điểm thô + điểm tối đa)
export async function examProgress(studentId: string): Promise<ExamProgress[]> {
  const attempts = await prisma.examAttempt.findMany({
    where: { studentId, status: "SUBMITTED" },
    orderBy: { endTime: "desc" },
    select: { score: true, endTime: true, exam: { select: { title: true, totalScore: true } } },
  });
  return attempts.map((a) => ({
    examTitle: a.exam.title,
    score: a.score ?? null,
    totalScore: a.exam.totalScore ?? null,
    date: a.endTime ?? null,
  }));
}

// Số bài tương tác KHÁC NHAU đạt ≥ threshold trong N ngày gần nhất (dùng cho cron Đ4)
export async function countDistinctPassed(studentId: string, threshold = 85, days = 7): Promise<number> {
  const since = new Date(Date.now() - days * 86400 * 1000);
  const attempts = await prisma.interactiveAttempt.findMany({
    where: { studentId, createdAt: { gte: since } },
    select: { exerciseId: true, score: true },
  });
  const passed = new Set<string>();
  for (const a of attempts) {
    if ((a.score ?? 0) >= threshold) passed.add(a.exerciseId);
  }
  return passed.size;
}

// Tổng hợp đầy đủ cho bảng tiến độ HS
export async function computeStudentProgress(studentId: string) {
  const [interactive, exams] = await Promise.all([
    interactiveProgress(studentId),
    examProgress(studentId),
  ]);

  const done = interactive.filter((e) => e.attempted);
  const passed = interactive.filter((e) => (e.bestScore ?? 0) >= 85);
  const overallPercent = interactive.length > 0
    ? Math.round((done.reduce((s, e) => s + (e.bestScore ?? 0), 0) / interactive.length))
    : 0;

  return {
    interactive,
    exams,
    summary: {
      totalExercises: interactive.length,
      attemptedExercises: done.length,
      passedExercises: passed.length,   // đạt ≥85%
      overallPercent,                    // TB % trên TỔNG số bài được giao (chưa làm = 0)
      totalExams: exams.length,
    },
  };
}