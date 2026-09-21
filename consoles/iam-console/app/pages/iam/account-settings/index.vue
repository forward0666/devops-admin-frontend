<script setup lang="ts">
const { data: passwordPolicy, refresh } = await useFetch('/api/iam/password-policy')

// Edit password policy dialog
const showEdit = ref(false)
const editForm = ref({
  minimumPasswordLength: 14,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSymbols: true,
  enableExpiration: true,
  maxPasswordAge: 90,
  preventReuse: true,
  passwordReusePrevention: 24,
  allowUsersToChange: true,
  hardExpiry: false,
})
const saving = ref(false)

function openEdit() {
  if (passwordPolicy.value) {
    editForm.value = {
      minimumPasswordLength: passwordPolicy.value.minimumPasswordLength,
      requireUppercase: passwordPolicy.value.requireUppercase,
      requireLowercase: passwordPolicy.value.requireLowercase,
      requireNumbers: passwordPolicy.value.requireNumbers,
      requireSymbols: passwordPolicy.value.requireSymbols,
      enableExpiration: passwordPolicy.value.maxPasswordAge > 0,
      maxPasswordAge: passwordPolicy.value.maxPasswordAge || 90,
      preventReuse: passwordPolicy.value.passwordReusePrevention > 0,
      passwordReusePrevention: passwordPolicy.value.passwordReusePrevention || 24,
      allowUsersToChange: passwordPolicy.value.allowUsersToChangePassword,
      hardExpiry: passwordPolicy.value.hardExpiry,
    }
  }
  showEdit.value = true
}

