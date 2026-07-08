/**
 * FILE: jwt.ts
 * PATH: apps/api/src/utils/jwt.ts
 * MÔ TẢ: Helper tạo/verify JWT access token + refresh token
 */
export interface TokenPayload {
    userId: string;
    role: string;
}
export declare function generateAccessToken(payload: TokenPayload): string;
export declare function generateRefreshToken(payload: TokenPayload): string;
export declare function verifyAccessToken(token: string): TokenPayload;
export declare function verifyRefreshToken(token: string): TokenPayload;
export declare function generateTokenPair(payload: TokenPayload): {
    accessToken: string;
    refreshToken: string;
};
