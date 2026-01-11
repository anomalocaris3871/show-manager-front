/**
 * QRトークンサービス - API連携
 */
import type { QRToken, ApiResponse } from '@/types';
import { api } from './api';

export const qrService = {
  // POST /api/stores/{storeId}/qr-token - QRトークン生成/更新
  async generateToken(storeId: string): Promise<ApiResponse<QRToken>> {
    return api.post<QRToken>(`/stores/${storeId}/qr-token`);
  },

  // POST /api/qr-token/verify - QRトークン検証
  async verifyToken(token: string): Promise<ApiResponse<{ storeId: string; valid: boolean }>> {
    return api.post<{ storeId: string; valid: boolean }>('/qr-token/verify', { token });
  },
};