async function doSave() {
  saving.value = true
  try {
    // In real app, PUT to API
    await new Promise(r => setTimeout(r, 500))
    showEdit.value = false
    await refresh()
  } finally { saving.value = false }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Account Settings</h1>
      <button @click="refresh()" class="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-1">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        Refresh
      </button>
    </div>

    <!-- Account Info -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <div class="px-5 py-3 border-b border-gray-200 bg-[#232f3e] rounded-t-lg">
        <h2 class="text-sm font-semibold text-white">Account Information</h2>
      </div>
      <div class="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div class="flex justify-between"><span class="text-gray-500">Account ID</span><span class="text-gray-900 font-mono">123456789012</span></div>
        <div class="flex justify-between"><span class="text-gray-500">Account Alias</span><span class="text-gray-900">my-company-prod</span></div>
        <div class="flex justify-between"><span class="text-gray-500">ARN</span><span class="text-gray-900 font-mono text-xs">arn:iam:123456789:root</span></div>
        <div class="flex justify-between"><span class="text-gray-500">Region</span><span class="text-gray-900">us-east-1</span></div>
      </div>
    </div>

    <!-- Password Policy Card -->
    <div v-if="passwordPolicy" class="bg-white rounded-lg shadow-sm border border-gray-200">
      <div class="px-5 py-3 border-b border-gray-200 bg-[#232f3e] rounded-t-lg flex items-center justify-between">
        <h2 class="text-sm font-semibold text-white">Password Policy</h2>
        <button @click="openEdit()" class="px-3 py-1 bg-white/10 border border-white/20 rounded text-xs text-white hover:bg-white/20 flex items-center gap-1">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          Edit
        </button>
      </div>
      <div class="p-5">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y divide-gray-100 md:divide-y-0">
          <div class="flex items-center justify-between py-3 border-b border-gray-100 md:border-b-0">
            <span class="text-sm text-gray-500">Minimum password length</span>
            <span class="text-sm font-bold text-gray-900">{{ passwordPolicy.minimumPasswordLength }} characters</span>
          </div>
          <div class="flex items-center justify-between py-3 border-b border-gray-100 md:border-b-0">
            <span class="text-sm text-gray-500">Require at least one uppercase letter</span>
            <svg v-if="passwordPolicy.requireUppercase" class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
            <svg v-else class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </div>
          <div class="flex items-center justify-between py-3 border-b border-gray-100">
            <span class="text-sm text-gray-500">Require at least one lowercase letter</span>
            <svg v-if="passwordPolicy.requireLowercase" class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
            <svg v-else class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </div>
          <div class="flex items-center justify-between py-3 border-b border-gray-100">
            <span class="text-sm text-gray-500">Require at least one number</span>
            <svg v-if="passwordPolicy.requireNumbers" class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
            <svg v-else class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </div>
          <div class="flex items-center justify-between py-3 border-b border-gray-100">
            <span class="text-sm text-gray-500">Require at least one symbol</span>
            <svg v-if="passwordPolicy.requireSymbols" class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
            <svg v-else class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </div>
          <div class="flex items-center justify-between py-3 border-b border-gray-100">
            <span class="text-sm text-gray-500">Enable password expiration</span>
            <span class="text-sm font-bold text-gray-900">Yes, {{ passwordPolicy.maxPasswordAge }} days</span>
          </div>
          <div class="flex items-center justify-between py-3 border-b border-gray-100">
            <span class="text-sm text-gray-500">Prevent password reuse</span>
            <span class="text-sm font-bold text-gray-900">{{ passwordPolicy.passwordReusePrevention }} passwords</span>
          </div>
          <div class="flex items-center justify-between py-3 border-b border-gray-100">
            <span class="text-sm text-gray-500">Allow users to change their own password</span>
            <svg v-if="passwordPolicy.allowUsersToChangePassword" class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
            <svg v-else class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </div>
          <div class="flex items-center justify-between py-3">
            <span class="text-sm text-gray-500">Hard expiry</span>
            <svg v-if="passwordPolicy.hardExpiry" class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
            <svg v-else class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </div>
        </div>
      </div>
    </div>

    <!-- EDIT PASSWORD POLICY DIALOG -->
    <div v-if="showEdit" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showEdit = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-gray-200 bg-[#232f3e] rounded-t-lg">
          <h2 class="text-lg font-semibold text-white">Edit password policy</h2>
        </div>
        <div class="px-6 py-5 space-y-5">
          <!-- Min length -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Minimum password length</label>
            <div class="flex items-center gap-3">
              <input v-model.number="editForm.minimumPasswordLength" type="range" min="6" max="128" class="flex-1" />
              <span class="text-sm font-bold text-gray-900 w-12 text-right">{{ editForm.minimumPasswordLength }}</span>
            </div>
          </div>

          <!-- Character requirements -->
          <div>
            <h3 class="text-xs font-semibold text-gray-500 uppercase mb-3">Character Requirements</h3>
            <div class="space-y-2">
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" v-model="editForm.requireUppercase" class="text-blue-600 rounded" />
                <span class="text-sm text-gray-700">Require at least one uppercase letter</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" v-model="editForm.requireLowercase" class="text-blue-600 rounded" />
                <span class="text-sm text-gray-700">Require at least one lowercase letter</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" v-model="editForm.requireNumbers" class="text-blue-600 rounded" />
                <span class="text-sm text-gray-700">Require at least one number</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" v-model="editForm.requireSymbols" class="text-blue-600 rounded" />
                <span class="text-sm text-gray-700">Require at least one symbol</span>
              </label>
            </div>
          </div>

          <!-- Expiration -->
          <div>
            <label class="flex items-center gap-3 cursor-pointer mb-2">
              <input type="checkbox" v-model="editForm.enableExpiration" class="text-blue-600 rounded" />
              <span class="text-sm font-medium text-gray-700">Enable password expiration</span>
            </label>
            <div v-if="editForm.enableExpiration" class="ml-7">
              <label class="block text-xs text-gray-500 mb-1">Password expires after (days)</label>
              <input v-model.number="editForm.maxPasswordAge" type="number" min="1" max="1095" class="w-32 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <!-- Reuse prevention -->
          <div>
            <label class="flex items-center gap-3 cursor-pointer mb-2">
              <input type="checkbox" v-model="editForm.preventReuse" class="text-blue-600 rounded" />
              <span class="text-sm font-medium text-gray-700">Prevent password reuse</span>
            </label>
            <div v-if="editForm.preventReuse" class="ml-7">
              <label class="block text-xs text-gray-500 mb-1">Remember last N passwords</label>
              <input v-model.number="editForm.passwordReusePrevention" type="number" min="1" max="24" class="w-32 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <!-- Other options -->
          <div class="space-y-2">
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" v-model="editForm.allowUsersToChange" class="text-blue-600 rounded" />
              <span class="text-sm text-gray-700">Allow users to change their own password</span>
            </label>
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" v-model="editForm.hardExpiry" class="text-blue-600 rounded" />
              <div>
                <span class="text-sm text-gray-700">Hard expiry</span>
                <p class="text-xs text-gray-500">Prevents users from resetting their own expired password</p>
              </div>
            </label>
          </div>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button @click="showEdit = false" class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button @click="doSave()" :disabled="saving" class="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>