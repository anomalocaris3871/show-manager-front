/**
 * 스태프 서비스 - API 연동
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

  // POST /api/staff/{staffId}/regenerate-link-code
  async regenerateLinkCode(staffId: string): Promise<ApiResponse<string>> {
    return api.post<string>(`/staff/${staffId}/regenerate-link-code`);
  },

  // POST /api/staff/link (LINE Bot에서 호출)
  async linkWithLine(linkCode: string, lineUserId: string): Promise<ApiResponse<Staff>> {
    return api.post<Staff>('/staff/link', { linkCode, lineUserId });
  },
};
