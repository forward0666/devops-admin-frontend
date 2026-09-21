<script setup lang="ts">
const route = useRoute()
const { data: user, error, refresh } = await useFetch(`/api/iam/users-full/${route.params.id}`)
const activeTab = ref('summary')
const tabs = [
  { key: 'summary', label: 'Summary' },
  { key: 'permissions', label: 'Permissions' },
  { key: 'groups', label: 'Groups' },
  { key: 'security-credentials', label: 'Security credentials' },
  { key: 'access-advisor', label: 'Access advisor' },
  { key: 'tags', label: 'Tags' },
]

// Add permissions dialog
const showAddPermissions = ref(false)
const addPermMode = ref<'policy' | 'copy'>('policy')
const selectedPolicies = ref<string[]>([])
const copyFromUser = ref('')
const policySearch = ref('')
const { data: policiesData } = await useFetch('/api/iam/policies-full', { query: { pageSize: 100 } })
const { data: usersData } = await useFetch('/api/iam/users-full', { query: { pageSize: 100 } })

const filteredPolicies = computed(() => {
  const items = policiesData.value?.items || []
  if (!policySearch.value) return items
  return items.filter((p: any) => p.name.toLowerCase().includes(policySearch.value.toLowerCase()))
})

// Permissions table
const permSearch = ref('')

// User's combined permissions: from groups + direct
const userPermissions = computed(() => {
  if (!user.value) return []
  const perms: { name: string; type: string; attachedVia: string; lastAccessed: string }[] = []
  // Direct policies (simulated)
  if (user.value.groups?.includes('Admins')) {
    perms.push({ name: 'AdministratorAccess', type: 'Managed', attachedVia: 'Group: Admins', lastAccessed: '2026-09-07' })
  }
  if (user.value.groups?.includes('Developers')) {
    perms.push({ name: 'EC2FullAccess', type: 'Managed', attachedVia: 'Group: Developers', lastAccessed: '2026-09-06' })
    perms.push({ name: 'S3FullAccess', type: 'Managed', attachedVia: 'Group: Developers', lastAccessed: '2026-09-06' })
    perms.push({ name: 'DynamoDBFullAccess', type: 'Managed', attachedVia: 'Group: Developers', lastAccessed: '2026-09-05' })
  }
  if (user.value.groups?.includes('DevOps')) {
    perms.push({ name: 'IAMFullAccess', type: 'Managed', attachedVia: 'Group: DevOps', lastAccessed: '2026-09-07' })
    perms.push({ name: 'S3FullAccess', type: 'Managed', attachedVia: 'Group: DevOps', lastAccessed: '2026-09-07' })
  }
  if (user.value.groups?.includes('ReadOnly')) {
    perms.push({ name: 'ReadOnlyAccess', type: 'Managed', attachedVia: 'Group: ReadOnly', lastAccessed: '2026-09-01' })
  }
  if (user.value.groups?.includes('DataTeam')) {
    perms.push({ name: 'S3FullAccess', type: 'Managed', attachedVia: 'Group: DataTeam', lastAccessed: '2026-09-06' })
    perms.push({ name: 'RDSFullAccess', type: 'Managed', attachedVia: 'Group: DataTeam', lastAccessed: '2026-09-05' })
    perms.push({ name: 'CloudTrailReadOnly', type: 'Managed', attachedVia: 'Group: DataTeam', lastAccessed: '2026-09-04' })
  }
  if (user.value.groups?.includes('QA')) {
    perms.push({ name: 'ReadOnlyAccess', type: 'Managed', attachedVia: 'Group: QA', lastAccessed: '2026-08-15' })
    perms.push({ name: 'EC2FullAccess', type: 'Managed', attachedVia: 'Group: QA', lastAccessed: '2026-08-15' })
  }
  if (user.value.groups?.includes('Security')) {
    perms.push({ name: 'SecurityAudit', type: 'Managed', attachedVia: 'Group: Security', lastAccessed: '2026-09-07' })
  }
  // Deduplicate by name
  const seen = new Set<string>()
  return perms.filter(p => { if (seen.has(p.name)) return false; seen.add(p.name); return true })
})

