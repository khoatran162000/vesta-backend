/**
 * Quét database tìm học viên 7 ngày không làm bài → tạo notification tự động
 * Gọi hàm này từ setInterval hoặc node-cron
 */
export declare function checkInactiveStudents(): Promise<number>;
