<script setup lang="ts">
const route = useRoute()
const departmentStore = useDepartmentStore()
const userStore = useUserStore()
const snackbar = ref({ show: false, text: '', color: 'success' })

const deptId = computed(() => Number(route.query.id))
const deptDetail = ref<any>(null)
const deptUsers = ref<any[]>([])
const loading = ref(false)

onMounted(async () => {
  if (!deptId.value) return
  loading.value = true
  try {
    deptDetail.value = await departmentStore.fetchDepartmentById(deptId.value)
    deptUsers.value = await departmentStore.fetchDepartmentUsers(deptId.value)
  } catch (e: any) {
    snackbar.value = { show: true, text: e.message || 'Failed to load department', color: 'error' }
  } finally {
    loading.value = false
  }
})

const typeConfig: Record<string, { icon: string; color: string }> = {
  office: { icon: 'bx-building', color: 'primary' },
  department: { icon: 'bx-briefcase', color: 'info' },
  team: { icon: 'bx-group', color: 'success' },
}

const deptData = computed(() => {
  const d = deptDetail.value
  if (!d) return { name: 'Unknown', type: 'department', description: '', userCount: 0, managerId: null, createdAt: '-', children: [] }
  return {
    id: d.id,
    name: d.name,
    type: d.type || 'department',
    description: d.description || '',
    userCount: d.userCount || 0,
    managerId: d.managerId,
    active: d.active,
    createdAt: d.createdAt || '-',
    children: d.children || [],
  }
})

const activeTab = ref('overview')
</script>

