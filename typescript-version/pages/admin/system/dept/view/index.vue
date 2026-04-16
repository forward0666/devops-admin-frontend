<script setup lang="ts">
const route = useRoute()
const deptName = ref(decodeURIComponent(route.query.name as string || ''))
watch(() => route.query, (q) => {
  deptName.value = decodeURIComponent(q.name as string || '')
}, { immediate: true })

const departments = [
  {
    id: 1, name: 'Headquarters', type: 'office', children: [
      { id: 2, name: 'Research Department', type: 'department', children: [
        { id: 3, name: 'Frontend Team', type: 'team', leader: 'Mary', members: 8 },
        { id: 4, name: 'Backend Team', type: 'team', leader: 'Tom', members: 10 },
      ]},
      { id: 5, name: 'Operations Department', type: 'department', children: [
        { id: 8, name: 'DevOps Team', type: 'team', leader: 'Jerry', members: 6 },
        { id: 9, name: 'SRE Team', type: 'team', leader: 'Anna', members: 5 },
      ]},
      { id: 6, name: 'Finance Department', type: 'department', children: [
        { id: 10, name: 'Accounting Team', type: 'team', leader: 'Bob', members: 4 },
      ]},
      { id: 7, name: 'Marketing Department', type: 'department', children: [
        { id: 11, name: 'Growth Team', type: 'team', leader: 'Diana', members: 5 },
      ]},
    ],
  },
  {
    id: 12, name: 'Branch Office', type: 'office', children: [
      { id: 13, name: 'Sales Department', type: 'department', children: [
        { id: 14, name: 'Domestic Sales Team', type: 'team', leader: 'Liam', members: 7 },
        { id: 15, name: 'Overseas Sales Team', type: 'team', leader: 'Noah', members: 6 },
      ]},
      { id: 16, name: 'Support Department', type: 'department', children: [
        { id: 17, name: 'CS Team', type: 'team', leader: 'Oliver', members: 5 },
      ]},
    ],
  },
]

function findDept(items: any[], name: string): any {
  for (const item of items) {
    if (item.name === name) return item
    if (item.children) {
      const found = findDept(item.children, name)
      if (found) return found
    }
  }
  return null
}

const found = computed(() => findDept(departments, deptName.value))

const typeConfig: Record<string, { icon: string; color: string; childLabel: string; childIcon: string }> = {
  office: { icon: 'bx-building', color: 'primary', childLabel: 'Departments', childIcon: 'bx-briefcase' },
  department: { icon: 'bx-briefcase', color: 'info', childLabel: 'Teams', childIcon: 'bx-group' },
  team: { icon: 'bx-group', color: 'success', childLabel: '', childIcon: '' },
}

const deptData = computed(() => {
  const d = found.value
  if (!d) return { name: deptName.value || 'Unknown', type: 'office', leader: '-', status: 'active', createdAt: '-', description: 'No data found.', childCount: 0, memberCount: 0, children: [] }
  const totalMembers = d.children?.reduce((sum: number, c: any) => sum + (c.members || c.children?.reduce((s: number, cc: any) => s + (cc.members || 0), 0) || 0), 0) || 0
  return {
    name: d.name,
    type: d.type,
    leader: d.leader,
    status: 'active',
    createdAt: '2025-01-15',
    description: `Responsible for ${d.name.toLowerCase()} operations and management.`,
    childCount: d.children?.length || 0,
    memberCount: totalMembers,
    children: d.children?.map((c: any) => ({ name: c.name, leader: c.leader, members: c.members || c.children?.length || 0 })) || [],
  }
})

const activeTab = ref('overview')
</script>

