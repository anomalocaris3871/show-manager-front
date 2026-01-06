<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStaffStore } from '@/stores/staff';
import { useToast } from '@/composables/useToast';
import { staffService } from '@/services/staffService';
import type { StaffForm } from '@/types';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';

const route = useRoute();
const router = useRouter();
const staffStore = useStaffStore();
const toast = useToast();

const staffId = computed(() => route.params.id as string | undefined);
const isEdit = computed(() => !!staffId.value);

const form = ref<StaffForm>({
  name: '',
  hourlyWage: 9860, // 2024년 최저시급 기준
});

const loading = ref(false);

onMounted(async () => {
  if (isEdit.value && staffId.value) {
    loading.value = true;
    const result = await staffService.getById(staffId.value);
    if (result.success && result.data) {
      form.value = {
        name: result.data.name,
        hourlyWage: result.data.hourlyWage,
      };
    }
    loading.value = false;
  }
});

async function handleSubmit() {
  let success: boolean;

  if (isEdit.value && staffId.value) {
    success = await staffStore.updateStaff(staffId.value, form.value);
  } else {
    success = await staffStore.createStaff(form.value);
  }

  if (success) {
    toast.success(isEdit.value ? '스태프 정보가 수정되었습니다.' : '스태프가 등록되었습니다.');
    router.push('/staff');
  } else if (staffStore.error) {
    toast.error(staffStore.error);
  }
}

function handleCancel() {
  router.push('/staff');
}
</script>

<template>
  <div class="max-w-2xl">
    <div v-if="loading" class="flex items-center justify-center h-64">
      <LoadingSpinner size="lg" />
    </div>

    <div v-else class="card">
      <h2 class="text-lg font-semibold text-gray-900 mb-6">
        {{ isEdit ? '스태프 정보 수정' : '스태프 등록' }}
      </h2>

      <form @submit.prevent="handleSubmit" class="space-y-5">
        <div>
          <label class="label">이름</label>
          <input
            v-model="form.name"
            type="text"
            class="input"
            placeholder="스태프 이름을 입력하세요"
            required
          />
        </div>

        <div>
          <label class="label">시급 (원)</label>
          <input
            v-model.number="form.hourlyWage"
            type="number"
            class="input"
            placeholder="9860"
            min="0"
            required
          />
          <p class="text-sm text-gray-500 mt-1">2024년 최저시급: 9,860원</p>
        </div>

        <div v-if="staffStore.error" class="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">
          {{ staffStore.error }}
        </div>

        <div class="flex gap-3 pt-4">
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="staffStore.loading"
          >
            {{ staffStore.loading ? '저장 중...' : (isEdit ? '수정하기' : '등록하기') }}
          </button>
          <button
            type="button"
            @click="handleCancel"
            class="btn btn-secondary"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
