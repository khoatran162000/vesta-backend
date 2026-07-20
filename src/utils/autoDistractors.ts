// FILE: src/utils/autoDistractors.ts
// Tự sinh đáp án nhiễu cho dropdown (giống LearnClick "automated dropdown").
// Nguồn nhiễu: (1) ưu tiên đáp án đúng của các gap KHÁC trong bài,
//              (2) thiếu thì bổ sung từ ngân hàng nhiễu chung theo "hình dạng" từ.
// Không cần AI: chọn theo tương đồng số-từ / độ-dài / kiểu-chữ với đáp án đúng.

const NUM_OPTIONS = 4; // 1 đúng + 3 nhiễu

// Ngân hàng nhiễu chung — nhóm theo chủ đề hay gặp trong đề IELTS.
// Dùng khi các gap khác không cung cấp đủ ứng viên "giống".
const FALLBACK_BANK: string[] = [
  // xu hướng tăng/giảm (Writing Task 1 & Reading)
  "increased", "decreased", "rose", "fell", "declined", "grew", "dropped",
  "remained", "fluctuated", "peaked", "stabilised", "surged", "plunged",
  // liên từ / nối
  "however", "therefore", "moreover", "although", "whereas", "furthermore",
  "nevertheless", "consequently", "meanwhile", "despite",
  // giới từ
  "in", "on", "at", "by", "for", "with", "from", "between", "during", "through",
  // lượng
  "many", "much", "several", "few", "little", "most", "some", "various",
  // tính từ đánh giá
  "significant", "slight", "gradual", "sharp", "steady", "dramatic", "marginal",
];

function words(s: string): number {
  return String(s).trim().split(/\s+/).filter(Boolean).length;
}
function isNumeric(s: string): boolean {
  return /^[\d.,%\s]+$/.test(String(s).trim());
}
function firstUpper(s: string): boolean {
  const t = String(s).trim();
  return t.length > 0 && t[0] === t[0].toUpperCase() && t[0] !== t[0].toLowerCase();
}
function norm(s: string): string {
  return String(s ?? "").trim().toLowerCase();
}

/**
 * Điểm tương đồng giữa ứng viên nhiễu và đáp án đúng.
 * Càng cao càng "giống thật" → ưu tiên chọn. (chị nhớ: giống số từ / độ dài / kiểu)
 */
function similarity(cand: string, ans: string): number {
  let score = 0;
  // cùng số từ (1 từ vs cụm) — yếu tố mạnh nhất
  if (words(cand) === words(ans)) score += 5;
  else score -= Math.abs(words(cand) - words(ans)) * 2;
  // độ dài ký tự gần nhau
  const dl = Math.abs(cand.length - ans.length);
  score += Math.max(0, 4 - Math.floor(dl / 3));
  // cùng "kiểu": số/chữ, viết hoa đầu
  if (isNumeric(cand) === isNumeric(ans)) score += 2;
  if (firstUpper(cand) === firstUpper(ans)) score += 1;
  return score;
}

/** Chuẩn hoá kiểu chữ ứng viên cho khớp đáp án đúng (viết hoa đầu nếu đáp án viết hoa) */
function matchCase(cand: string, ans: string): string {
  if (firstUpper(ans) && !firstUpper(cand)) {
    return cand.charAt(0).toUpperCase() + cand.slice(1);
  }
  if (!firstUpper(ans) && firstUpper(cand)) {
    return cand.charAt(0).toLowerCase() + cand.slice(1);
  }
  return cand;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Sinh options cho MỘT dropdown.
 * @param correct  đáp án đúng của gap này (lấy answers[0])
 * @param pool     kho đáp án đúng của các gap KHÁC trong bài (đã loại gap này)
 */
export function buildDropdownOptions(correct: string, pool: string[]): string[] {
  const correctNorm = norm(correct);
  // ứng viên từ gap khác: loại trùng đáp án đúng + loại trùng nhau
  const seen = new Set<string>([correctNorm]);
  const fromPool: string[] = [];
  for (const p of pool) {
    const n = norm(p);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    fromPool.push(p);
  }
  // xếp theo độ giống đáp án đúng, lấy tốt nhất trước
  fromPool.sort((a, b) => similarity(b, correct) - similarity(a, correct));
  let distractors = fromPool.slice(0, NUM_OPTIONS - 1);
  // thiếu → bổ sung từ ngân hàng chung (cũng ưu tiên giống)
  if (distractors.length < NUM_OPTIONS - 1) {
    const bank = FALLBACK_BANK
      .filter((w) => {
        const n = norm(w);
        return !seen.has(n);
      })
      .sort((a, b) => similarity(b, correct) - similarity(a, correct));
    for (const w of bank) {
      if (distractors.length >= NUM_OPTIONS - 1) break;
      distractors.push(matchCase(w, correct));
      seen.add(norm(w));
    }
  }
  // gộp đáp án đúng + nhiễu, trộn ngẫu nhiên
  return shuffle([correct, ...distractors]);
}

/**
 * Gom kho đáp án đúng của tất cả gap (để làm pool nhiễu chéo).
 * Trả map: gapId → đáp án đúng đại diện (answers[0]).
 */
export function collectCorrectAnswers(gaps: Record<string, any>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [id, g] of Object.entries(gaps)) {
    const ans = Array.isArray(g.answers) ? g.answers : [];
    if (ans.length > 0 && String(ans[0]).trim()) out[id] = String(ans[0]).trim();
  }
  return out;
}