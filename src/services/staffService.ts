/**
 * スタッフサービス - API連携
 */
import type { Staff, StaffForm, ApiResponse } from '@/types';
import { api } from './api';

export const staffService = {
  // GET /api/stores/{storeId}/staff?active=true
  async getByStoreId(storeId: string): Promise<ApiResponse<Staff[]>> {
    return api.get<Staff[]>(`/stores/${storeId}/staff?active=true`);
  },

  // GET /api/staff/{staffId}
  async getById(staffId: string): Promise<ApiResponse<Staff | null>> {
    return api.get<Staff | null>(`/staff/${staffId}`);
  },

  // POST /api/stores/{storeId}/staff
  async create(storeId: string, form: StaffForm): Promise<ApiResponse<Staff>> {
    return api.post<Staff>(`/stores/${storeId}/staff`, form);
  },

  // PUT /api/staff/{staffId}
  async update(staffId: string, form: StaffForm): Promise<ApiResponse<Staff>> {
    return api.put<Staff>(`/staff/${staffId}`, form);
  },

  // DELETE /api/staff/{staffId}
  async delete(staffId: string): Promise<ApiResponse<void>> {
    return api.delete<void>(`/staff/${staffId}`);
  },

  // POST /api/staff/register-request (LIFFからスタッフが呼び出し)
  async registerRequest(
    storeId: string,
    name: string,
    accessToken: string
  ): Promise<ApiResponse<Staff>> {
    return api.post<Staff>('/staff/register-request', {
      storeId,
      name,
      accessToken,
    });
  },

  // GET /api/stores/{storeId}/staff?status=pending (承認待ちスタッフ一覧)
  async getPendingStaff(storeId: string): Promise<ApiResponse<Staff[]>> {
    return api.get<Staff[]>(`/stores/${storeId}/staff?status=pending`);
  },

  // POST /api/staff/{staffId}/approve (スタッフ承認)
  async approve(staffId: string): Promise<ApiResponse<Staff>> {
    return api.post<Staff>(`/staff/${staffId}/approve`);
  },

  // POST /api/staff/{staffId}/reject (スタッフ却下)
  async reject(staffId: string): Promise<ApiResponse<void>> {
    return api.post<void>(`/staff/${staffId}/reject`);
  },
};
