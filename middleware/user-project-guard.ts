import { userConsoleMemberService, userConsoleProjectService } from '~/services/api'

export default defineNuxtRouteMiddleware(async (to) => {
  // Only guard /user/project/[id]/* routes
  const match = to.path.match(/^\/user\/project\/(\d+)/)
  if (!match) return

  const projectId = match[1]
  const authStore = useAuthStore()

  // Admin/devops/sys_admin can access all projects
  if (authStore.isAdmin) return

  // Check if user is a member of this project
  try {
    const res = await userConsoleMemberService.list(Number(projectId))
    const members = Array.isArray(res) ? res : res?.data || []
    const isMember = members.some((m: any) => Number(m.userId) === Number(authStore.user?.id))
    if (!isMember) {
      return navigateTo('/user/dashboard')
    }
  } catch {
    return navigateTo('/user/dashboard')
  }
})
