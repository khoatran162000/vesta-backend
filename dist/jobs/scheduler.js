"use strict";
// FILE: src/jobs/scheduler.ts — Khoi dong cac cronjob
Object.defineProperty(exports, "__esModule", { value: true });
exports.startScheduler = startScheduler;
const inactiveStudentAlert_1 = require("./inactiveStudentAlert");
/**
 * Khởi động scheduler
 * Chạy checkInactiveStudents mỗi 24 giờ (lúc khởi động + mỗi ngày)
 */
function startScheduler() {
    // Chạy lần đầu sau 10 giây (đợi server khởi động xong)
    setTimeout(async () => {
        console.log("[Scheduler] Chạy lần đầu...");
        await (0, inactiveStudentAlert_1.checkInactiveStudents)();
    }, 10000);
    // Chạy lặp lại mỗi 24 giờ
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    setInterval(async () => {
        console.log(`[Scheduler] Chạy cronjob lúc ${new Date().toISOString()}`);
        await (0, inactiveStudentAlert_1.checkInactiveStudents)();
    }, TWENTY_FOUR_HOURS);
    console.log("[Scheduler] Đã đăng ký cronjob: checkInactiveStudents (mỗi 24h)");
}
//# sourceMappingURL=scheduler.js.map