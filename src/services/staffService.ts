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

  // POST /api/staff/register-request (LIFF에서 알바생이 호출)
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

  // GET /api/stores/{storeId}/staff?status=pending (대기 직원 목록)
  async getPendingStaff(storeId: string): Promise<ApiResponse<Staff[]>> {
    return api.get<Staff[]>(`/stores/${storeId}/staff?status=pending`);
  },

  // POST /api/staff/{staffId}/approve (직원 승인)
  async approve(staffId: string): Promise<ApiResponse<Staff>> {
    return api.post<Staff>(`/staff/${staffId}/approve`);
  },

  // POST /api/staff/{staffId}/reject (직원 거절)
  async reject(staffId: string): Promise<ApiResponse<void>> {
    return api.post<void>(`/staff/${staffId}/reject`);
  },
};
