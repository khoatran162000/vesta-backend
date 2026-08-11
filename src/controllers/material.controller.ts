// FILE: src/controllers/material.controller.ts — Tài liệu bán (free/paid) + đơn hàng (MVP: CK thủ công)
// Model: ShopItem (shop_items) + ShopOrder (shop_orders) — tách hẳn Material cũ (giáo trình).
import { Request, Response } from "express";
import prisma from "../config/database";
import bcrypt from "bcryptjs";
import { generateStudentCode } from "./user.controller";
import { sendNewAccountMail } from "../utils/mailer";

// Sinh mã đơn ngắn, dễ đọc (nội dung CK)
function genCode(): string {
  const s = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `VESTA${s}`;
}

// ═══════════ TÀI LIỆU (ShopItem) ═══════════
// GET /api/materials — public: list tài liệu đã publish; admin (?all=1) lấy cả chưa publish
export const listMaterials = async (req: Request, res: Response) => {
  try {
    const all = req.query.all === "1";
    const rows = await prisma.shopItem.findMany({
      where: all ? {} : { published: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: all
        ? undefined
        : { id: true, title: true, description: true, type: true, price: true, thumbnailUrl: true, category: true, fileUrl: true, downloadCount: true },
    });
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error("List materials error:", err);
    return res.status(500).json({ success: false, message: "Lỗi tải tài liệu" });
  }
};

// POST /api/materials — admin tạo (kèm upload file, field "file")
export const createMaterial = async (req: Request, res: Response) => {
  try {
    const { title, description, type, price, thumbnailUrl, category, published, sortOrder } = req.body;
    if (!title) return res.status(400).json({ success: false, message: "Thiếu tiêu đề" });
    const fileUrl = (req as any).file ? `/uploads/materials/${(req as any).file.filename}` : (req.body.fileUrl || null);
    const m = await prisma.shopItem.create({
      data: {
        title: String(title).trim(),
        description: description || null,
        type: type === "PAID" ? "PAID" : "FREE",
        price: type === "PAID" ? Math.max(0, Number(price) || 0) : 0,
        fileUrl,
        thumbnailUrl: thumbnailUrl || null,
        category: category || null,
        published: published === "false" ? false : Boolean(published ?? true),
        sortOrder: Number(sortOrder) || 0,
      },
    });
    return res.status(201).json({ success: true, data: m });
  } catch (err) {
    console.error("Create material error:", err);
    return res.status(500).json({ success: false, message: "Lỗi tạo tài liệu" });
  }
};

// PUT /api/materials/:id — admin sửa (có thể kèm file mới)
export const updateMaterial = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { title, description, type, price, thumbnailUrl, category, published, sortOrder } = req.body;
    const data: any = {};
    if (title !== undefined) data.title = String(title).trim();
    if (description !== undefined) data.description = description || null;
    if (type !== undefined) { data.type = type === "PAID" ? "PAID" : "FREE"; data.price = type === "PAID" ? Math.max(0, Number(price) || 0) : 0; }
    else if (price !== undefined) data.price = Math.max(0, Number(price) || 0);
    if (thumbnailUrl !== undefined) data.thumbnailUrl = thumbnailUrl || null;
    if (category !== undefined) data.category = category || null;
    if (published !== undefined) data.published = published === "false" ? false : Boolean(published);
    if (sortOrder !== undefined) data.sortOrder = Number(sortOrder) || 0;
    if ((req as any).file) data.fileUrl = `/uploads/materials/${(req as any).file.filename}`;
    const m = await prisma.shopItem.update({ where: { id }, data });
    return res.json({ success: true, data: m });
  } catch (err) {
    console.error("Update material error:", err);
    return res.status(500).json({ success: false, message: "Lỗi cập nhật" });
  }
};

