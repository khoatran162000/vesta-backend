/**
 * FILE: auth.controller.ts
 * PATH: apps/api/src/controllers/auth.controller.ts
 * MÔ TẢ: Xử lý đăng nhập, refresh token, lấy thông tin user, đổi mật khẩu
 */

import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../config/database";
import { generateTokenPair, verifyRefreshToken } from "../utils/jwt";
import * as api from "../utils/apiResponse";

// POST /api/auth/login
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return api.error(res, "Email và mật khẩu không được để trống");
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return api.error(res, "Email hoặc mật khẩu không đúng", 401);
    }

    if (!user.isActive) {
      return api.error(res, "Tài khoản đã bị khoá. Liên hệ Admin.", 403);
    }

    // Chỉ cho phép ADMIN và CONTENT_CREATOR đăng nhập CMS
    if (!["ADMIN", "CONTENT_CREATOR", "TEACHER"].includes(user.role)) {
      return api.error(res, "Tài khoản không có quyền truy cập CMS", 403);
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return api.error(res, "Email hoặc mật khẩu không đúng", 401);
    }

    const payload = { userId: user.id, email: user.email, role: user.role };
    const tokens = generateTokenPair(payload);

    return api.success(res, {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    }, "Đăng nhập thành công");
  } catch (err) {
    console.error("Login error:", err);
    return api.error(res, "Lỗi server", 500);
  }
}

// POST /api/auth/refresh
export async function refresh(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return api.error(res, "Refresh token không được để trống", 401);
    }

    const payload = verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.isActive) {
      return api.error(res, "Tài khoản không tồn tại hoặc đã bị khoá", 401);
    }

    const newPayload = { userId: user.id, email: user.email, role: user.role };
    const tokens = generateTokenPair(newPayload);

    return api.success(res, tokens, "Token đã được làm mới");
  } catch (err) {
    return api.error(res, "Refresh token không hợp lệ hoặc đã hết hạn", 401);
  }
}

// GET /api/auth/me
export async function getMe(req: Request, res: Response) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      return api.error(res, "Tài khoản không tồn tại", 404);
    }

    return api.success(res, user);
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}

// PUT /api/auth/profile
export async function updateProfile(req: Request, res: Response) {
  try {
    const { fullName } = req.body;
    const avatarUrl = req.file ? `/uploads/avatars/${req.file.filename}` : undefined;

    const updateData: any = {};
    if (fullName) updateData.fullName = fullName;
    if (avatarUrl) updateData.avatarUrl = avatarUrl;

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        avatarUrl: true,
      },
    });

    return api.success(res, user, "Cập nhật hồ sơ thành công");
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}

// PUT /api/auth/change-password
export async function changePassword(req: Request, res: Response) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return api.error(res, "Mật khẩu hiện tại và mật khẩu mới không được để trống");
    }

    if (newPassword.length < 6) {
      return api.error(res, "Mật khẩu mới phải có ít nhất 6 ký tự");
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) {
      return api.error(res, "Tài khoản không tồn tại", 404);
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return api.error(res, "Mật khẩu hiện tại không đúng", 400);
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    return api.success(res, null, "Đổi mật khẩu thành công");
  } catch (err) {
    return api.error(res, "Lỗi server", 500);
  }
}