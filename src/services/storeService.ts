/**
 * 매장 서비스 - API 연동
 */
import type { Store, StoreForm, ApiResponse } from '@/types';
import { api } from './api';

export const storeService = {
  // GET /api/stores/me - 내 매장 조회
  async getByManagerId(_managerId: string): Promise<ApiResponse<Store | null>> {
    return api.get<Store | null>('/stores/me');
  },

  // POST /api/stores - 매장 등록
  async create(_managerId: string, form: StoreForm): Promise<ApiResponse<Store>> {
    return api.post<Store>('/stores', form);
  },

  // PUT /api/stores/{storeId} - 매장 정보 수정
  async update(storeId: string, form: StoreForm): Promise<ApiResponse<Store>> {
    return api.put<Store>(`/stores/${storeId}`, form);
  },

  // GET /api/stores/{storeId} - 매장 상세 조회
  async getById(storeId: string): Promise<ApiResponse<Store | null>> {
    return api.get<Store | null>(`/stores/${storeId}`);
  },
};
