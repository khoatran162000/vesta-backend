// FILE: src/lib/dailySummary.ts — Tổng hợp hoạt động làm bài trong 1 ngày (giờ VN)
import prisma from "../config/database";

const VN_OFFSET_MS = 7 * 3600 * 1000;

/** Ngày hôm nay theo giờ VN, dạng "YYYY-MM-DD" */
export function vnToday(): string {
  return new Date(Date.now() + VN_OFFSET_MS).toISOString().slice(0, 10);
}

/** Cửa sổ UTC [start, end) tương ứng 1 ngày VN (00:00–24:00 giờ VN) */
export function vnDayWindow(vnDateStr: string): { start: Date; end: Date } {
  const [y, m, d] = vnDateStr.split("-").map(Number);
  // 00:00 giờ VN = 17:00 UTC hôm trước = Date.UTC(y,m-1,d) - 7h
  const start = new Date(Date.UTC(y, (m || 1) - 1, d || 1) - VN_OFFSET_MS);
  const end = new Date(start.getTime() + 24 * 3600 * 1000);
  return { start, end };
}

export type SummaryItem = {
  kind: "BAI_TAP" | "DE_THI";
  title: string;
  score: number | null;
  maxScore: number | null;
  graded: boolean;
  time: string;
};
export type SummaryStudent = {
  studentId: string;
  fullName: string;
  studentCode: string | null;
  items: SummaryItem[];
};
export type SummaryClass = {
  classId: string;
  className: string;
  course: string | null;
  students: SummaryStudent[];
};
export type DailySummary = {
  date: string;
  label: string;
  stats: { students: number; attempts: number; baiTap: number; deThi: number; avgScore: number | null };
  classes: SummaryClass[];
};

function fmtLabel(vnDateStr: string): string {
  const [y, m, d] = vnDateStr.split("-");
  return `${d}/${m}/${y}`;
}

export async function buildDailySummary(vnDateStr: string): Promise<DailySummary> {
  const { start, end } = vnDayWindow(vnDateStr);

  // 1) Bài tập tương tác đã nộp trong ngày
  const ia = await prisma.interactiveAttempt.findMany({
    where: { createdAt: { gte: start, lt: end }, status: "SUBMITTED", studentId: { not: null } },
    select: {
      studentId: true, score: true, totalScore: true, isGraded: true, createdAt: true,
      exercise: { select: { title: true } },
      student: { select: { id: true, fullName: true, studentCode: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // 2) Đề thi đã nộp trong ngày
  const ea = await prisma.examAttempt.findMany({
    where: { createdAt: { gte: start, lt: end }, status: "SUBMITTED" },
    select: {
      studentId: true, score: true, isGraded: true, createdAt: true,
      exam: { select: { title: true, totalScore: true } },
      student: { select: { id: true, fullName: true, studentCode: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const byStudent = new Map<string, SummaryStudent>();
  const push = (
    sid: string | null,
    stu: { id: string; fullName: string; studentCode: string | null } | null,
    item: SummaryItem
  ) => {
    if (!sid || !stu) return;
    let s = byStudent.get(sid);
    if (!s) { s = { studentId: sid, fullName: stu.fullName, studentCode: stu.studentCode, items: [] }; byStudent.set(sid, s); }
    s.items.push(item);
  };

  for (const a of ia) {
    push(a.studentId, a.student, {
      kind: "BAI_TAP", title: a.exercise?.title || "Bài tập",
      score: a.score ?? null, maxScore: a.totalScore ?? null, graded: a.isGraded, time: a.createdAt.toISOString(),
    });
  }
  for (const a of ea) {
    push(a.studentId, a.student, {
      kind: "DE_THI", title: a.exam?.title || "Đề thi",
      score: a.score ?? null, maxScore: a.exam?.totalScore ?? null, graded: a.isGraded, time: a.createdAt.toISOString(),
    });
  }

  const studentIds = [...byStudent.keys()];

  const enrolls = studentIds.length
    ? await prisma.classEnrollment.findMany({
        where: { studentId: { in: studentIds }, status: "STUDYING" },
        select: { studentId: true, class: { select: { id: true, name: true, course: true } } },
      })
    : [];

  const stuClasses = new Map<string, { id: string; name: string; course: string | null }[]>();
  for (const e of enrolls) {
    if (!e.class) continue;
    const arr = stuClasses.get(e.studentId) || [];
    arr.push({ id: e.class.id, name: e.class.name, course: e.class.course });
    stuClasses.set(e.studentId, arr);
  }

  const classMap = new Map<string, SummaryClass>();
  const UNASSIGNED = "__none__";
  const getClass = (id: string, name: string, course: string | null): SummaryClass => {
    let c = classMap.get(id);
    if (!c) { c = { classId: id, className: name, course, students: [] }; classMap.set(id, c); }
    return c;
  };

  for (const s of byStudent.values()) {
    const cls = stuClasses.get(s.studentId);
    if (cls && cls.length) { for (const c of cls) getClass(c.id, c.name, c.course).students.push(s); }
    else { getClass(UNASSIGNED, "Chưa xếp lớp", null).students.push(s); }
  }

  const classes = [...classMap.values()].sort((a, b) => {
    if (a.classId === UNASSIGNED) return 1;
    if (b.classId === UNASSIGNED) return -1;
    return a.className.localeCompare(b.className, "vi");
  });
  for (const c of classes) c.students.sort((a, b) => a.fullName.localeCompare(b.fullName, "vi"));

  const attempts = ia.length + ea.length;
  const gradedPct: number[] = [];
  for (const s of byStudent.values()) {
    for (const it of s.items) {
      if (it.graded && it.score != null && it.maxScore && it.maxScore > 0) gradedPct.push((it.score / it.maxScore) * 10);
    }
  }
  const avgScore = gradedPct.length
    ? Math.round((gradedPct.reduce((x, y) => x + y, 0) / gradedPct.length) * 10) / 10
    : null;

  return {
    date: vnDateStr,
    label: fmtLabel(vnDateStr),
    stats: { students: byStudent.size, attempts, baiTap: ia.length, deThi: ea.length, avgScore },
    classes,
  };
}
