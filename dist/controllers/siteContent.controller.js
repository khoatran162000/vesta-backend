"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertSiteContent = exports.getSiteContent = exports.listSiteContent = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function parseJsonField(val, fallback) {
    if (val === undefined || val === null || val === "")
        return fallback;
    if (typeof val === "string") {
        try {
            return JSON.parse(val);
        }
        catch {
            return fallback;
        }
    }
    return val;
}
// GET /site-content — tất cả khối (landing + admin đều gọi)
const listSiteContent = async (_req, res) => {
    try {
        const data = await prisma.siteContent.findMany({ orderBy: { key: "asc" } });
        return res.json({ success: true, data });
    }
    catch {
        return res.status(500).json({ success: false, message: "Lỗi tải nội dung" });
    }
};
exports.listSiteContent = listSiteContent;
// GET /site-content/:key — 1 khối theo key
const getSiteContent = async (req, res) => {
    try {
        const item = await prisma.siteContent.findUnique({ where: { key: String(req.params.key) } });
        if (!item)
            return res.status(404).json({ success: false, message: "Không tìm thấy khối" });
        return res.json({ success: true, data: item });
    }
    catch {
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};
exports.getSiteContent = getSiteContent;
// PUT /site-content/:key — cập nhật (tạo nếu chưa có = upsert)
const upsertSiteContent = async (req, res) => {
    try {
        const key = String(req.params.key);
        const dataField = req.file
            ? { ...parseJsonField(req.body.data, {}), qrFromFile: `/uploads/blog/${req.file.filename}` } // trường hợp có upload
            : parseJsonField(req.body.data, {});
        const label = req.body.label || key;
        // Nếu upload QR: gắn qrUrl vào data.bank
        let finalData = parseJsonField(req.body.data, {});
        if (req.file) {
            finalData = { ...finalData, bank: { ...(finalData.bank || {}), qrUrl: `/uploads/blog/${req.file.filename}` } };
        }
        const item = await prisma.siteContent.upsert({
            where: { key },
            update: { data: finalData, label },
            create: { key, label, data: finalData },
        });
        return res.json({ success: true, data: item });
    }
    catch {
        return res.status(500).json({ success: false, message: "Lỗi lưu nội dung" });
    }
};
exports.upsertSiteContent = upsertSiteContent;
//# sourceMappingURL=siteContent.controller.js.map