"use strict";
// FILE: src/utils/gradeGaps.ts
// Chấm điểm cho bài tập kiểu LearnClick (gap fill / dropdown / drag&drop)
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitAnswers = splitAnswers;
exports.normalizeGaps = normalizeGaps;
exports.gradeGaps = gradeGaps;
exports.stripGapAnswers = stripGapAnswers;
/**
 * Chuẩn hoá 1 chuỗi để so sánh: trim + (tuỳ chọn) lowercase
 */
function normalize(s, caseSensitive) {
    const trimmed = String(s ?? "").trim();
    return caseSensitive ? trimmed : trimmed.toLowerCase();
}
/**
 * Tách đáp án nhiều phương án ngăn bằng dấu #  →  mảng
 * VD: "color#colour" → ["color", "colour"]
 * Dùng khi LƯU bài (chuẩn hoá gaps trước khi cất DB).
 */
function splitAnswers(raw) {
    return String(raw ?? "")
        .split("#")
        .map((a) => a.trim())
        .filter((a) => a.length > 0);
}
/**
 * Chuẩn hoá toàn bộ gaps khi lưu: đảm bảo answers luôn là mảng đã tách #
 * Chấp nhận answers dạng string ("a#b") hoặc đã là mảng.
 */
function normalizeGaps(gaps) {
    const out = {};
    if (!gaps || typeof gaps !== "object")
        return out;
    for (const [id, g] of Object.entries(gaps)) {
        let answers;
        if (Array.isArray(g.answers)) {
            // mảng có thể vẫn chứa phần tử có #, tách tiếp cho chắc
            answers = g.answers.flatMap((a) => splitAnswers(a));
        }
        else {
            answers = splitAnswers(g.answers);
        }
        out[id] = {
            type: g.type || "TEXT",
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
function gradeGaps(gaps, answers) {
    const norm = normalizeGaps(gaps);
    const detail = [];
    let score = 0;
    for (const [id, g] of Object.entries(norm)) {
        const studentRaw = answers?.[id];
        const hasAnswer = studentRaw !== undefined && studentRaw !== null && String(studentRaw).trim() !== "";
        const studentNorm = hasAnswer ? normalize(String(studentRaw), !!g.caseSensitive) : "";
        const isCorrect = hasAnswer &&
            g.answers.some((a) => normalize(a, !!g.caseSensitive) === studentNorm);
        if (isCorrect)
            score++;
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
function stripGapAnswers(gaps) {
    if (!gaps || typeof gaps !== "object")
        return gaps;
    const out = {};
    for (const [id, g] of Object.entries(gaps)) {
        if (g.type === "DRAG") {
            // DRAG: giữ answers để client dựng "ngân hàng từ" để kéo (giống LearnClick).
            // Cái giấu là "từ nào đúng ô nào", không phải tập từ hiện ra.
            out[id] = { type: "DRAG", answers: Array.isArray(g.answers) ? g.answers : [] };
        }
        else if (g.type === "DROPDOWN") {
            out[id] = { type: "DROPDOWN", ...(Array.isArray(g.options) ? { options: g.options } : {}) };
        }
        else {
            out[id] = { type: g.type || "TEXT" };
        }
    }
    return out;
}
//# sourceMappingURL=gradeGaps.js.map