const filteredPermissions = computed(() => {
  if (!permSearch.value) return userPermissions.value
  return userPermissions.value.filter(p => p.name.toLowerCase().includes(permSearch.value.toLowerCase()))
})

// Add to group dialog
const showAddToGroup = ref(false)
const selectedGroups = ref<string[]>([])
const groupSearch = ref('')
const { data: groupsData } = await useFetch('/api/iam/groups-full', { query: { pageSize: 100 } })

const filteredGroups = computed(() => {
  const items = groupsData.value?.items || []
  if (!groupSearch.value) return items
  return items.filter((g: any) => g.name.toLowerCase().includes(groupSearch.value.toLowerCase()))
})

// Create access key
const showCreateKey = ref(false)
const newKeyResult = ref<{ accessKeyId: string; secretAccessKey: string } | null>(null)

// Manage MFA
const showManageMfa = ref(false)
const mfaType = ref('virtual')
const mfaSerial = ref('')

// Manage password
const showManagePassword = ref(false)
const passwordForm = ref({ password: '', requireChange: true })

// Remove permission
const showRemovePermission = ref(false)
const removePermTarget = ref('')

// Remove from group
const showRemoveFromGroup = ref(false)
const removeGroupTarget = ref('')

// Tags editing
const showEditTags = ref(false)
const editTags = ref<{ key: string; value: string }[]>([])
const showRemoveTag = ref(false)
const removeTagTarget = ref('')

// Access advisor search
const advisorSearch = ref('')

const accessAdvisorData = computed(() => {
  if (!user.value) return []
  const services = [
    { service: 'S3', lastAccessed: '2026-09-07', actionsUsed: 'GetObject, PutObject, ListBucket' },
    { service: 'EC2', lastAccessed: '2026-09-06', actionsUsed: 'DescribeInstances, RunInstances' },
    { service: 'IAM', lastAccessed: '2026-09-07', actionsUsed: 'GetUser, ListUsers' },
    { service: 'RDS', lastAccessed: '2026-09-05', actionsUsed: 'DescribeDBInstances' },
    { service: 'CloudTrail', lastAccessed: '2026-09-04', actionsUsed: 'LookupEvents' },
    { service: 'DynamoDB', lastAccessed: '2026-09-03', actionsUsed: 'Scan, GetItem' },
    { service: 'Lambda', lastAccessed: '2026-08-20', actionsUsed: 'InvokeFunction' },
    { service: 'CloudWatch', lastAccessed: '2026-09-07', actionsUsed: 'GetMetricData' },
  ]
  if (!advisorSearch.value) return services
  return services.filter(s => s.service.toLowerCase().includes(advisorSearch.value.toLowerCase()))
})

async function doAddPermissions() {
  await $fetch(`/api/iam/users-full/${route.params.id}`, { method: 'PUT', body: { addPolicies: selectedPolicies.value } })
  showAddPermissions.value = false
  selectedPolicies.value = []
  await refresh()
}

async function doAddToGroup() {
  await $fetch(`/api/iam/users-full/${route.params.id}`, { method: 'PUT', body: { addGroups: selectedGroups.value } })
  showAddToGroup.value = false
  selectedGroups.value = []
  await refresh()
}

function doCreateAccessKey() {
  newKeyResult.value = {
    accessKeyId: 'AKIA' + Math.random().toString(36).substring(2, 12).toUpperCase(),
    secretAccessKey: Math.random().toString(36).substring(2, 30) + Math.random().toString(36).substring(2, 30)
  }
  showCreateKey.value = true
}

function doManageMfa() {
  mfaSerial.value = 'arn:iam:' + Date.now() + ':mfa/' + (user.value?.username || 'user')
  showManageMfa.value = true
}

function doManagePassword() {
  passwordForm.value = { password: '', requireChange: true }
  showManagePassword.value = true
}

function confirmRemovePermission(permName: string) {
  removePermTarget.value = permName
  showRemovePermission.value = true
}

function confirmRemoveFromGroup(groupName: string) {
  removeGroupTarget.value = groupName
  showRemoveFromGroup.value = true
}