<template>
  <div>
    <VRow>
      <!-- Left Column -->
      <VCol cols="12" md="5" lg="4">
        <VCard>
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
                  <h5 class="text-h5">{{ deptData.memberCount }}</h5>
                  <span class="text-body-1 d-inline-block">Members</span>
                </div>
              </div>
              <div v-if="deptData.type !== 'team'" class="d-flex align-center me-4">
                <VAvatar variant="tonal" color="info" rounded size="38" class="me-4"><VIcon :icon="typeConfig[deptData.type]?.childIcon || 'bx-customize'" size="24" /></VAvatar>
                <div>
                  <h5 class="text-h5">{{ deptData.childCount }}</h5>
                  <span class="text-body-1 d-inline-block">{{ typeConfig[deptData.type]?.childLabel || 'Children' }}</span>
                </div>
              </div>
            </div>
            <h5 class="text-h5">Details</h5>
            <VDivider class="my-4" />
            <VList class="card-list mt-2" density="compact" lines="one">
              <VListItem><VListItemTitle><h6 class="text-h6">Name: <span class="text-body-1 d-inline-block">{{ deptData.name }}</span></h6></VListItemTitle></VListItem>
              <VListItem><VListItemTitle><h6 class="text-h6">Type: <span class="text-body-1 text-capitalize d-inline-block">{{ deptData.type }}</span></h6></VListItemTitle></VListItem>
              <VListItem><VListItemTitle><h6 class="text-h6">Status: <span class="text-body-1 text-capitalize d-inline-block">{{ deptData.status }}</span></h6></VListItemTitle></VListItem>
              <VListItem v-if="deptData.leader"><VListItemTitle><h6 class="text-h6">Leader: <span class="text-body-1 d-inline-block">{{ deptData.leader }}</span></h6></VListItemTitle></VListItem>
              <VListItem><VListItemTitle><h6 class="text-h6">Created: <span class="text-body-1 d-inline-block">{{ deptData.createdAt }}</span></h6></VListItemTitle></VListItem>
            </VList>
          </VCardText>
          <VCardText class="d-flex justify-center gap-x-4">
            <VBtn variant="elevated" color="primary">Edit</VBtn>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Right Column -->
      <VCol cols="12" md="7" lg="8">

        <!-- Office View -->
        <template v-if="deptData.type === 'office'">
          <VTabs v-model="activeTab">
            <VTab value="overview"><VIcon icon="bx-info-circle" size="18" class="me-1" />Overview</VTab>
            <VTab value="departments"><VIcon icon="bx-briefcase" size="18" class="me-1" />Departments</VTab>
            <VTab value="stats"><VIcon icon="bx-bar-chart" size="18" class="me-1" />Statistics</VTab>
          </VTabs>
          <div v-show="activeTab === 'overview'" class="mt-6">
            <VCard>
              <VCardItem><VCardTitle>Office Info</VCardTitle></VCardItem>
              <VDivider />
              <VCardText>
                <VRow>
                  <VCol cols="12" md="6">
                    <div class="mb-4"><span class="text-body-2 text-medium-emphasis d-block mb-1">Office Name</span><h6 class="text-h6">{{ deptData.name }}</h6></div>
                  </VCol>
                  <VCol cols="12" md="6">
                    <div class="mb-4"><span class="text-body-2 text-medium-emphasis d-block mb-1">Leader</span><h6 class="text-h6">{{ deptData.leader }}</h6></div>
                  </VCol>
                  <VCol cols="12" md="6">
                    <div class="mb-4"><span class="text-body-2 text-medium-emphasis d-block mb-1">Departments</span><h6 class="text-h6">{{ deptData.childCount }}</h6></div>
                  </VCol>
                  <VCol cols="12" md="6">
                    <div class="mb-4"><span class="text-body-2 text-medium-emphasis d-block mb-1">Total Members</span><h6 class="text-h6">{{ deptData.memberCount }}</h6></div>
                  </VCol>
                  <VCol cols="12">
                    <div><span class="text-body-2 text-medium-emphasis d-block mb-1">Description</span><p class="text-body-1">{{ deptData.description }}</p></div>
                  </VCol>
                </VRow>
              </VCardText>
            </VCard>
          </div>
          <div v-show="activeTab === 'departments'" class="mt-6">
            <VCard>
              <VCardItem><VCardTitle>Departments</VCardTitle></VCardItem>
              <VDivider />
              <VDataTable :headers="[{ title: 'Department', key: 'name' }, { title: 'Leader', key: 'leader' }, { title: 'Teams', key: 'members' }, { title: 'Action', key: 'action', sortable: false }]" :items="deptData.children" :items-per-page="5" class="text-no-wrap" hide-default-footer>
                <template #item.name="{ item }">
                  <div class="d-flex align-center gap-x-3">
                    <VAvatar variant="tonal" color="info" rounded size="34"><VIcon icon="bx-briefcase" size="18" /></VAvatar>
                    <span class="font-weight-medium">{{ item.name }}</span>
                  </div>
                </template>
                <template #item.members="{ item }">
                  <VChip variant="tonal" color="primary" size="small">{{ item.members }} teams</VChip>
                </template>
                <template #item.action="{ item }">
                  <NuxtLink :to="`/admin/system/dept/view?name=${item.name}`"><IconBtn><VIcon icon="bx-show" size="18" /></IconBtn></NuxtLink>
                  <IconBtn><VIcon icon="bx-dots-vertical-rounded" /></IconBtn>
                </template>
              </VDataTable>
            </VCard>
          </div>
          <div v-show="activeTab === 'stats'" class="mt-6">
            <VCard>
              <VCardItem><VCardTitle>Statistics</VCardTitle></VCardItem>
              <VDivider />
              <VCardText>
                <VRow>
                  <VCol cols="12" sm="4">
                    <VCard variant="tonal" color="primary">
                      <VCardText class="text-center"><VIcon icon="bx-briefcase" size="32" class="mb-2" /><h4 class="text-h4">{{ deptData.childCount }}</h4><span class="text-body-2">Departments</span></VCardText>
                    </VCard>
                  </VCol>
                  <VCol cols="12" sm="4">
                    <VCard variant="tonal" color="info">
                      <VCardText class="text-center"><VIcon icon="bx-group" size="32" class="mb-2" /><h4 class="text-h4">{{ deptData.memberCount }}</h4><span class="text-body-2">Members</span></VCardText>
                    </VCard>
                  </VCol>
                  <VCol cols="12" sm="4">
                    <VCard variant="tonal" color="success">
                      <VCardText class="text-center"><VIcon icon="bx-check-circle" size="32" class="mb-2" /><h4 class="text-h4">Active</h4><span class="text-body-2">Status</span></VCardText>
                    </VCard>
                  </VCol>
                </VRow>
              </VCardText>
            </VCard>
          </div>
        </template>

        <!-- Department View -->
        <template v-else-if="deptData.type === 'department'">
          <VTabs v-model="activeTab">
            <VTab value="overview"><VIcon icon="bx-info-circle" size="18" class="me-1" />Overview</VTab>
            <VTab value="teams"><VIcon icon="bx-group" size="18" class="me-1" />Teams</VTab>
            <VTab value="projects"><VIcon icon="bx-briefcase" size="18" class="me-1" />Projects</VTab>
          </VTabs>
          <div v-show="activeTab === 'overview'" class="mt-6">
            <VRow>
              <VCol cols="12" sm="4">
                <VCard variant="tonal" color="primary">
                  <VCardText class="text-center"><VIcon icon="bx-group" size="32" class="mb-2" /><h4 class="text-h4">{{ deptData.childCount }}</h4><span class="text-body-2">Teams</span></VCardText>
                </VCard>
              </VCol>
              <VCol cols="12" sm="4">
                <VCard variant="tonal" color="info">
                  <VCardText class="text-center"><VIcon icon="bx-user" size="32" class="mb-2" /><h4 class="text-h4">{{ deptData.memberCount }}</h4><span class="text-body-2">Members</span></VCardText>
                </VCard>
              </VCol>
              <VCol cols="12" sm="4">
                <VCard variant="tonal" color="success">
                  <VCardText class="text-center"><VIcon icon="bx-task" size="32" class="mb-2" /><h4 class="text-h4">3</h4><span class="text-body-2">Active Projects</span></VCardText>
                </VCard>
              </VCol>
            </VRow>
            <VCard class="mt-6">
              <VCardItem><VCardTitle>Department Info</VCardTitle></VCardItem>
              <VDivider />
              <VCardText>
                <VRow>
                  <VCol cols="12" md="4">
                    <div class="mb-4"><span class="text-body-2 text-medium-emphasis d-block mb-1">Department</span><h6 class="text-h6">{{ deptData.name }}</h6></div>
                  </VCol>
                  <VCol cols="12" md="4">
                    <div class="mb-4"><span class="text-body-2 text-medium-emphasis d-block mb-1">Leader</span><h6 class="text-h6">{{ deptData.leader }}</h6></div>
                  </VCol>
                  <VCol cols="12" md="4">
                    <div class="mb-4"><span class="text-body-2 text-medium-emphasis d-block mb-1">Status</span><VChip variant="tonal" color="success" size="small" label>active</VChip></div>
                  </VCol>
                  <VCol cols="12">
                    <div><span class="text-body-2 text-medium-emphasis d-block mb-1">Description</span><p class="text-body-1">{{ deptData.description }}</p></div>
                  </VCol>
                </VRow>
              </VCardText>
            </VCard>
          </div>
          <div v-show="activeTab === 'teams'" class="mt-6">
            <VCard>
              <VCardItem><VCardTitle>Teams</VCardTitle></VCardItem>
              <VDivider />
              <VDataTable :headers="[{ title: 'Team Name', key: 'name' }, { title: 'Leader', key: 'leader' }, { title: 'Members', key: 'members' }, { title: 'Progress', key: 'progress' }, { title: 'Action', key: 'action', sortable: false }]" :items="deptData.children.map((c, i) => ({ ...c, progress: [78, 62, 45, 85, 90][i % 5] }))" :items-per-page="5" class="text-no-wrap" hide-default-footer>
                <template #item.name="{ item }">
                  <div class="d-flex align-center gap-x-3">
                    <VAvatar variant="tonal" color="success" rounded size="34"><VIcon icon="bx-group" size="18" /></VAvatar>
                    <span class="font-weight-medium">{{ item.name }}</span>
                  </div>
                </template>
                <template #item.members="{ item }">
                  <VChip variant="tonal" color="primary" size="small">{{ item.members }} people</VChip>
                </template>
                <template #item.progress="{ item }">
                  <div class="d-flex align-center gap-3">
                    <VProgressLinear :model-value="item.progress" color="primary" rounded height="6" style="max-inline-size: 100px;" />
                    <span class="text-body-2">{{ item.progress }}%</span>
                  </div>
                </template>
                <template #item.action="{ item }">
                  <NuxtLink :to="`/admin/system/dept/view?name=${item.name}`"><IconBtn><VIcon icon="bx-show" size="18" /></IconBtn></NuxtLink>
                  <IconBtn><VIcon icon="bx-dots-vertical-rounded" /></IconBtn>
                </template>
              </VDataTable>
            </VCard>
          </div>
          <div v-show="activeTab === 'projects'" class="mt-6">
            <VCard>
              <VCardItem><VCardTitle>Active Projects</VCardTitle></VCardItem>
              <VDivider />
              <VDataTable :headers="[{ title: 'Project', key: 'name' }, { title: 'Status', key: 'status' }, { title: 'Progress', key: 'progress' }, { title: 'Priority', key: 'priority' }]" :items="[
                { name: `${deptData.name} Platform`, status: 'In Progress', progress: 72, priority: 'High' },
                { name: `${deptData.name} API v2`, status: 'Planning', progress: 15, priority: 'Medium' },
                { name: `${deptData.name} Migration`, status: 'In Progress', progress: 45, priority: 'High' },
              ]" :items-per-page="5" class="text-no-wrap" hide-default-footer>
                <template #item.name="{ item }">
                  <div class="d-flex align-center gap-x-3">
                    <VAvatar variant="tonal" color="primary" rounded size="34"><span class="text-sm font-weight-medium">{{ item.name.charAt(0) }}</span></VAvatar>
                    <span class="font-weight-medium">{{ item.name }}</span>
                  </div>
                </template>
                <template #item.status="{ item }">
                  <VChip variant="tonal" :color="item.status === 'In Progress' ? 'primary' : 'warning'" size="small" label>{{ item.status }}</VChip>
                </template>
                <template #item.progress="{ item }">
                  <div class="d-flex align-center gap-3">
                    <VProgressLinear :model-value="item.progress" color="primary" rounded height="6" style="max-inline-size: 100px;" />
                    <span class="text-body-2">{{ item.progress }}%</span>
                  </div>
                </template>
                <template #item.priority="{ item }">
                  <VChip variant="tonal" :color="item.priority === 'High' ? 'error' : 'info'" size="small" label>{{ item.priority }}</VChip>
                </template>
              </VDataTable>
            </VCard>
          </div>
        </template>

        <!-- Team View -->
        <template v-else-if="deptData.type === 'team'">
          <VTabs v-model="activeTab">
            <VTab value="overview"><VIcon icon="bx-info-circle" size="18" class="me-1" />Overview</VTab>
            <VTab value="members"><VIcon icon="bx-user" size="18" class="me-1" />Members</VTab>
            <VTab value="performance"><VIcon icon="bx-bar-chart" size="18" class="me-1" />Performance</VTab>
          </VTabs>
          <div v-show="activeTab === 'overview'" class="mt-6">
            <VCard>
              <VCardItem><VCardTitle>Team Info</VCardTitle></VCardItem>
              <VDivider />
              <VCardText>
                <VRow>
                  <VCol cols="12" md="6">
                    <div class="mb-4"><span class="text-body-2 text-medium-emphasis d-block mb-1">Team Name</span><h6 class="text-h6">{{ deptData.name }}</h6></div>
                  </VCol>
                  <VCol cols="12" md="6">
                    <div class="mb-4"><span class="text-body-2 text-medium-emphasis d-block mb-1">Leader</span><h6 class="text-h6">{{ deptData.leader }}</h6></div>
                  </VCol>
                  <VCol cols="12" md="6">
                    <div class="mb-4"><span class="text-body-2 text-medium-emphasis d-block mb-1">Members</span><h6 class="text-h6">{{ deptData.memberCount || deptData.children[0]?.members || 0 }}</h6></div>
                  </VCol>
                  <VCol cols="12" md="6">
                    <div class="mb-4"><span class="text-body-2 text-medium-emphasis d-block mb-1">Status</span><VChip variant="tonal" color="success" size="small" label>active</VChip></div>
                  </VCol>
                </VRow>
              </VCardText>
            </VCard>
          </div>
          <div v-show="activeTab === 'members'" class="mt-6">
            <VCard>
              <VCardItem><VCardTitle>Team Members</VCardTitle></VCardItem>
              <VDivider />
              <VCardText>
                <div class="d-flex flex-column gap-y-3">
                  <div class="d-flex align-center gap-x-4">
                    <VAvatar variant="tonal" color="warning" rounded size="38"><span class="text-sm font-weight-medium">{{ deptData.leader?.charAt(0) || 'L' }}</span></VAvatar>
                    <div class="flex-grow-1">
                      <h6 class="text-h6">{{ deptData.leader }}</h6>
                      <span class="text-body-2 text-medium-emphasis">{{ deptData.name }} · Leader</span>
                    </div>
                    <VChip variant="tonal" color="warning" size="small" label>leader</VChip>
                  </div>
                  <VDivider />
                  <div v-for="i in 5" :key="i" class="d-flex align-center gap-x-4">
                    <VAvatar variant="tonal" :color="['primary', 'success', 'info', 'error', 'secondary'][i - 1]" rounded size="38">
                      <span class="text-sm font-weight-medium">{{ ['A', 'B', 'C', 'D', 'E'][i - 1] }}</span>
                    </VAvatar>
                    <div class="flex-grow-1">
                      <h6 class="text-h6">Member {{ i }}</h6>
                      <span class="text-body-2 text-medium-emphasis">{{ deptData.name }}</span>
                    </div>
                    <VChip variant="tonal" color="info" size="small" label>user</VChip>
                  </div>
                </div>
              </VCardText>
            </VCard>
          </div>
          <div v-show="activeTab === 'performance'" class="mt-6">
            <VCard>
              <VCardItem><VCardTitle>Performance</VCardTitle></VCardItem>
              <VDivider />
              <VCardText>
                <VRow>
                  <VCol cols="12" sm="4">
                    <VCard variant="tonal" color="primary">
                      <VCardText class="text-center"><VIcon icon="bx-task" size="32" class="mb-2" /><h4 class="text-h4">128</h4><span class="text-body-2">Tasks Done</span></VCardText>
                    </VCard>
                  </VCol>
                  <VCol cols="12" sm="4">
                    <VCard variant="tonal" color="success">
                      <VCardText class="text-center"><VIcon icon="bx-check-circle" size="32" class="mb-2" /><h4 class="text-h4">96%</h4><span class="text-body-2">Completion Rate</span></VCardText>
                    </VCard>
                  </VCol>
                  <VCol cols="12" sm="4">
                    <VCard variant="tonal" color="warning">
                      <VCardText class="text-center"><VIcon icon="bx-time-five" size="32" class="mb-2" /><h4 class="text-h4">2.3d</h4><span class="text-body-2">Avg Response</span></VCardText>
                    </VCard>
                  </VCol>
                </VRow>
              </VCardText>
            </VCard>
          </div>
        </template>

      </VCol>
    </VRow>
  </div>
</template>
