/**
 * QR 토큰 서비스 - API 연동
 */
import type { QRToken, ApiResponse } from '@/types';
import { api } from './api';

export const qrService = {
  // POST /api/stores/{storeId}/qr-token - QR 토큰 생성/갱신
  async generateToken(storeId: string): Promise<ApiResponse<QRToken>> {
    return api.post<QRToken>(`/stores/${storeId}/qr-token`);
  },

  // POST /api/qr-token/verify - QR 토큰 검증
  async verifyToken(token: string): Promise<ApiResponse<{ storeId: string; valid: boolean }>> {
    return api.post<{ storeId: string; valid: boolean }>('/qr-token/verify', { token });
  },
};
