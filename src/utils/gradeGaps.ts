// FILE: src/utils/gradeGaps.ts
// Chấm điểm cho bài tập kiểu LearnClick (gap fill / dropdown / drag&drop)

export type GapType = "TEXT" | "DROPDOWN" | "DRAG";

export interface GapDef {
  type: GapType;
  answers: string[];        // các đáp án đúng (đã tách từ dấu #)
  options?: string[];       // cho DROPDOWN: danh sách lựa chọn
  caseSensitive?: boolean;  // mặc định false
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
    };
  }
  return out;
}

/**
 * Chấm điểm: so từng gap với đáp án học viên.
 * @param gaps     định nghĩa gap (đã chuẩn hoá hoặc chưa — hàm tự chuẩn hoá)
 * @param answers  đáp án học viên: { "1": "Colour", "2": "here" }
 */
export function gradeGaps(gaps: any, answers: any): GradeResult {
  const norm = normalizeGaps(gaps);
  const detail: GapResult[] = [];
  let score = 0;

  for (const [id, g] of Object.entries(norm)) {
    const studentRaw = answers?.[id];
    const hasAnswer = studentRaw !== undefined && studentRaw !== null && String(studentRaw).trim() !== "";
    const studentNorm = hasAnswer ? normalize(String(studentRaw), !!g.caseSensitive) : "";

    const isCorrect =
      hasAnswer &&
      g.answers.some((a) => normalize(a, !!g.caseSensitive) === studentNorm);

    if (isCorrect) score++;
    detail.push({
      id,
      type: g.type,
      studentAnswer: hasAnswer ? String(studentRaw) : null,
      correctAnswers: g.answers,
      isCorrect,
    });
  }

  const maxScore = detail.length;
  const percent = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  return { score, maxScore, percent, detail };
}

/**
 * Ẩn đáp án trong gaps khi trả về cho người ĐANG làm bài.
 * Giữ type + options (dropdown cần options để render), bỏ answers.
 */
export function stripGapAnswers(gaps: any): any {
  if (!gaps || typeof gaps !== "object") return gaps;
  const out: Record<string, any> = {};
  for (const [id, g] of Object.entries<any>(gaps)) {
    if (g.type === "DRAG") {
      // DRAG: giữ answers để client dựng "ngân hàng từ" để kéo (giống LearnClick).
      // Cái giấu là "từ nào đúng ô nào", không phải tập từ hiện ra.
      out[id] = { type: "DRAG", answers: Array.isArray(g.answers) ? g.answers : [] };
    } else if (g.type === "DROPDOWN") {
      out[id] = { type: "DROPDOWN", ...(Array.isArray(g.options) ? { options: g.options } : {}) };
    } else {
      out[id] = { type: g.type || "TEXT" };
    }
  }
  return out;
}