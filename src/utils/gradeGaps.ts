// FILE: src/utils/gradeGaps.ts
// Chấm điểm cho bài tập kiểu LearnClick (gap fill / dropdown / drag&drop)
import { buildDropdownOptions, collectCorrectAnswers } from "./autoDistractors";

export type GapType = "TEXT" | "DROPDOWN" | "DRAG";

export interface GapDef {
  type: GapType;
  answers: string[];
  options?: string[];
  caseSensitive?: boolean;
  hint?: string;
  group?: string;      // các ô cùng group = 1 câu "nhiều đáp án, không thứ tự"
}

export type GapMap = Record<string, GapDef>;

export interface GapResult {
  id: string;
  type: GapType;
  studentAnswer: string | null;
  correctAnswers: string[];
  isCorrect: boolean;
}

export interface GradeResult {
  score: number;      // số gap đúng
  maxScore: number;   // tổng số gap
  percent: number;    // 0-100
  detail: GapResult[];
}

/**
 * Chuẩn hoá 1 chuỗi để so sánh.
 * Nới rộng cho đáp án dạng CỤM DÀI (bài dán từ LearnClick): học viên gõ thừa
 * dấu chấm cuối câu, thừa khoảng trắng, hay dùng nháy thẳng thay nháy cong
 * thì vẫn tính đúng. Áp dụng ĐỐI XỨNG cho cả đáp án lẫn bài làm.
 */
function normalize(s: string, caseSensitive: boolean): string {
  let out = String(s ?? "")
    .replace(/[\u2018\u2019\u02BC]/g, "'")   // ' ' → '
    .replace(/[\u201C\u201D]/g, '"')          // " " → "
    .replace(/[\u2013\u2014]/g, "-")          // – — → -
    .replace(/\s+/g, " ")                     // gộp khoảng trắng (gồm cả &nbsp;)
    .trim();
  // Bỏ dấu câu ở cuối — nhưng giữ nguyên nếu đáp án CHỈ gồm dấu câu
  const stripped = out.replace(/[.,;:!?]+$/, "").trim();
  if (stripped.length > 0) out = stripped;
  return caseSensitive ? out : out.toLowerCase();
}

/**
 * Tách đáp án nhiều phương án ngăn bằng dấu #  →  mảng
 * VD: "color#colour" → ["color", "colour"]
 * Dùng khi LƯU bài (chuẩn hoá gaps trước khi cất DB).
 */
export function splitAnswers(raw: string): string[] {
  return String(raw ?? "")
    .split("#")
    .map((a) => a.trim())
    .filter((a) => a.length > 0);
}

/**
 * Chuẩn hoá toàn bộ gaps khi lưu: đảm bảo answers luôn là mảng đã tách #
 * Chấp nhận answers dạng string ("a#b") hoặc đã là mảng.
 */
export function normalizeGaps(gaps: any): GapMap {
  const out: GapMap = {};
  if (!gaps || typeof gaps !== "object") return out;
  for (const [id, g] of Object.entries<any>(gaps)) {
    let answers: string[];
    if (Array.isArray(g.answers)) {
      // mảng có thể vẫn chứa phần tử có #, tách tiếp cho chắc
      answers = g.answers.flatMap((a: string) => splitAnswers(a));
    } else {
      answers = splitAnswers(g.answers);
    }
    out[id] = {
      type: (g.type as GapType) || "TEXT",
      answers,
      options: Array.isArray(g.options) ? g.options : undefined,
      caseSensitive: !!g.caseSensitive,
      ...(g.hint ? { hint: String(g.hint) } : {}),
      ...(g.group ? { group: String(g.group).trim() } : {}),   // giữ nhóm
    };
  }
  return out;
}

/**
 * Chấm điểm: so từng gap với đáp án học viên.
 * - Ô ĐƠN (không group): khớp bất kỳ đáp án nào trong mảng (như cũ).
 * - Ô cùng GROUP = 1 câu nhiều đáp án không thứ tự: chấm theo TẬP dùng chung,
 *   mỗi đáp án đúng chỉ tính 1 lần (HS điền A,A,A,A,A → chỉ 1 ô đúng).
 * @param answers  đáp án học viên: { "1": "Colour", "2": "here" }
 */
