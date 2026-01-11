/**
 * 出退勤サービス - API連携
 */
import type { Attendance, ApiResponse } from '@/types';
import { api } from './api';

export const attendanceService = {
  // GET /api/stores/{storeId}/attendance
  async getByStoreId(storeId: string): Promise<ApiResponse<Attendance[]>> {
    return api.get<Attendance[]>(`/stores/${storeId}/attendance`);
  },

  // GET /api/stores/{storeId}/attendance?startDate={startDate}&endDate={endDate}
  async getByDateRange(
    storeId: string,
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<Attendance[]>> {
    return api.get<Attendance[]>(
      `/stores/${storeId}/attendance?startDate=${startDate}&endDate=${endDate}`
    );
  },

  // GET /api/stores/{storeId}/attendance?staffId={staffId}
  async getByStaffId(storeId: string, staffId: string): Promise<ApiResponse<Attendance[]>> {
    return api.get<Attendance[]>(`/stores/${storeId}/attendance?staffId=${staffId}`);
  },

  // GET /api/stores/{storeId}/attendance?staffId={staffId}&date={today}
  async getTodayByStaffId(storeId: string, staffId: string): Promise<ApiResponse<Attendance | null>> {
    const today = new Date().toISOString().split('T')[0];
    return api.get<Attendance | null>(
      `/stores/${storeId}/attendance?staffId=${staffId}&date=${today}`
    );
  },

  // POST /api/attendance/clock-in
  async clockIn(storeId: string, staffId: string, qrToken?: string): Promise<ApiResponse<Attendance>> {
    return api.post<Attendance>('/attendance/clock-in', { storeId, staffId, qrToken });
  },

  // POST /api/attendance/clock-out
  async clockOut(staffId: string, qrToken?: string): Promise<ApiResponse<Attendance>> {
    return api.post<Attendance>('/attendance/clock-out', { staffId, qrToken });
  },

  // PUT /api/attendance/{attendanceId}
  async manualAdjust(
    attendanceId: string,
    _managerId: string,
    clockIn?: string,
    clockOut?: string,
    note?: string
  ): Promise<ApiResponse<Attendance>> {
    return api.put<Attendance>(`/attendance/${attendanceId}`, { clockIn, clockOut, note });
  },

  // GET /api/attendance/{attendanceId}
  async getById(attendanceId: string): Promise<ApiResponse<Attendance | null>> {
    return api.get<Attendance | null>(`/attendance/${attendanceId}`);
  },

  // POST /api/attendance/clock-in (LINEトークンベース、LIFFから呼び出し)
  async clockInWithToken(
    storeId: string,
    qrToken: string,
    accessToken: string
  ): Promise<ApiResponse<Attendance>> {
    return api.post<Attendance>('/attendance/clock-in', {
      storeId,
      qrToken,
      accessToken,
    });
  },

  // POST /api/attendance/clock-out (LINEトークンベース、LIFFから呼び出し)
  async clockOutWithToken(
    qrToken: string,
    accessToken: string
  ): Promise<ApiResponse<Attendance>> {
    return api.post<Attendance>('/attendance/clock-out', {
      qrToken,
      accessToken,
    });
  },
};
