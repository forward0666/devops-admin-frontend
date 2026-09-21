// 后端统一响应格式
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 分页请求
export interface PageRequest {
  page?: number
  size?: number
  keyword?: string
}

// 分页响应
export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}
