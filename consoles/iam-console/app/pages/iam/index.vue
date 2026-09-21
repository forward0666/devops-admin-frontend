<script setup lang="ts">
const { data: stats, refresh } = await useFetch('/api/iam/dashboard')
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">IAM Dashboard</h1>
      <button @click="refresh()" class="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-1">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        Refresh
      </button>
    </div>

    <template v-if="stats">
      <!-- Resource Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div class="text-sm font-medium text-gray-500 mb-1">Users</div>
          <div class="text-3xl font-bold text-gray-900">{{ stats.users.total }}</div>
          <div class="text-xs text-gray-400 mt-2">{{ stats.users.active }} active &middot; {{ stats.users.inactive }} inactive</div>
        </div>
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div class="text-sm font-medium text-gray-500 mb-1">Groups</div>
          <div class="text-3xl font-bold text-gray-900">{{ stats.groups.total }}</div>
        </div>
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div class="text-sm font-medium text-gray-500 mb-1">Roles</div>
          <div class="text-3xl font-bold text-gray-900">{{ stats.roles.total }}</div>
        </div>
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div class="text-sm font-medium text-gray-500 mb-1">Policies</div>
          <div class="text-3xl font-bold text-gray-900">{{ stats.policies.total }}</div>
          <div class="text-xs text-gray-400 mt-2">{{ stats.policies.managed }} Managed &middot; {{ stats.policies.customerManaged }} custom</div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Security Checklist -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
          <div class="px-5 py-3 border-b border-gray-200 bg-[#232f3e] rounded-t-lg">
            <h2 class="text-sm font-semibold text-white">Security Checklist</h2>
          </div>
          <div class="p-5">
            <div v-for="item in stats.securityChecklist" :key="item.id" class="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <div :class="['w-5 h-5 rounded-full flex items-center justify-center text-xs', item.done ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600']">
                <svg v-if="item.done" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
                <span v-else>!</span>
              </div>
              <span :class="['text-sm', item.done ? 'text-gray-700' : 'text-yellow-700 font-medium']">{{ item.title }}</span>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
          <div class="px-5 py-3 border-b border-gray-200 bg-[#232f3e] rounded-t-lg">
            <h2 class="text-sm font-semibold text-white">Recent Activity</h2>
          </div>
          <div class="p-5">
            <div v-for="(act, i) in stats.recentActivity" :key="i" class="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <div class="text-sm text-gray-900 font-medium">{{ act.action }}</div>
                <div class="text-xs text-gray-400">{{ act.user }}</div>
              </div>
              <span class="text-xs text-gray-400">{{ act.time }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>