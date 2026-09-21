<script setup lang="ts">
import { parseAction, getPermissionColor, getPermissionHierarchy } from '~/utils/iam-actions'

const props = defineProps<{
  policyDocument: any
}>()

const statements = computed(() => {
  if (!props.policyDocument?.Statement) return []
  return props.policyDocument.Statement.map((stmt: any, idx: number) => {
    const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action || '*']
    const resources = Array.isArray(stmt.Resource) ? stmt.Resource : [stmt.Resource || '*']
    return {
      index: idx,
      effect: stmt.Effect || 'Allow',
      actions: actions.map((a: string) => parseAction(a)),
      resources,
    }
  })
})

const showDetails = ref<number[]>([])

function toggleDetails(idx: number) {
  const i = showDetails.value.indexOf(idx)
  if (i >= 0) showDetails.value.splice(i, 1)
  else showDetails.value.push(idx)
}

// Get permission hierarchy for display
const hierarchy = getPermissionHierarchy()
</script>

<template>
  <div class="space-y-3">
    <!-- Permission hierarchy legend -->
    <div class="bg-gray-50 rounded-lg p-3 mb-4">
      <h4 class="text-xs font-semibold text-gray-500 uppercase mb-2">权限层级（AWS 风格）</h4>
      <div class="flex items-center gap-2 text-xs flex-wrap">
        <span v-for="(perm, idx) in hierarchy" :key="perm.key" class="flex items-center gap-1">
          <span :class="['px-2 py-1 rounded font-medium', getPermissionColor(perm.key)]">
            {{ perm.label }}
          </span>
          <span v-if="idx < hierarchy.length - 1" class="text-gray-400">→</span>
        </span>
      </div>
      <p class="text-xs text-gray-500 mt-2">
        层级权限：List → Get → Describe → Create → Update → Delete → Permissions → Tagging → Pass
      </p>
    </div>

    <div v-for="stmt in statements" :key="stmt.index"
      class="border rounded-lg overflow-hidden"
      :class="stmt.effect === 'Deny' ? 'border-red-200' : 'border-green-200'">
      
      <!-- Statement header -->
      <div class="flex items-center justify-between px-4 py-2.5"
        :class="stmt.effect === 'Deny' ? 'bg-red-50' : 'bg-green-50'">
        <div class="flex items-center gap-2">
          <span :class="['text-xs font-bold px-2 py-0.5 rounded', stmt.effect === 'Deny' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700']">
            {{ stmt.effect }}
          </span>
          <span class="text-sm text-gray-600">
            {{ stmt.actions.length }} 个权限
          </span>
        </div>
        <button @click="toggleDetails(stmt.index)" class="text-xs text-blue-600 hover:text-blue-800">
          {{ showDetails.includes(stmt.index) ? '收起' : '展开' }}
        </button>
      </div>
      
      <!-- Statement details -->
      <div v-if="showDetails.includes(stmt.index)" class="p-4 space-y-3">
        <!-- Actions with hierarchy -->
        <div>
          <h4 class="text-xs font-semibold text-gray-500 uppercase mb-2">权限</h4>
          <div class="space-y-2">
            <div v-for="action in stmt.actions" :key="action.service + action.action"
              class="flex items-start gap-2 p-2 rounded-lg border"
              :class="action.color.replace('text-', 'border-').replace('bg-', 'bg-') + '/20'">
              <span class="text-lg mt-0.5">{{ action.icon }}</span>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-sm">{{ action.service }}:{{ action.action }}</span>
                  <span :class="['text-xs px-2 py-0.5 rounded-full', action.color]">
                    {{ action.label }}
                  </span>
                </div>
                <p class="text-xs text-gray-500 mt-1">{{ action.description }}</p>
                <div v-if="action.requires.length > 0" class="mt-1">
                  <span class="text-xs text-gray-400">需要前置权限：</span>
                  <span v-for="(req, idx) in action.requires" :key="req" class="text-xs">
                    <span :class="['px-1 py-0.5 rounded', getPermissionColor(req)]">{{ req }}</span>
                    <span v-if="idx < action.requires.length - 1" class="text-gray-400 mx-1">+</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Resources -->
        <div>
          <h4 class="text-xs font-semibold text-gray-500 uppercase mb-2">资源</h4>
          <div class="flex flex-wrap gap-1.5">
            <span v-for="res in stmt.resources" :key="res"
              class="inline-flex items-center px-2 py-1 rounded text-xs font-mono bg-gray-100 text-gray-700">
              {{ res }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
