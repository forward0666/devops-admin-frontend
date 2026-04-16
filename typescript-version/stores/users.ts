import { defineStore } from 'pinia'

interface User {
  id: number
  fullName: string
  email: string
  role: string
  team: string
  department: string
  status: string
  avatar: number
}

export const useUserStore = defineStore('users', {
  state: () => ({
    users: [
      { id: 50, fullName: 'Beverlie Krabbe', email: 'bkrabbe1d@home.pl', role: 'editor', team: 'Product', department: 'Engineering', status: 'active', avatar: 1 },
      { id: 49, fullName: 'Paulie Durber', email: 'pdurber1c@gov.uk', role: 'subscriber', team: 'Design', department: 'Marketing', status: 'inactive', avatar: 2 },
      { id: 48, fullName: 'Onfre Wind', email: 'owind1b@yandex.ru', role: 'admin', team: 'Backend', department: 'Engineering', status: 'pending', avatar: 3 },
      { id: 47, fullName: 'Karena Courtliff', email: 'kcourtliff1a@bbc.co.uk', role: 'admin', team: 'DevOps', department: 'Operations', status: 'active', avatar: 6 },
      { id: 46, fullName: 'Saunder Offner', email: 'soffner19@mac.com', role: 'maintainer', team: 'QA', department: 'Engineering', status: 'pending', avatar: 4 },
      { id: 45, fullName: 'Corrie Perot', email: 'cperot18@goo.ne.jp', role: 'subscriber', team: 'Frontend', department: 'Engineering', status: 'pending', avatar: 5 },
      { id: 44, fullName: 'Vladamir Koschek', email: 'vkoschek17@abc.net.au', role: 'author', team: 'Security', department: 'IT', status: 'active', avatar: 1 },
      { id: 43, fullName: 'Micaela McNirlan', email: 'mmcnirlan16@hc360.com', role: 'admin', team: 'Data', department: 'Analytics', status: 'inactive', avatar: 2 },
      { id: 42, fullName: 'Benedetto Rossiter', email: 'brossiter15@craigslist.org', role: 'editor', team: 'Mobile', department: 'Engineering', status: 'inactive', avatar: 1 },
      { id: 41, fullName: 'Garvin Odem', email: 'godem14@eepurl.com', role: 'subscriber', team: 'Support', department: 'Customer Success', status: 'active', avatar: 3 },
    ] as User[],
  }),

  actions: {
    addUser(user: Omit<User, 'id'>) {
      const newId = Math.max(...this.users.map(u => u.id), 0) + 1
      this.users.push({ ...user, id: newId })
    },
    deleteUser(id: number) {
      this.users = this.users.filter(u => u.id !== id)
    },
  },
})
