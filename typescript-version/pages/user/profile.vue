<script setup lang="ts">
const authStore = useAuthStore()
</script>

<template>
  <div>
    <VRow>
      <VCol cols="12" md="5">
        <VCard>
          <VCardText class="text-center pt-12">
            <VAvatar size="120" variant="tonal" color="primary" rounded>
              <span class="text-h2">{{ authStore.userName.charAt(0) }}</span>
            </VAvatar>
            <h5 class="text-h5 mt-4">{{ authStore.userName }}</h5>
            <VChip variant="tonal" color="secondary" size="small" label class="mt-4">User</VChip>
          </VCardText>
          <VCardText>
            <h5 class="text-h5">Details</h5>
            <VDivider class="my-4" />
            <VList class="card-list" density="compact" lines="one">
              <VListItem><VListItemTitle><h6 class="text-h6">Username: <span class="text-body-1 d-inline-block">{{ authStore.userName }}</span></h6></VListItemTitle></VListItem>
              <VListItem><VListItemTitle><h6 class="text-h6">Role: <span class="text-body-1 d-inline-block">User</span></h6></VListItemTitle></VListItem>
              <VListItem><VListItemTitle><h6 class="text-h6">Status: <span class="text-body-1 d-inline-block">Active</span></h6></VListItemTitle></VListItem>
            </VList>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" md="7">
        <VCard>
          <VCardItem><VCardTitle>My Settings</VCardTitle></VCardItem>
          <VDivider />
          <VCardText>
            <VForm>
              <VRow>
                <VCol cols="12" md="6">
                  <VTextField label="Full Name" variant="outlined" model-value="John Doe" />
                </VCol>
                <VCol cols="12" md="6">
                  <VTextField label="Email" variant="outlined" model-value="john@example.com" />
                </VCol>
                <VCol cols="12" md="6">
                  <VTextField label="Phone" variant="outlined" model-value="+1 234 567 8901" />
                </VCol>
                <VCol cols="12" md="6">
                  <VSelect label="Language" :items="['English', 'Chinese']" variant="outlined" model-value="English" />
                </VCol>
              </VRow>
              <VBtn color="primary" class="mt-4">Save Changes</VBtn>
            </VForm>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>