// DELETE /api/materials/:id — admin
export const deleteMaterial = async (req: Request, res: Response) => {
  try {
    await prisma.shopItem.delete({ where: { id: String(req.params.id) } });
    return res.json({ success: true, message: "Đã xoá" });
  } catch (err) {
    console.error("Delete material error:", err);
    return res.status(500).json({ success: false, message: "Lỗi xoá" });
  }
};

// GET /api/materials/:id/download — public: tải tài liệu FREE (tăng đếm)
export const downloadFreeMaterial = async (req: Request, res: Response) => {
  try {
    const m = await prisma.shopItem.findUnique({ where: { id: String(req.params.id) } });
    if (!m || !m.published) return res.status(404).json({ success: false, message: "Không tìm thấy" });
    if (m.type !== "FREE") return res.status(403).json({ success: false, message: "Tài liệu này cần mua" });
    await prisma.shopItem.update({ where: { id: m.id }, data: { downloadCount: { increment: 1 } } });
    return res.json({ success: true, data: { fileUrl: m.fileUrl } });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Lỗi tải" });
  }
};

// ═══════════ ĐƠN HÀNG (ShopOrder) ═══════════
// POST /api/orders — public: tạo đơn (mua tài liệu paid HOẶC nộp bài chấm)
export const createOrder = async (req: Request, res: Response) => {
  try {
    const { kind, materialId, gradingType, essayText, speakingLink, customerName, customerEmail, customerPhone } = req.body;
    if (!customerName || !customerEmail) return res.status(400).json({ success: false, message: "Thiếu tên hoặc email" });
    let amount = 0, mId: string | null = null;
    if (kind === "MATERIAL") {
      const m = await prisma.shopItem.findUnique({ where: { id: String(materialId) } });
      if (!m || m.type !== "PAID") return res.status(400).json({ success: false, message: "Tài liệu không hợp lệ" });
      amount = m.price; mId = m.id;
    } else if (kind === "GRADING") {
      if (!essayText && !speakingLink) return res.status(400).json({ success: false, message: "Nhập bài luận hoặc link speaking" });
      amount = Number(req.body.amount) || 0;
    } else return res.status(400).json({ success: false, message: "Loại đơn không hợp lệ" });

    // sinh mã đơn không trùng
    let code = genCode();
    for (let i = 0; i < 5; i++) { const dup = await prisma.shopOrder.findUnique({ where: { code } }); if (!dup) break; code = genCode(); }

    const order = await prisma.shopOrder.create({
      data: {
        code, kind, status: "PENDING",
        customerName: String(customerName).trim(), customerEmail: String(customerEmail).trim(), customerPhone: customerPhone || null,
        itemId: mId, gradingType: gradingType || null, essayText: essayText || null, speakingLink: speakingLink || null,
        amount,
      },
    });
    // ── C1: tao TK hoc vien "cham bai" + thong bao (khong chan neu loi) ──
    let account: { studentCode: string | null; tempPassword?: string; isNew: boolean } | null = null;
    if (kind === "GRADING") {
      try {
        const emailNorm = String(customerEmail).trim().toLowerCase();
        let user = await prisma.user.findFirst({ where: { email: emailNorm } });
        if (!user) {
          const studentCode = await generateStudentCode();
          const tempPassword = Math.random().toString(36).slice(-8);
          const passwordHash = await bcrypt.hash(tempPassword, 12);
          user = await prisma.user.create({
            data: {
              email: emailNorm, studentCode, passwordHash,
              fullName: String(customerName).trim(),
              phone: customerPhone || null,
              role: "STUDENT", regStatus: "GRADING_ONLY", isActive: true,
            },
          });
          account = { studentCode, tempPassword, isNew: true };
          // gửi email TK (khong chan neu loi)
          sendNewAccountMail(emailNorm, String(customerName).trim(), studentCode, tempPassword).catch(() => {});
        } else {
          account = { studentCode: user.studentCode, isNew: false };
        }
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: "SYSTEM_AUTO",
            title: "Đã nhận bài chấm chữa",
            message: `Chúng tôi đã nhận bài của bạn (mã đơn ${order.code}). Giáo viên sẽ chấm và trả kết quả tại đây — vui lòng theo dõi mục Thông báo.`,
          },
        });
      } catch (e) {
        console.error("Tao TK cham bai loi (bo qua, don van tao):", e);
      }
    }
    return res.status(201).json({ success: true, data: { code: order.code, amount: order.amount, id: order.id, account } });
  } catch (err) {
    console.error("Create order error:", err);
    return res.status(500).json({ success: false, message: "Lỗi tạo đơn" });
  }
};

