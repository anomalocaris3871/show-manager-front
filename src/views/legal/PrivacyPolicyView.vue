<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

function goBack() {
  router.back();
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4">
    <div class="max-w-3xl mx-auto">
      <button
        @click="goBack"
        class="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        돌아가기
      </button>

      <div class="bg-white rounded-2xl shadow-lg p-8">
        <h1 class="text-2xl font-bold text-gray-900 mb-6">개인정보 처리방침</h1>

        <div class="prose prose-gray max-w-none">
          <p class="text-gray-600 mb-6">
            본 개인정보 처리방침은 Shop Manager(이하 "서비스")가 수집하는 개인정보의 항목, 수집 목적, 보유 기간 등을 안내합니다.
          </p>

          <section class="mb-8">
            <h2 class="text-lg font-semibold text-gray-900 mb-3">1. 수집하는 개인정보 항목</h2>
            <p class="text-gray-600 mb-2">서비스는 다음과 같은 개인정보를 수집합니다:</p>
            <ul class="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>매니저: 이메일, 비밀번호(암호화), 매장명, 매장 주소</li>
              <li>직원: 이름, LINE 사용자 ID, 출퇴근 기록</li>
            </ul>
          </section>

          <section class="mb-8">
            <h2 class="text-lg font-semibold text-gray-900 mb-3">2. 개인정보 수집 목적</h2>
            <ul class="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>서비스 회원 가입 및 관리</li>
              <li>직원 출퇴근 관리</li>
              <li>시프트 스케줄 관리</li>
              <li>LINE 연동을 통한 본인 확인</li>
            </ul>
          </section>

          <section class="mb-8">
            <h2 class="text-lg font-semibold text-gray-900 mb-3">3. 개인정보 보유 및 이용 기간</h2>
            <p class="text-gray-600">
              개인정보는 서비스 이용 기간 동안 보유하며, 회원 탈퇴 시 즉시 파기합니다.
              단, 관계 법령에 따라 보존할 필요가 있는 경우 해당 기간 동안 보관합니다.
            </p>
          </section>

          <section class="mb-8">
            <h2 class="text-lg font-semibold text-gray-900 mb-3">4. 개인정보의 제3자 제공</h2>
            <p class="text-gray-600">
              서비스는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.
              다만, 법령에 의해 요구되는 경우는 예외로 합니다.
            </p>
          </section>

          <section class="mb-8">
            <h2 class="text-lg font-semibold text-gray-900 mb-3">5. 개인정보의 파기</h2>
            <p class="text-gray-600">
              개인정보 보유 기간이 경과하거나 처리 목적이 달성된 경우, 해당 개인정보를 지체 없이 파기합니다.
            </p>
          </section>

          <section class="mb-8">
            <h2 class="text-lg font-semibold text-gray-900 mb-3">6. 이용자의 권리</h2>
            <p class="text-gray-600 mb-2">이용자는 다음과 같은 권리를 행사할 수 있습니다:</p>
            <ul class="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>개인정보 열람 요구</li>
              <li>개인정보 정정 및 삭제 요구</li>
              <li>개인정보 처리 정지 요구</li>
            </ul>
          </section>

          <section class="mb-8">
            <h2 class="text-lg font-semibold text-gray-900 mb-3">7. 개인정보 보호책임자</h2>
            <p class="text-gray-600">
              개인정보 처리에 관한 문의는 아래 연락처로 문의해 주시기 바랍니다.
            </p>
            <p class="text-gray-600 mt-2">
              이메일: support@example.com
            </p>
          </section>

          <section>
            <h2 class="text-lg font-semibold text-gray-900 mb-3">8. 개인정보 처리방침 변경</h2>
            <p class="text-gray-600">
              본 개인정보 처리방침은 법령 또는 서비스 정책의 변경에 따라 수정될 수 있으며,
              변경 시 서비스 내 공지사항을 통해 안내합니다.
            </p>
          </section>

          <p class="text-gray-500 text-sm mt-8">
            시행일: 2024년 1월 1일
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
