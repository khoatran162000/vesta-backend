export type GapType = "TEXT" | "DROPDOWN" | "DRAG";
export interface GapDef {
    type: GapType;
    answers: string[];
    options?: string[];
    caseSensitive?: boolean;
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
    score: number;
    maxScore: number;
    percent: number;
    detail: GapResult[];
}
/**
 * Tách đáp án nhiều phương án ngăn bằng dấu #  →  mảng
 * VD: "color#colour" → ["color", "colour"]
 * Dùng khi LƯU bài (chuẩn hoá gaps trước khi cất DB).
 */
export declare function splitAnswers(raw: string): string[];
/**
 * Chuẩn hoá toàn bộ gaps khi lưu: đảm bảo answers luôn là mảng đã tách #
 * Chấp nhận answers dạng string ("a#b") hoặc đã là mảng.
 */
export declare function normalizeGaps(gaps: any): GapMap;
/**
 * Chấm điểm: so từng gap với đáp án học viên.
 * @param gaps     định nghĩa gap (đã chuẩn hoá hoặc chưa — hàm tự chuẩn hoá)
 * @param answers  đáp án học viên: { "1": "Colour", "2": "here" }
 */
export declare function gradeGaps(gaps: any, answers: any): GradeResult;
/**
 * Ẩn đáp án trong gaps khi trả về cho người ĐANG làm bài.
 * Giữ type + options (dropdown cần options để render), bỏ answers.
 */
export declare function stripGapAnswers(gaps: any): any;
