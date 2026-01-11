/**
 * 店舗サービス - API連携
 */
import type { Store, StoreForm, ApiResponse } from '@/types';
import { api } from './api';

export const storeService = {
  // GET /api/stores/me - 自分の店舗取得
  async getByManagerId(_managerId: string): Promise<ApiResponse<Store | null>> {
    return api.get<Store | null>('/stores/me');
  },

  // POST /api/stores - 店舗登録
  async create(_managerId: string, form: StoreForm): Promise<ApiResponse<Store>> {
    return api.post<Store>('/stores', form);
  },

  // PUT /api/stores/{storeId} - 店舗情報更新
  async update(storeId: string, form: StoreForm): Promise<ApiResponse<Store>> {
    return api.put<Store>(`/stores/${storeId}`, form);
  },

  // GET /api/stores/{storeId} - 店舗詳細取得
  async getById(storeId: string): Promise<ApiResponse<Store | null>> {
    return api.get<Store | null>(`/stores/${storeId}`);
  },
};