async function doRemoveFromGroup() {
  await $fetch(`/api/iam/users-full/${route.params.id}`, { method: 'PUT', body: { removeGroup: removeGroupTarget.value } })
  showRemoveFromGroup.value = false
  await refresh()
}

function openEditTags() {
  editTags.value = user.value?.tags ? [...user.value.tags.map((t: any) => ({ ...t }))] : []
  if (!editTags.value.length) editTags.value.push({ key: '', value: '' })
  showEditTags.value = true
}

function addEditTag() { editTags.value.push({ key: '', value: '' }) }
function removeEditTag(i: number) { editTags.value.splice(i, 1) }

function confirmRemoveTag(key: string) {
  removeTagTarget.value = key
  showRemoveTag.value = true
}

function relativeTime(dateStr: string) {
  if (!dateStr || dateStr === 'Never') return 'Never'
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const days = Math.floor(diffMs / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days} days ago`
  if (days < 365) return `${Math.floor(days / 30)} months ago`
  return `${Math.floor(days / 365)} years ago`
}
</script>

<template>
  <div v-if="error" class="text-center py-20 text-gray-500">User not found</div>
  <div v-else-if="user">
    <!-- Page header -->
    <div class="flex items-start justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ user.username }}</h1>
        <p class="text-sm text-gray-500 font-mono mt-1">{{ user.arn }}</p>
      </div>
      <button
        @click="confirmRemoveFromGroup('__delete_user__')"
        class="px-4 py-2 bg-white border border-red-300 text-red-600 rounded-md text-sm font-medium hover:bg-red-50 flex items-center gap-1"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        Delete user
      </button>
    </div>

    <!-- Tabs -->
    <div class="border-b border-gray-200 mb-6">
      <nav class="flex gap-0 -mb-px overflow-x-auto">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="activeTab = tab.key"
          :class="[
            'px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
            activeTab === tab.key
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          ]"
        >
          {{ tab.label }}
          <span v-if="tab.key === 'groups'" class="ml-1 text-xs text-gray-400">({{ user.groups?.length || 0 }})</span>
        </button>
      </nav>
    </div>

    <!-- ═══════════════ TAB: SUMMARY ═══════════════ -->
    <div v-if="activeTab === 'summary'" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- General info -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <h3 class="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          User details
        </h3>
        <dl class="space-y-3 text-sm">
          <div class="flex justify-between"><dt class="text-gray-500">User name</dt><dd class="text-gray-900 font-medium">{{ user.username }}</dd></div>
          <div class="flex justify-between"><dt class="text-gray-500">ARN</dt><dd class="text-gray-900 font-mono text-xs break-all text-right max-w-[260px]">{{ user.arn }}</dd></div>
          <div class="flex justify-between"><dt class="text-gray-500">Created</dt><dd class="text-gray-900">{{ user.createdAt }}</dd></div>
          <div class="flex justify-between">
            <dt class="text-gray-500">Console access</dt>
            <dd :class="user.passwordEnabled ? 'text-green-600 font-medium' : 'text-gray-500'">{{ user.passwordEnabled ? 'Enabled' : 'Disabled' }}</dd>
          </div>
          <div class="flex justify-between"><dt class="text-gray-500">Permissions boundary</dt><dd class="text-gray-500 text-xs">Not set</dd></div>
        </dl>
      </div>

      <!-- Security status -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <h3 class="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          Security status
        </h3>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-500">Password</span>
            <span :class="['text-xs px-2 py-1 rounded-full font-medium', user.passwordEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500']">
              {{ user.passwordEnabled ? `Enabled (${user.passwordAge} days)` : 'Disabled' }}
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-500">MFA</span>
            <span :class="['text-xs px-2 py-1 rounded-full font-medium', user.mfaEnabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700']">
              {{ user.mfaEnabled ? `Enabled (${user.mfaType || 'virtual'})` : 'Not enabled' }}
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-500">Access keys</span>
            <span class="text-xs text-gray-900 font-medium">{{ user.accessKeys?.length || 0 }} key(s)</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-500">Last activity</span>
            <span class="text-xs text-gray-700">{{ user.lastActivity }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════ TAB: PERMISSIONS ═══════════════ -->
    <div v-else-if="activeTab === 'permissions'" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="p-4 border-b border-gray-200 flex items-center justify-between gap-3">
        <div class="relative flex-1 max-w-sm">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input v-model="permSearch" type="text" placeholder="Search permissions..." class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button @click="showAddPermissions = true" class="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center gap-1 shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
          Add permissions
        </button>
      </div>
      <table class="w-full border-collapse">
        <thead>
          <tr class="bg-gray-50">
            <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Policy name</th>
            <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Type</th>
            <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Attached via</th>
            <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Last accessed</th>
            <th class="w-16 px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="perm in filteredPermissions" :key="perm.name" class="border-t border-gray-100 hover:bg-blue-50/50">
            <td class="px-4 py-2.5 text-sm font-medium text-blue-600">{{ perm.name }}</td>
            <td class="px-4 py-2.5">
              <span :class="['text-xs px-2 py-0.5 rounded-full', perm.type === 'Managed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600']">{{ perm.type }}</span>
            </td>
            <td class="px-4 py-2.5 text-sm text-gray-600">{{ perm.attachedVia }}</td>
            <td class="px-4 py-2.5 text-sm text-gray-600">{{ relativeTime(perm.lastAccessed) }}</td>
            <td class="px-4 py-2.5">
              <button @click="confirmRemovePermission(perm.name)" class="text-red-500 hover:text-red-700 p-1" title="Remove">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!filteredPermissions.length" class="p-6 text-center text-sm text-gray-400">No permissions found</div>
    </div>

    <!-- ═══════════════ TAB: GROUPS ═══════════════ -->
    <div v-else-if="activeTab === 'groups'" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-700">Groups ({{ user.groups?.length || 0 }})</h3>
        <button @click="showAddToGroup = true" class="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
          Add to group
        </button>
      </div>
      <table class="w-full border-collapse">
        <thead>
          <tr class="bg-gray-50">
            <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Group name</th>
            <th class="w-16 px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="g in user.groups" :key="g" class="border-t border-gray-100 hover:bg-blue-50/50">
            <td class="px-4 py-2.5">
              <NuxtLink to="/iam/groups" class="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">{{ g }}</NuxtLink>
            </td>
            <td class="px-4 py-2.5">
              <button @click="confirmRemoveFromGroup(g)" class="text-red-500 hover:text-red-700 p-1" title="Remove from group">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!user.groups?.length" class="p-6 text-center text-sm text-gray-400">Not a member of any groups</div>
    </div>

    <!-- ═══════════════ TAB: SECURITY CREDENTIALS ═══════════════ -->
    <div v-else-if="activeTab === 'security-credentials'" class="space-y-6">
      <!-- Console access section -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div class="px-5 py-3 border-b border-gray-200 bg-[#f2f3f3]">
          <h3 class="text-sm font-semibold text-gray-700">Console access</h3>
        </div>
        <div class="p-5 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-700">Console sign-in URL</p>
              <p class="text-sm text-blue-600 font-mono">https://123456789.signin.console.example.com/console</p>
            </div>
          </div>
          <div class="border-t border-gray-100 pt-4 flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-700">Password</p>
              <p class="text-sm text-gray-500">
                Status: <span :class="user.passwordEnabled ? 'text-green-600 font-medium' : 'text-gray-500'">{{ user.passwordEnabled ? 'Enabled' : 'Disabled' }}</span>
              </p>
            </div>
            <button @click="doManagePassword()" class="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
              Manage password
            </button>
          </div>
          <div class="border-t border-gray-100 pt-4">
            <div class="flex items-center justify-between mb-2">
              <div>
                <p class="text-sm font-medium text-gray-700">MFA device</p>
                <p class="text-sm text-gray-500">
                  Status: <span :class="user.mfaEnabled ? 'text-green-600 font-medium' : 'text-red-600 font-medium'">{{ user.mfaEnabled ? 'Assigned' : 'Not assigned' }}</span>
                </p>
              </div>
              <button @click="doManageMfa()" class="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                Assign MFA device
              </button>
            </div>
            <div v-if="user.mfaEnabled" class="mt-2 bg-gray-50 rounded-md px-4 py-2 flex items-center justify-between">
              <div>
                <span class="text-sm text-gray-700 font-medium">Virtual MFA device</span>
                <span class="text-xs text-gray-500 ml-2">{{ user.mfaType || 'virtual' }}</span>
              </div>
              <button class="text-xs text-red-500 hover:text-red-700">Remove</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Access keys section -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div class="px-5 py-3 border-b border-gray-200 bg-[#f2f3f3] flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-700">Access keys</h3>
          <button @click="doCreateAccessKey()" class="px-3 py-1 bg-[#006ce0] text-white rounded text-xs font-medium hover:bg-[#004ba0]">
            Create access key
          </button>
        </div>
        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-gray-50">
              <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Access key ID</th>
              <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Created</th>
              <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Last used</th>
              <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="key in user.accessKeys" :key="key.id" class="border-t border-gray-100">
              <td class="px-4 py-2.5 text-sm font-mono text-gray-700">{{ key.id }}</td>
              <td class="px-4 py-2.5">
                <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', key.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700']">{{ key.status }}</span>
              </td>
              <td class="px-4 py-2.5 text-sm text-gray-600">{{ key.created }}</td>
              <td class="px-4 py-2.5 text-sm text-gray-600">{{ relativeTime(key.lastUsed) }}</td>
              <td class="px-4 py-2.5">
                <div class="flex items-center gap-2">
                  <button class="text-xs text-blue-600 hover:text-blue-800">
                    {{ key.status === 'Active' ? 'Deactivate' : 'Activate' }}
                  </button>
                  <span class="text-gray-300">|</span>
                  <button class="text-xs text-red-500 hover:text-red-700">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!user.accessKeys?.length" class="p-6 text-center text-sm text-gray-400">No access keys</div>
      </div>
    </div>

    <!-- ═══════════════ TAB: ACCESS ADVISOR ═══════════════ -->
    <div v-else-if="activeTab === 'access-advisor'" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="p-4 border-b border-gray-200">
        <div class="relative max-w-sm">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input v-model="advisorSearch" type="text" placeholder="Search services..." class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      <table class="w-full border-collapse">
        <thead>
          <tr class="bg-gray-50">
            <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Service</th>
            <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Last accessed</th>
            <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Actions used</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in accessAdvisorData" :key="item.service" class="border-t border-gray-100 hover:bg-blue-50/50">
            <td class="px-4 py-2.5 text-sm font-medium text-gray-900">{{ item.service }}</td>
            <td class="px-4 py-2.5 text-sm text-gray-600">{{ relativeTime(item.lastAccessed) }}</td>
            <td class="px-4 py-2.5 text-sm text-gray-600">{{ item.actionsUsed }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ═══════════════ TAB: TAGS ═══════════════ -->
    <div v-else-if="activeTab === 'tags'" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-700">Tags ({{ user.tags?.length || 0 }})</h3>
        <button @click="openEditTags()" class="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          Edit
        </button>
      </div>
      <table class="w-full border-collapse">
        <thead>
          <tr class="bg-gray-50">
            <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Key</th>
            <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Value</th>
            <th class="w-16 px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tag in user.tags" :key="tag.key" class="border-t border-gray-100 hover:bg-blue-50/50">
            <td class="px-4 py-2.5 text-sm font-medium text-gray-900">{{ tag.key }}</td>
            <td class="px-4 py-2.5 text-sm text-gray-600">{{ tag.value }}</td>
            <td class="px-4 py-2.5">
              <button @click="confirmRemoveTag(tag.key)" class="text-red-500 hover:text-red-700 p-1" title="Remove tag">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!user.tags?.length" class="p-6 text-center text-sm text-gray-400">No tags</div>
    </div>

    <!-- ═══════════════ DIALOGS ═══════════════ -->

    <!-- Add Permissions Dialog -->
    <div v-if="showAddPermissions" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showAddPermissions = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Add permissions</h2>
        </div>
        <div class="px-6 py-4 flex-1 overflow-y-auto">
          <!-- Mode tabs -->
          <div class="flex border-b border-gray-200 mb-4">
            <button @click="addPermMode = 'policy'" :class="['px-4 py-2 text-sm font-medium border-b-2 -mb-px', addPermMode === 'policy' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700']">
              Attach policies
            </button>
            <button @click="addPermMode = 'copy'" :class="['px-4 py-2 text-sm font-medium border-b-2 -mb-px', addPermMode === 'copy' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700']">
              Copy from user
            </button>
          </div>

          <div v-if="addPermMode === 'policy'">
            <input v-model="policySearch" type="text" placeholder="Search policies..." class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div class="max-h-60 overflow-y-auto border border-gray-200 rounded-md divide-y divide-gray-100">
              <label v-for="p in filteredPolicies" :key="p.id" class="flex items-center gap-3 px-4 py-2 hover:bg-blue-50/50 cursor-pointer">
                <input type="checkbox" :value="p.name" v-model="selectedPolicies" class="text-blue-600 rounded" />
                <div>
                  <span class="text-sm font-medium text-gray-900">{{ p.name }}</span>
                  <span :class="['ml-2 text-xs px-1.5 py-0.5 rounded', p.type === 'Managed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600']">{{ p.type }}</span>
                </div>
              </label>
            </div>
          </div>

          <div v-else>
            <p class="text-sm text-gray-600 mb-3">Copy permissions from an existing user:</p>
            <select v-model="copyFromUser" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select a user...</option>
              <option v-for="u in (usersData?.items || [])" :key="u.id" :value="u.username">{{ u.username }}</option>
            </select>
          </div>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button @click="showAddPermissions = false" class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button @click="doAddPermissions()" :disabled="!selectedPolicies.length && !copyFromUser" class="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">Add permissions</button>
        </div>
      </div>
    </div>

    <!-- Add to Group Dialog -->
    <div v-if="showAddToGroup" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showAddToGroup = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Add user to group</h2>
        </div>
        <div class="px-6 py-4">
          <input v-model="groupSearch" type="text" placeholder="Search groups..." class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <div class="max-h-60 overflow-y-auto border border-gray-200 rounded-md divide-y divide-gray-100">
            <label v-for="g in filteredGroups" :key="g.id" class="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50/50 cursor-pointer">
              <input type="checkbox" :value="g.name" v-model="selectedGroups" class="text-blue-600 rounded" />
              <div>
                <span class="text-sm font-medium text-gray-900">{{ g.name }}</span>
                <span class="text-xs text-gray-500 ml-2">{{ g.description }}</span>
              </div>
            </label>
          </div>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button @click="showAddToGroup = false" class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button @click="doAddToGroup()" :disabled="!selectedGroups.length" class="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">Add to group</button>
        </div>
      </div>
    </div>

    <!-- Create Access Key Result -->
    <div v-if="newKeyResult" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="newKeyResult = null">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Access key created</h2>
        </div>
        <div class="px-6 py-5 space-y-3">
          <div class="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p class="text-sm text-yellow-800">⚠ Save the secret access key. You will not be able to see it again after closing this dialog.</p>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Access Key ID</label>
            <code class="block px-3 py-2 bg-gray-50 border rounded text-sm font-mono">{{ newKeyResult.accessKeyId }}</code>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Secret Access Key</label>
            <code class="block px-3 py-2 bg-gray-50 border rounded text-sm font-mono break-all">{{ newKeyResult.secretAccessKey }}</code>
          </div>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button @click="newKeyResult = null" class="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700">Close</button>
        </div>
      </div>
    </div>

    <!-- Manage MFA Dialog -->
    <div v-if="showManageMfa" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showManageMfa = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Assign MFA device</h2>
        </div>
        <div class="px-6 py-5 space-y-4">
          <p class="text-sm text-gray-600">Assign an MFA device to <strong>{{ user.username }}</strong></p>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Device type</label>
            <select v-model="mfaType" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="virtual">Virtual MFA device</option>
              <option value="hardware">Hardware MFA device</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Serial number</label>
            <input v-model="mfaSerial" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono bg-gray-50" readonly />
          </div>
          <div class="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p class="text-sm text-blue-800">Scan the QR code with your authenticator app, then enter two consecutive codes.</p>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-gray-500 mb-1">Authentication code 1</label>
              <input type="text" maxlength="6" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-center font-mono" placeholder="000000" />
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Authentication code 2</label>
              <input type="text" maxlength="6" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-center font-mono" placeholder="000000" />
            </div>
          </div>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button @click="showManageMfa = false" class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button @click="showManageMfa = false" class="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700">Assign MFA</button>
        </div>
      </div>
    </div>

    <!-- Manage Password Dialog -->
    <div v-if="showManagePassword" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showManagePassword = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Manage password</h2>
        </div>
        <div class="px-6 py-5 space-y-4">
          <p class="text-sm text-gray-600">Set a new password for <strong>{{ user.username }}</strong></p>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">New password</label>
            <input v-model="passwordForm.password" type="password" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <label class="flex items-center gap-2">
            <input type="checkbox" v-model="passwordForm.requireChange" class="rounded text-blue-600" />
            <span class="text-sm text-gray-700">User must create a new password at next sign-in</span>
          </label>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button @click="showManagePassword = false" class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button @click="showManagePassword = false" class="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700">Apply</button>
        </div>
      </div>
    </div>

    <!-- Remove Permission Confirm -->
    <div v-if="showRemovePermission" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showRemovePermission = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Remove permission</h2>
        </div>
        <div class="px-6 py-5">
          <p class="text-sm text-gray-700">Are you sure you want to remove <strong>{{ removePermTarget }}</strong> from <strong>{{ user.username }}</strong>?</p>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button @click="showRemovePermission = false" class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button @click="showRemovePermission = false" class="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700">Remove</button>
        </div>
      </div>
    </div>

    <!-- Remove from Group Confirm -->
    <div v-if="showRemoveFromGroup" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showRemoveFromGroup = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">{{ removeGroupTarget === '__delete_user__' ? 'Delete user' : 'Remove from group' }}</h2>
        </div>
        <div class="px-6 py-5">
          <p v-if="removeGroupTarget === '__delete_user__'" class="text-sm text-gray-700">
            Are you sure you want to delete user <strong>{{ user.username }}</strong>? This action cannot be undone.
          </p>
          <p v-else class="text-sm text-gray-700">
            Are you sure you want to remove <strong>{{ user.username }}</strong> from group <strong>{{ removeGroupTarget }}</strong>?
          </p>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button @click="showRemoveFromGroup = false" class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button v-if="removeGroupTarget === '__delete_user__'" @click="$fetch(`/api/iam/users-full/${route.params.id}`, { method: 'DELETE' }).then(() => $router.push('/iam/users'))" class="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700">Delete user</button>
          <button v-else @click="doRemoveFromGroup()" class="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700">Remove</button>
        </div>
      </div>
    </div>

    <!-- Edit Tags Dialog -->
    <div v-if="showEditTags" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showEditTags = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Edit tags</h2>
        </div>
        <div class="px-6 py-5 space-y-3">
          <div class="grid grid-cols-[1fr_1fr_40px] gap-2 mb-1">
            <span class="text-xs font-semibold text-gray-500 uppercase">Key</span>
            <span class="text-xs font-semibold text-gray-500 uppercase">Value</span>
            <span></span>
          </div>
          <div v-for="(tag, i) in editTags" :key="i" class="grid grid-cols-[1fr_1fr_40px] gap-2 items-center">
            <input v-model="tag.key" type="text" placeholder="Key" class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input v-model="tag.value" type="text" placeholder="Value" class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button @click="removeEditTag(i)" class="p-2 text-red-500 hover:text-red-700 rounded hover:bg-red-50">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <button @click="addEditTag()" class="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
            Add tag
          </button>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button @click="showEditTags = false" class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button @click="showEditTags = false" class="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700">Save tags</button>
        </div>
      </div>
    </div>

    <!-- Remove Tag Confirm -->
    <div v-if="showRemoveTag" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showRemoveTag = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-sm">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Remove tag</h2>
        </div>
        <div class="px-6 py-5">
          <p class="text-sm text-gray-700">Remove tag <strong>{{ removeTagTarget }}</strong>?</p>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button @click="showRemoveTag = false" class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button @click="showRemoveTag = false" class="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700">Remove</button>
        </div>
      </div>
    </div>
  </div>
</template>