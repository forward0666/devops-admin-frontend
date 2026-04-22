export interface Permission {
  roleId: number
  menuId: number
  roleName?: string
  roleCode?: string
  menuName?: string
  permissionType: 'view' | 'edit' | 'all'
  createdAt: string
  updatedAt: string
}

export interface UpdatePermissionRequest {
  permissions: Array<{
    menuId: number
    permissionType: 'view' | 'edit' | 'all'
  }>
}
