import axios, { AxiosInstance, AxiosResponse } from 'axios'

// Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: User
  organization: Organization
  accessToken: string
  refreshToken: string
}

export interface User {
  id: string
  email: string
  fullName: string
  role: string
  isActive: boolean
  createdAt: string
}

export interface Organization {
  id: string
  name: string
  plan: string
  isActive: boolean
}

export interface Website {
  id: string
  url: string
  name: string
  status: string
  lastScanned: string
  geoScore: number
  optimizationLevel: number
}

export interface Scan {
  id: string
  websiteId: string
  status: string
  progress: number
  results?: any
  createdAt: string
  completedAt?: string
}

class ApiService {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: (import.meta as any).env?.VITE_API_URL || 'http://10.74.100.10:8000/api/v1',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor to add auth token and organization header
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        
        // Add organization ID header for organization-scoped endpoints
        const orgId = localStorage.getItem('currentOrgId')
        if (orgId && !config.url?.includes('/auth/') && !config.url?.includes('/health')) {
          config.headers['X-Organization-ID'] = orgId
        }
        
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const refreshToken = localStorage.getItem('refreshToken')
            if (refreshToken) {
              const response = await this.client.post('/auth/refresh', {
                refreshToken,
              })

              const { accessToken } = response.data.data
              localStorage.setItem('accessToken', accessToken)

              return this.client(originalRequest)
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            window.location.href = '/login'
          }
        }

        return Promise.reject(error)
      }
    )
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.client.post<ApiResponse<LoginResponse>>('/auth/login', credentials)
    return response.data.data!
  }

  async register(userData: any): Promise<LoginResponse> {
    const response = await this.client.post<ApiResponse<LoginResponse>>('/auth/register', userData)
    return response.data.data!
  }

  async logout(): Promise<void> {
    await this.client.post('/auth/logout')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  async getProfile(): Promise<User> {
    const response = await this.client.get<ApiResponse<User>>('/auth/profile')
    return response.data.data!
  }

  async updateProfile(profileData: { fullName?: string; company?: string }): Promise<User> {
    const response = await this.client.put<ApiResponse<User>>('/auth/profile', profileData)
    return response.data.data!
  }

  async forgotPassword(email: string): Promise<void> {
    await this.client.post('/auth/forgot-password', { email })
  }

  async resetPassword(token: string, password: string): Promise<void> {
    await this.client.post('/auth/reset-password', { token, password })
  }

  // Website endpoints
  async getWebsites(params?: { search?: string; page?: number; limit?: number }): Promise<{ websites: Website[]; pagination: any }> {
    const queryParams = new URLSearchParams()
    if (params?.search) queryParams.append('search', params.search)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    
    const url = queryParams.toString() ? `/websites?${queryParams.toString()}` : '/websites'
    const response = await this.client.get<ApiResponse<{ websites: Website[]; pagination: any }>>(url)
    return response.data.data!
  }

  async getWebsite(id: string): Promise<{ website: Website; metrics: any }> {
    const response = await this.client.get<ApiResponse<{ website: Website; metrics: any }>>(`/websites/${id}`)
    return response.data.data!
  }

  async createWebsite(websiteData: Partial<Website>): Promise<Website> {
    const response = await this.client.post<ApiResponse<{ website: Website }>>('/websites', websiteData)
    return response.data.data!.website
  }

  async updateWebsite(id: string, websiteData: Partial<Website>): Promise<Website> {
    const response = await this.client.put<ApiResponse<{ website: Website }>>(`/websites/${id}`, websiteData)
    return response.data.data!.website
  }

  async deleteWebsite(id: string): Promise<void> {
    await this.client.delete(`/websites/${id}`)
  }

  async getWebsiteContent(id: string, params?: { page?: number; limit?: number; search?: string }): Promise<{ contents: any[]; pagination: any }> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.search) queryParams.append('search', params.search)
    
    const url = queryParams.toString() ? `/websites/${id}/content?${queryParams.toString()}` : `/websites/${id}/content`
    const response = await this.client.get<ApiResponse<{ contents: any[]; pagination: any }>>(url)
    return response.data.data!
  }

  async getWebsiteAnalytics(id: string): Promise<{ website: Website; analytics: any }> {
    const response = await this.client.get<ApiResponse<{ website: Website; analytics: any }>>(`/websites/${id}/analytics`)
    return response.data.data!
  }

  // Scan endpoints
  async startScan(websiteId: string, scanType: 'quick' | 'standard' = 'quick'): Promise<Scan> {
    const response = await this.client.post<ApiResponse<Scan>>('/scans', { websiteId, scanType })
    return response.data.data!
  }

  async getScan(id: string): Promise<Scan> {
    const response = await this.client.get<ApiResponse<Scan>>(`/scans/${id}`)
    return response.data.data!
  }

  async getScans(params?: { websiteId?: string; page?: number; limit?: number }): Promise<{ data: Scan[]; pagination?: any }> {
    const queryParams = new URLSearchParams()
    if (params?.websiteId) queryParams.append('websiteId', params.websiteId)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    
    const url = queryParams.toString() ? `/scans?${queryParams.toString()}` : '/scans'
    const response = await this.client.get<ApiResponse<{ data: Scan[]; pagination?: any }>>(url)
    
    // Handle different response formats (with or without pagination)
    if (response.data.pagination) {
      return { data: response.data.data as Scan[], pagination: response.data.pagination }
    } else {
      return { data: response.data.data as Scan[] }
    }
  }

  // Content Optimization endpoints
  async getOptimizationSuggestions(url: string, content?: string): Promise<any> {
    const response = await this.client.post<ApiResponse>('/content/optimization-suggestions', {
      url,
      content
    })
    return response.data.data!
  }

  // AI Tracking endpoints
  async getAIMentions(websiteId: string, params?: { platform?: string; dateRange?: string; page?: number; limit?: number }): Promise<any> {
    const queryParams = new URLSearchParams()
    queryParams.append('websiteId', websiteId)
    if (params?.platform) queryParams.append('platform', params.platform)
    if (params?.dateRange) queryParams.append('dateRange', params.dateRange)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    
    const response = await this.client.get<ApiResponse>(`/tracking/mentions?${queryParams.toString()}`)
    return response.data.data!
  }

  async getVisibilityTrends(websiteId: string, period: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<any> {
    const response = await this.client.get<ApiResponse>(`/tracking/visibility-trends?websiteId=${websiteId}&period=${period}`)
    return response.data.data!
  }

  // Dashboard endpoints
  async getDashboardStats(): Promise<any> {
    const response = await this.client.get<ApiResponse>('/dashboard/stats')
    return response.data.data!
  }

  // Health check
  async healthCheck(): Promise<any> {
    const response = await this.client.get<ApiResponse>('/health')
    return response.data
  }
}

// Export singleton instance
export const apiService = new ApiService()
export default apiService