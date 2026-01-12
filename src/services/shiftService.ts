/**
 * シフトサービス - API連携
 */
import type { Shift, ShiftForm, ApiResponse } from '@/types';
import { api } from './api';

export const shiftService = {
  // GET /api/stores/{storeId}/shifts
  async getByStoreId(storeId: string): Promise<ApiResponse<Shift[]>> {
    return api.get<Shift[]>(`/stores/${storeId}/shifts`);
  },

  // GET /api/stores/{storeId}/shifts?startDate={startDate}&endDate={endDate}
  async getByDateRange(
    storeId: string,
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<Shift[]>> {
    return api.get<Shift[]>(`/stores/${storeId}/shifts?startDate=${startDate}&endDate=${endDate}`);
  },

  // GET /api/stores/{storeId}/shifts?staffId={staffId}
  async getByStaffId(storeId: string, staffId: string): Promise<ApiResponse<Shift[]>> {
    return api.get<Shift[]>(`/stores/${storeId}/shifts?staffId=${staffId}`);
  },

  // GET /api/shifts/{shiftId}
  async getById(shiftId: string): Promise<ApiResponse<Shift | null>> {
    return api.get<Shift | null>(`/shifts/${shiftId}`);
  },

  // POST /api/stores/{storeId}/shifts (supports date range)
  async create(storeId: string, form: ShiftForm): Promise<ApiResponse<Shift[]>> {
    return api.post<Shift[]>(`/stores/${storeId}/shifts`, form);
  },

  // PUT /api/shifts/{shiftId}
  async update(shiftId: string, form: ShiftForm): Promise<ApiResponse<Shift>> {
    return api.put<Shift>(`/shifts/${shiftId}`, form);
  },

  // DELETE /api/shifts/{shiftId}
  async delete(shiftId: string): Promise<ApiResponse<void>> {
    return api.delete<void>(`/shifts/${shiftId}`);
  },
};
