<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAttendanceStore } from '@/stores/attendance';
import { useStaffStore } from '@/stores/staff';
import { useStoreStore } from '@/stores/store';
import { useSubscriptionStore } from '@/stores/subscription';
import { useFeatureGate } from '@/composables/useFeatureGate';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import PricingModal from '@/components/subscription/PricingModal.vue';
import dayjs from 'dayjs';

const attendanceStore = useAttendanceStore();
const staffStore = useStaffStore();
const storeStore = useStoreStore();
const subscriptionStore = useSubscriptionStore();
const { isPremium, showUpgradePrompt } = useFeatureGate();

const selectedMonth = ref(dayjs().format('YYYY-MM'));
const showPricingModal = ref(false);

interface StaffSalary {
  staffId: string;
  staffName: string;
  hourlyWage: number;
  nightWage: number; // 深夜時給（スタッフ設定値）
  totalMinutes: number;
  totalHours: number;
  nightMinutes: number; // 深夜勤務時間
  nightHours: number;
  baseSalary: number; // 基本給
  nightAllowance: number; // 深夜手当
  totalSalary: number; // 合計
  workDays: number;
}

/**
 * 深夜時間（22:00-05:00）の分数を計算
 */
function calculateNightMinutes(clockIn: string, clockOut: string): number {
  const start = dayjs(clockIn);
  const end = dayjs(clockOut);

  let nightMinutes = 0;
  let current = start;

  // 1分ずつチェック（精度を保つため）
  while (current.isBefore(end)) {
    const hour = current.hour();
    // 22:00-23:59 または 00:00-04:59 が深夜時間帯
    if (hour >= 22 || hour < 5) {
      nightMinutes++;
    }
    current = current.add(1, 'minute');
  }

  return nightMinutes;
}

const salaryData = computed((): StaffSalary[] => {
  if (!isPremium.value) return [];

  const staffList = staffStore.activeStaff;
  const result: StaffSalary[] = [];

  for (const staff of staffList) {
    const attendances = attendanceStore.attendanceList.filter(
      (a) => a.staffId === staff.id && a.date.startsWith(selectedMonth.value)
    );

    let totalMinutes = 0;
    let nightMinutes = 0;
    let workDays = 0;

    for (const attendance of attendances) {
      if (attendance.clockIn && attendance.clockOut) {
        const start = dayjs(attendance.clockIn);
        const end = dayjs(attendance.clockOut);
        const minutes = end.diff(start, 'minute');

        if (minutes > 0) {
          totalMinutes += minutes;
          nightMinutes += calculateNightMinutes(attendance.clockIn, attendance.clockOut);
          workDays++;
        }
      }
    }

    const totalHours = totalMinutes / 60;
    const nightHours = nightMinutes / 60;
    const nightWage = staff.nightWage || Math.round(staff.hourlyWage * 1.25);

    // 基本給 = 時給 × 総勤務時間
    const baseSalary = Math.round((staff.hourlyWage * totalMinutes) / 60);

    // 深夜手当 = (深夜時給 - 基本時給) × 深夜時間
    const nightAllowance = Math.round(((nightWage - staff.hourlyWage) * nightMinutes) / 60);

    // 合計給料
    const totalSalary = baseSalary + nightAllowance;

    result.push({
      staffId: staff.id,
      staffName: staff.name,
      hourlyWage: staff.hourlyWage,
      nightWage,
      totalMinutes,
      totalHours,
      nightMinutes,
      nightHours,
      baseSalary,
      nightAllowance,
      totalSalary,
      workDays,
    });
  }

  return result.sort((a, b) => b.totalSalary - a.totalSalary);
});

const totalBaseSalary = computed(() => {
  return salaryData.value.reduce((sum, s) => sum + s.baseSalary, 0);
});

const totalNightAllowance = computed(() => {
  return salaryData.value.reduce((sum, s) => sum + s.nightAllowance, 0);
});

const totalSalary = computed(() => {
  return salaryData.value.reduce((sum, s) => sum + s.totalSalary, 0);
});

const totalHours = computed(() => {
  return salaryData.value.reduce((sum, s) => sum + s.totalHours, 0);
});

const totalNightHours = computed(() => {
  return salaryData.value.reduce((sum, s) => sum + s.nightHours, 0);
});

