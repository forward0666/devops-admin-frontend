export interface Menu {
  menuId: number
  name: string
  path: string
  icon?: string
  type: 'menu' | 'button'
  sort: number
  status: 'active' | 'inactive'
  parentId?: number
  parentName?: string
  createdAt: string
  updatedAt: string
  children?: Menu[]
}

export interface CreateMenuRequest {
  name: string
  path: string
  icon?: string
  type: 'menu' | 'button'
  sort: number
  status?: 'active' | 'inactive'
  parentId?: number
}

export interface UpdateMenuRequest {
  name?: string
  path?: string
  icon?: string
  type?: 'menu' | 'button'
  sort?: number
  status?: 'active' | 'inactive'
  parentId?: number
}