export function gradeGaps(gaps: any, answers: any): GradeResult {
  const norm = normalizeGaps(gaps);
  const ids = Object.keys(norm);

  // Gom nhóm: cùng group → cùng một câu; không group → mỗi ô một "nhóm" riêng.
  const buckets = new Map<string, string[]>();
  for (const id of ids) {
    const key = norm[id].group ? `G:${norm[id].group}` : `S:${id}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(id);
  }

  const resultById: Record<string, GapResult> = {};
  let score = 0;

  for (const [key, gidList] of buckets) {
    const grouped = key.startsWith("G:") && gidList.length > 1;

    // ── Ô đơn: logic cũ ──
    if (!grouped) {
      const id = gidList[0];
      const g = norm[id];
      const studentRaw = answers?.[id];
      const hasAnswer = studentRaw !== undefined && studentRaw !== null && String(studentRaw).trim() !== "";
      const studentNorm = hasAnswer ? normalize(String(studentRaw), !!g.caseSensitive) : "";
      const isCorrect = hasAnswer && g.answers.some((a) => normalize(a, !!g.caseSensitive) === studentNorm);
      if (isCorrect) score++;
      resultById[id] = {
        id,
        type: g.type,
        studentAnswer: hasAnswer ? String(studentRaw) : null,
        correctAnswers: g.answers,
        isCorrect,
      };
      continue;
    }

    // ── Nhóm nhiều đáp án (không thứ tự): chấm theo TẬP, chống lặp ──
    const caseSensitive = !!norm[gidList[0]].caseSensitive;
    // Tập đáp án đúng dùng chung = HỢP tất cả đáp án của các ô trong nhóm.
    const correctNormToDisplay = new Map<string, string>();
    for (const gid of gidList) {
      for (const a of norm[gid].answers) {
        const n = normalize(a, caseSensitive);
        if (n && !correctNormToDisplay.has(n)) correctNormToDisplay.set(n, a);
      }
    }
    const correctDisplay = Array.from(correctNormToDisplay.values());
    const used = new Set<string>();   // đáp án đã "dùng" → lần sau gõ lại không tính

    // Chấm theo thứ tự id để ổn định.
    const ordered = [...gidList].sort(
      (a, b) => (parseInt(a, 10) || 0) - (parseInt(b, 10) || 0) || a.localeCompare(b)
    );
    for (const gid of ordered) {
      const g = norm[gid];
      const studentRaw = answers?.[gid];
      const hasAnswer = studentRaw !== undefined && studentRaw !== null && String(studentRaw).trim() !== "";
      const studentNorm = hasAnswer ? normalize(String(studentRaw), caseSensitive) : "";
      let isCorrect = false;
      if (hasAnswer && correctNormToDisplay.has(studentNorm) && !used.has(studentNorm)) {
        isCorrect = true;
        used.add(studentNorm);
      }
      if (isCorrect) score++;
      resultById[gid] = {
        id: gid,
        type: g.type,
        studentAnswer: hasAnswer ? String(studentRaw) : null,
        correctAnswers: correctDisplay,   // cả tập, cho trang xem lại
        isCorrect,
      };
    }
  }

  // Trả detail theo đúng thứ tự id gốc.
  const detail: GapResult[] = ids.map((id) => resultById[id]).filter(Boolean);
  const maxScore = detail.length;
  const percent = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  return { score, maxScore, percent, detail };
}

/**
 * Gợi ý tự động từ đáp án: chữ cái đầu + số chữ cái.
 * VD "increased" → "i________ (9 chữ)".  "in front of" → "i__ f____ o_ (3 từ)".
 */
function autoHint(answer: string): string {
  const a = String(answer || "").trim();
  if (!a) return "";
  const tokens = a.split(/\s+/);
  if (tokens.length > 1) {
    const masked = tokens.map((w) => w[0] + "_".repeat(Math.max(0, w.length - 1))).join(" ");
    return `${masked} (${tokens.length} từ)`;
  }
  return `${a[0]}${"_".repeat(Math.max(0, a.length - 1))} (${a.length} chữ)`;
}

/**
 * Ẩn đáp án trong gaps khi trả về cho người ĐANG làm bài.
 * Giữ type + options (dropdown cần options để render), bỏ answers.
 * DROPDOWN không có options nhập tay → TỰ SINH đáp án nhiễu (auto-distractor).
 * Ô thuộc NHÓM nhiều-đáp-án: KHÔNG auto-hint (tránh lộ chữ cái đáp án).
 */
export function stripGapAnswers(gaps: any): any {
  if (!gaps || typeof gaps !== "object") return gaps;
  const norm = normalizeGaps(gaps);
  const allCorrect = collectCorrectAnswers(norm);
  const out: Record<string, any> = {};
  for (const [id, g] of Object.entries(norm)) {
    const explicitHint = (g as any).hint?.trim() ? (g as any).hint.trim() : "";
    // Ô trong nhóm: chỉ dùng hint tay (nếu có), tuyệt đối không autoHint.
    const hint = (g as any).group ? explicitHint : (explicitHint || autoHint(g.answers[0] || ""));
    if (g.type === "DRAG") {
      out[id] = { type: "DRAG", answers: Array.isArray(g.answers) ? g.answers : [], hint };
    } else if (g.type === "DROPDOWN") {
      if (Array.isArray(g.options) && g.options.length > 0) {
        out[id] = { type: "DROPDOWN", options: g.options, hint };
      } else {
        const correct = g.answers[0] || "";
        const pool = Object.entries(allCorrect)
          .filter(([gid]) => gid !== id)
          .map(([, v]) => v);
        out[id] = { type: "DROPDOWN", options: buildDropdownOptions(correct, pool), hint };
      }
    } else {
      out[id] = { type: g.type || "TEXT", hint };
    }
  }
  return out;
}