<template>
  <div>
    <!-- Loading State -->
    <VRow v-if="loading">
      <VCol cols="12" class="text-center py-16">
        <VProgressCircular indeterminate color="primary" size="48" />
        <p class="text-body-1 mt-4">Loading department...</p>
      </VCol>
    </VRow>

    <!-- Not Found State -->
    <VRow v-else-if="!deptDetail">
      <VCol cols="12" class="text-center py-16">
        <VIcon icon="bx-error-circle" size="64" color="warning" />
        <h5 class="text-h5 mt-4">Department Not Found</h5>
        <VBtn variant="tonal" class="mt-4" to="/admin/system/dept/list">Back to Departments</VBtn>
      </VCol>
    </VRow>

    <div v-else>
    <VRow>
      <!-- Left Column -->
      <VCol cols="12" md="5" lg="4">
        <VCard :loading="loading">
          <VCardText class="text-center pt-12">
            <VAvatar size="120" variant="tonal" :color="typeConfig[deptData.type]?.color || 'primary'" rounded>
              <VIcon :icon="typeConfig[deptData.type]?.icon || 'bx-folder'" size="48" />
            </VAvatar>
            <h5 class="text-h5 mt-4">{{ deptData.name }}</h5>
            <VChip variant="tonal" :color="typeConfig[deptData.type]?.color || 'primary'" size="small" label class="text-capitalize mt-4">{{ deptData.type }}</VChip>
          </VCardText>
          <VCardText>
            <div class="d-flex justify-space-around gap-x-6 gap-y-2 flex-wrap mb-6">
              <div class="d-flex align-center me-8">
                <VAvatar variant="tonal" color="primary" rounded size="40" class="me-4"><VIcon icon="bx-group" size="24" /></VAvatar>
                <div>
                  <h5 class="text-h5">{{ deptData.userCount }}</h5>
                  <span class="text-body-1 d-inline-block">Members</span>
                </div>
              </div>
              <div v-if="deptData.children?.length" class="d-flex align-center me-4">
                <VAvatar variant="tonal" color="info" rounded size="38" class="me-4"><VIcon icon="bx-customize" size="24" /></VAvatar>
                <div>
                  <h5 class="text-h5">{{ deptData.children.length }}</h5>
                  <span class="text-body-1 d-inline-block">Sub-departments</span>
                </div>
              </div>
            </div>
            <h5 class="text-h5">Details</h5>
            <VDivider class="my-4" />
            <VList class="card-list mt-2" density="compact" lines="one">
              <VListItem><VListItemTitle><h6 class="text-h6">Name: <span class="text-body-1 d-inline-block">{{ deptData.name }}</span></h6></VListItemTitle></VListItem>
              <VListItem><VListItemTitle><h6 class="text-h6">Status: <VChip variant="tonal" :color="deptData.active !== false ? 'success' : 'error'" size="small" label class="ml-2">{{ deptData.active !== false ? 'Active' : 'Inactive' }}</VChip></h6></VListItemTitle></VListItem>
              <VListItem><VListItemTitle><h6 class="text-h6">Created: <span class="text-body-1 d-inline-block">{{ deptData.createdAt }}</span></h6></VListItemTitle></VListItem>
              <VListItem><VListItemTitle><h6 class="text-h6">Description: <span class="text-body-1 d-inline-block">{{ deptData.description || '-' }}</span></h6></VListItemTitle></VListItem>
            </VList>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Right Column -->
      <VCol cols="12" md="7" lg="8">
        <VTabs v-model="activeTab">
          <VTab value="overview"><VIcon icon="bx-info-circle" size="18" class="me-1" />Overview</VTab>
          <VTab value="members"><VIcon icon="bx-group" size="18" class="me-1" />Members ({{ deptUsers.length }})</VTab>
          <VTab v-if="deptData.children?.length" value="children"><VIcon icon="bx-customize" size="18" class="me-1" />Sub-departments</VTab>
        </VTabs>

        <div v-show="activeTab === 'overview'" class="mt-6">
          <VCard>
            <VCardItem><VCardTitle>Department Info</VCardTitle></VCardItem>
            <VDivider />
            <VCardText>
              <VRow>
                <VCol cols="12" md="6">
                  <div class="mb-4"><span class="text-body-2 text-medium-emphasis d-block mb-1">Department Name</span><h6 class="text-h6">{{ deptData.name }}</h6></div>
                </VCol>
                <VCol cols="12" md="6">
                  <div class="mb-4"><span class="text-body-2 text-medium-emphasis d-block mb-1">Members</span><h6 class="text-h6">{{ deptData.userCount }}</h6></div>
                </VCol>
                <VCol cols="12" md="6">
                  <div class="mb-4"><span class="text-body-2 text-medium-emphasis d-block mb-1">Status</span><VChip variant="tonal" :color="deptData.active !== false ? 'success' : 'error'" size="small" label>{{ deptData.active !== false ? 'Active' : 'Inactive' }}</VChip></div>
                </VCol>
                <VCol cols="12">
                  <div><span class="text-body-2 text-medium-emphasis d-block mb-1">Description</span><p class="text-body-1">{{ deptData.description || 'No description' }}</p></div>
                </VCol>
              </VRow>
            </VCardText>
          </VCard>
        </div>

        <div v-show="activeTab === 'members'" class="mt-6">
          <VCard>
            <VCardItem><VCardTitle>Department Members</VCardTitle></VCardItem>
            <VDivider />
            <VDataTable
              :headers="[
                { title: 'User', key: 'username' },
                { title: 'Full Name', key: 'fullName' },
                { title: 'Email', key: 'email' },
                { title: 'Role', key: 'role' },
                { title: 'Status', key: 'active' },
              ]"
              :items="deptUsers"
              :items-per-page="10"
              class="text-no-wrap"
            >
              <template #item.username="{ item }">
                <div class="d-flex align-center gap-x-2">
                  <VAvatar size="30" variant="tonal" color="primary" class="text-white text-xs">{{ (item.fullName || item.username).charAt(0).toUpperCase() }}</VAvatar>
                  <span class="font-weight-medium">{{ item.username }}</span>
                </div>
              </template>
              <template #item.active="{ item }">
                <VChip variant="tonal" :color="item.active !== false ? 'success' : 'error'" size="small" label>{{ item.active !== false ? 'Active' : 'Inactive' }}</VChip>
              </template>
            </VDataTable>
          </VCard>
        </div>

        <div v-if="deptData.children?.length" v-show="activeTab === 'children'" class="mt-6">
          <VCard>
            <VCardItem><VCardTitle>Sub-departments</VCardTitle></VCardItem>
            <VDivider />
            <VDataTable
              :headers="[
                { title: 'Name', key: 'name' },
                { title: 'Description', key: 'description' },
                { title: 'Members', key: 'userCount' },
                { title: 'Action', key: 'action', sortable: false },
              ]"
              :items="deptData.children"
              :items-per-page="10"
              class="text-no-wrap"
              hide-default-footer
            >
              <template #item.name="{ item }">
                <div class="d-flex align-center gap-x-3">
                  <VAvatar variant="tonal" color="info" rounded size="34"><VIcon icon="bx-briefcase" size="18" /></VAvatar>
                  <span class="font-weight-medium">{{ item.name }}</span>
                </div>
              </template>
              <template #item.action="{ item }">
                <NuxtLink :to="`/admin/system/dept/view?id=${item.id}`"><IconBtn><VIcon icon="bx-show" size="18" /></IconBtn></NuxtLink>
              </template>
            </VDataTable>
          </VCard>
        </div>
      </VCol>
    </VRow>
    </div>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" location="top">{{ snackbar.text }}</VSnackbar>
  </div>
</template>