// GET /api/orders/track?code=&email= — public: HS tra đơn
export const trackOrder = async (req: Request, res: Response) => {
  try {
    const code = String(req.query.code || "").trim();
    const email = String(req.query.email || "").trim().toLowerCase();
    if (!code || !email) return res.status(400).json({ success: false, message: "Nhập mã đơn và email" });
    const o = await prisma.shopOrder.findUnique({ where: { code }, include: { item: { select: { title: true } } } });
    if (!o || o.customerEmail.toLowerCase() !== email) return res.status(404).json({ success: false, message: "Không tìm thấy đơn" });
    return res.json({
      success: true,
      data: {
        code: o.code, kind: o.kind, status: o.status, amount: o.amount,
        materialTitle: o.item?.title || null, gradingType: o.gradingType,
        deliverUrl: o.status === "DELIVERED" ? o.deliverUrl : null,  // chỉ trả link khi đã giao
        createdAt: o.createdAt,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Lỗi tra đơn" });
  }
};

// GET /api/orders — admin: list đơn (lọc status/kind)
export const listOrders = async (req: Request, res: Response) => {
  try {
    const where: any = {};
    if (req.query.status) where.status = String(req.query.status);
    if (req.query.kind) where.kind = String(req.query.kind);
    const rows = await prisma.shopOrder.findMany({ where, orderBy: { createdAt: "desc" }, include: { item: { select: { title: true } } } });
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Lỗi tải đơn" });
  }
};

// PATCH /api/orders/:id — admin: đổi trạng thái / gán giá / gán file giao (field "file")
export const updateOrder = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { status, amount, deliverUrl, adminNote } = req.body;
    const data: any = {};
    if (amount !== undefined) data.amount = Math.max(0, Number(amount) || 0);
    if (adminNote !== undefined) data.adminNote = adminNote || null;
    if (deliverUrl !== undefined) data.deliverUrl = deliverUrl || null;
    if ((req as any).file) data.deliverUrl = `/uploads/materials/${(req as any).file.filename}`;
    if (status) {
      data.status = status;
      if (status === "PAID") data.paidAt = new Date();
      if (status === "DELIVERED") data.deliveredAt = new Date();
    }
    // Nếu giao đơn MUA TÀI LIỆU mà chưa có file giao → tự lấy file gốc của tài liệu
    if (status === "DELIVERED" && !data.deliverUrl) {
      const cur = await prisma.shopOrder.findUnique({ where: { id }, include: { item: true } });
      if (cur?.kind === "MATERIAL" && !cur.deliverUrl && cur.item?.fileUrl) {
        data.deliverUrl = cur.item.fileUrl;
      }
    }
    const o = await prisma.shopOrder.update({ where: { id }, data });
    return res.json({ success: true, data: o });
  } catch (err) {
    console.error("Update order error:", err);
    return res.status(500).json({ success: false, message: "Lỗi cập nhật đơn" });
  }
};

// GET /api/orders/count-pending — admin: đếm đơn chờ xử lý (PENDING + PAID chưa giao)
export const countPendingOrders = async (_req: Request, res: Response) => {
  try {
    const count = await prisma.shopOrder.count({ where: { status: { in: ["PENDING", "PAID"] } } });
    return res.json({ success: true, data: { count } });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Lỗi đếm đơn" });
  }
};