import { defineStore } from 'pinia'
import { projectService } from '~/services/api'

interface Project {
  id: number
  name: string
  type: string
  status: string
  progress: number
  leader: string
  departmentId?: number
  description?: string
  techStack?: string
  objectives?: string
  createdAt?: string
  updatedAt?: string
}

export const useProjectStore = defineStore('projects', {
  state: () => ({
    projects: [] as Project[],
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchProjects() {
      this.loading = true
      this.error = null
      try {
        const res: any = await projectService.list()
        this.projects = Array.isArray(res) ? res : res?.data || []
      } catch (e: any) {
        this.error = e.message || '获取项目列表失败'
      } finally {
        this.loading = false
      }
    },

    async addProject(project: any) {
      try {
        const res: any = await projectService.create(project)
        const created = Array.isArray(res) ? res[0] : res?.data || res
        this.projects.unshift(created)
        return created
      } catch (e: any) {
        this.error = e.message || '创建项目失败'
        throw e
      }
    },

    async updateProject(id: number, data: any) {
      try {
        const res: any = await projectService.update(id, data)
        const updated = Array.isArray(res) ? res[0] : res?.data || res
        const idx = this.projects.findIndex(p => p.id === id)
        if (idx !== -1) this.projects[idx] = updated
        return updated
      } catch (e: any) {
        this.error = e.message || '更新项目失败'
        throw e
      }
    },

    async deleteProject(id: number) {
      try {
        await projectService.delete(id)
        this.projects = this.projects.filter(p => p.id !== id)
      } catch (e: any) {
        this.error = e.message || '删除项目失败'
        throw e
      }
    },
  },
})