onMounted(async () => {
  if (!storeStore.currentStore) {
    await storeStore.fetchStore();
  }
  await Promise.all([
    staffStore.fetchStaff(),
    attendanceStore.fetchAttendance(),
    subscriptionStore.fetchSubscription(),
  ]);
});

function formatHours(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hours}時間${mins}分`;
}

function handleUpgrade() {
  showPricingModal.value = true;
}

function exportCSV() {
  if (!isPremium.value) {
    showUpgradePrompt();
    return;
  }

  const headers = ['スタッフ名', '時給', '深夜時給', '勤務日数', '総勤務時間', '深夜時間', '基本給', '深夜手当', '合計給料'];
  const rows = salaryData.value.map((s) => [
    s.staffName,
    s.hourlyWage,
    s.nightWage,
    s.workDays,
    formatHours(s.totalMinutes),
    formatHours(s.nightMinutes),
    s.baseSalary,
    s.nightAllowance,
    s.totalSalary,
  ]);

  // 合計行を追加
  rows.push([
    '合計',
    '',
    '',
    '',
    `${totalHours.value.toFixed(1)}時間`,
    `${totalNightHours.value.toFixed(1)}時間`,
    totalBaseSalary.value,
    totalNightAllowance.value,
    totalSalary.value,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `給料_${selectedMonth.value}.csv`;
  link.click();
}
</script>

<template>
  <div>
    <!-- Premium制限表示 -->
    <div v-if="!isPremium" class="card mb-6 bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
      <div class="flex items-center justify-between">
        <div class="flex items-start gap-4">
          <div class="p-3 bg-primary-500 rounded-lg">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">給料計算はPremium機能です</h3>
            <p class="text-sm text-gray-600 mt-1">
              月額¥500で、スタッフの給料を自動計算。出退勤記録から勤務時間を集計し、時給に基づいて給料を算出します。
            </p>
            <ul class="text-sm text-gray-600 mt-2 space-y-1">
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                月別給料レポート
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                深夜手当（22:00-05:00）自動計算
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                CSVエクスポート
              </li>
            </ul>
          </div>
        </div>
        <button @click="handleUpgrade" class="btn btn-primary whitespace-nowrap">
          Premiumにアップグレード
        </button>
      </div>
    </div>

    <!-- Premium会員向けコンテンツ -->
    <template v-if="isPremium">
      <!-- フィルター -->
      <div class="card mb-6">
        <div class="flex flex-wrap items-end gap-4">
          <div>
            <label class="label">対象月</label>
            <input
              v-model="selectedMonth"
              type="month"
              class="input w-auto"
            />
          </div>
          <button @click="exportCSV" class="btn btn-secondary">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            CSVエクスポート
          </button>
        </div>
      </div>

      <!-- サマリーカード -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="card">
          <div class="text-base text-gray-600 font-medium">基本給合計</div>
          <div class="text-3xl font-bold text-gray-900 mt-2">
            ¥{{ totalBaseSalary.toLocaleString() }}
          </div>
        </div>
        <div class="card">
          <div class="text-base text-gray-600 font-medium">深夜手当合計</div>
          <div class="text-3xl font-bold text-orange-600 mt-2">
            ¥{{ totalNightAllowance.toLocaleString() }}
          </div>
          <div class="text-sm text-gray-500 mt-2">深夜{{ totalNightHours.toFixed(1) }}時間分</div>
        </div>
        <div class="card">
          <div class="text-base text-gray-600 font-medium">総給料</div>
          <div class="text-3xl font-bold text-primary-600 mt-2">
            ¥{{ totalSalary.toLocaleString() }}
          </div>
        </div>
        <div class="card">
          <div class="text-base text-gray-600 font-medium">総勤務時間</div>
          <div class="text-3xl font-bold text-gray-900 mt-2">
            {{ totalHours.toFixed(1) }}h
          </div>
          <div class="text-sm text-gray-500 mt-2">{{ salaryData.length }}名</div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="attendanceStore.loading || staffStore.loading" class="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>

      <!-- Empty State -->
      <div v-else-if="salaryData.length === 0" class="card text-center py-12">
        <div class="text-gray-500">対象月の出退勤記録がありません</div>
      </div>

      <!-- 給料一覧テーブル -->
      <div v-else class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-base">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="text-left px-5 py-4 text-sm font-semibold text-gray-600">
                  スタッフ
                </th>
                <th class="text-right px-5 py-4 text-sm font-semibold text-gray-600">
                  時給
                </th>
                <th class="text-right px-5 py-4 text-sm font-semibold text-orange-600">
                  深夜時給
                </th>
                <th class="text-right px-5 py-4 text-sm font-semibold text-gray-600">
                  日数
                </th>
                <th class="text-right px-5 py-4 text-sm font-semibold text-gray-600">
                  勤務時間
                </th>
                <th class="text-right px-5 py-4 text-sm font-semibold text-orange-600">
                  深夜
                </th>
                <th class="text-right px-5 py-4 text-sm font-semibold text-gray-600">
                  基本給
                </th>
                <th class="text-right px-5 py-4 text-sm font-semibold text-orange-600">
                  深夜手当
                </th>
                <th class="text-right px-5 py-4 text-sm font-semibold text-gray-600">
                  合計
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="staff in salaryData" :key="staff.staffId" class="hover:bg-gray-50">
                <td class="px-5 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span class="text-primary-700 font-bold">
                        {{ staff.staffName.charAt(0) }}
                      </span>
                    </div>
                    <span class="font-semibold text-gray-900">{{ staff.staffName }}</span>
                  </div>
                </td>
                <td class="px-5 py-4 text-right text-gray-700">
                  ¥{{ staff.hourlyWage.toLocaleString() }}
                </td>
                <td class="px-5 py-4 text-right text-orange-600 font-medium">
                  ¥{{ staff.nightWage.toLocaleString() }}
                </td>
                <td class="px-5 py-4 text-right text-gray-700">
                  {{ staff.workDays }}日
                </td>
                <td class="px-5 py-4 text-right text-gray-700">
                  {{ formatHours(staff.totalMinutes) }}
                </td>
                <td class="px-5 py-4 text-right text-orange-600 font-medium">
                  {{ staff.nightHours > 0 ? formatHours(staff.nightMinutes) : '-' }}
                </td>
                <td class="px-5 py-4 text-right text-gray-900 font-medium">
                  ¥{{ staff.baseSalary.toLocaleString() }}
                </td>
                <td class="px-5 py-4 text-right text-orange-600 font-medium">
                  {{ staff.nightAllowance > 0 ? `¥${staff.nightAllowance.toLocaleString()}` : '-' }}
                </td>
                <td class="px-5 py-4 text-right font-bold text-gray-900 text-lg">
                  ¥{{ staff.totalSalary.toLocaleString() }}
                </td>
              </tr>
            </tbody>
            <tfoot class="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <td class="px-5 py-4 font-bold text-gray-900">合計</td>
                <td class="px-5 py-4"></td>
                <td class="px-5 py-4"></td>
                <td class="px-5 py-4"></td>
                <td class="px-5 py-4 text-right font-bold text-gray-900">
                  {{ totalHours.toFixed(1) }}h
                </td>
                <td class="px-5 py-4 text-right font-bold text-orange-600">
                  {{ totalNightHours.toFixed(1) }}h
                </td>
                <td class="px-5 py-4 text-right font-bold text-gray-900">
                  ¥{{ totalBaseSalary.toLocaleString() }}
                </td>
                <td class="px-5 py-4 text-right font-bold text-orange-600">
                  ¥{{ totalNightAllowance.toLocaleString() }}
                </td>
                <td class="px-5 py-4 text-right font-black text-xl text-primary-600">
                  ¥{{ totalSalary.toLocaleString() }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- 深夜割増の説明 -->
        <div class="px-5 py-4 bg-orange-50 border-t border-orange-100">
          <p class="text-sm text-orange-700">
            <span class="font-semibold">深夜手当について:</span>
            22:00〜05:00の勤務時間には、スタッフ登録時に設定した深夜時給で計算されます。
          </p>
        </div>
      </div>
    </template>

    <!-- プラン選択モーダル -->
    <PricingModal
      :is-open="showPricingModal"
      @close="showPricingModal = false"
    />
  </div>
</template>
