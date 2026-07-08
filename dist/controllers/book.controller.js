"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBook = exports.updateBook = exports.createBook = exports.getBook = exports.listBooks = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function toBool(v, def = false) {
    if (v === undefined || v === null)
        return def;
    if (typeof v === "boolean")
        return v;
    return v === "true" || v === "1" || v === 1;
}
const listBooks = async (req, res) => {
    try {
        const user = req.user;
        const isStaff = user?.role === "ADMIN" || user?.role === "TEACHER";
        const where = isStaff ? {} : { isPublished: true };
        const data = await prisma.book.findMany({ where, orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }] });
        return res.json({ success: true, data });
    }
    catch {
        return res.status(500).json({ success: false, message: "Lỗi tải danh sách sách" });
    }
};
exports.listBooks = listBooks;
const getBook = async (req, res) => {
    try {
        const b = await prisma.book.findUnique({ where: { id: String(req.params.id) } });
        if (!b)
            return res.status(404).json({ success: false, message: "Không tìm thấy" });
        return res.json({ success: true, data: b });
    }
    catch {
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};
exports.getBook = getBook;
const createBook = async (req, res) => {
    try {
        const b = req.body;
        if (!b.title || !b.price)
            return res.status(400).json({ success: false, message: "Thiếu tên hoặc giá sách" });
        const book = await prisma.book.create({
            data: {
                title: b.title, price: b.price,
                highlight: toBool(b.highlight),
                orderIndex: b.orderIndex ? parseInt(String(b.orderIndex), 10) : 0,
                isPublished: toBool(b.isPublished, true),
            },
        });
        return res.status(201).json({ success: true, data: book });
    }
    catch {
        return res.status(500).json({ success: false, message: "Lỗi tạo sách" });
    }
};
exports.createBook = createBook;
const updateBook = async (req, res) => {
    try {
        const id = String(req.params.id);
        const existing = await prisma.book.findUnique({ where: { id } });
        if (!existing)
            return res.status(404).json({ success: false, message: "Không tìm thấy" });
        const b = req.body;
        const data = {};
        if (b.title !== undefined)
            data.title = b.title;
        if (b.price !== undefined)
            data.price = b.price;
        if (b.highlight !== undefined)
            data.highlight = toBool(b.highlight);
        if (b.orderIndex !== undefined)
            data.orderIndex = parseInt(String(b.orderIndex), 10) || 0;
        if (b.isPublished !== undefined)
            data.isPublished = toBool(b.isPublished);
        const book = await prisma.book.update({ where: { id }, data });
        return res.json({ success: true, data: book });
    }
    catch {
        return res.status(500).json({ success: false, message: "Lỗi cập nhật" });
    }
};
exports.updateBook = updateBook;
const deleteBook = async (req, res) => {
    try {
        await prisma.book.delete({ where: { id: String(req.params.id) } });
        return res.json({ success: true, message: "Đã xoá" });
    }
    catch {
        return res.status(500).json({ success: false, message: "Lỗi xoá" });
    }
};
exports.deleteBook = deleteBook;
//# sourceMappingURL=book.controller.js.map