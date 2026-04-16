// Shared project data for NavItems and Project List page
import { defineStore } from 'pinia'

interface Project {
  id: number
  name: string
  type: string
  status: string
  progress: number
  leader: string
  created: string
}

export const useProjectStore = defineStore('projects', {
  serializable: false,
  state: () => ({
    projects: [
      { id: 1, name: 'Dashboard Design', type: 'Vuejs Project', status: 'active', progress: 62, leader: 'Keith', created: '2024-01-01' },
      { id: 2, name: 'BGC eCommerce App', type: 'React Project', status: 'active', progress: 78, leader: 'Eileen', created: '2024-01-15' },
      { id: 3, name: 'Falcon Logo Design', type: 'Figma Project', status: 'completed', progress: 100, leader: 'Owen', created: '2023-10-01' },
      { id: 4, name: 'Foodista Mobile App', type: 'Xamarin Project', status: 'pending', progress: 8, leader: 'Merline', created: '2024-02-01' },
    ] as Project[],
  }),

  actions: {
    addProject(project: Omit<Project, 'id'>) {
      const newId = Math.max(...this.projects.map(p => p.id), 0) + 1
      this.projects.push({ ...project, id: newId })
    },
    updateProject(id: number, data: Partial<Project>) {
      const idx = this.projects.findIndex(p => p.id === id)
      if (idx !== -1) Object.assign(this.projects[idx], data)
    },
    deleteProject(id: number) {
      this.projects = this.projects.filter(p => p.id !== id)
    },
  },
})
