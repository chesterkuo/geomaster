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
      baseURL: (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api/v1',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
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

  // Website endpoints
  async getWebsites(): Promise<Website[]> {
    const response = await this.client.get<ApiResponse<Website[]>>('/websites')
    return response.data.data!
  }

  async getWebsite(id: string): Promise<Website> {
    const response = await this.client.get<ApiResponse<Website>>(`/websites/${id}`)
    return response.data.data!
  }

  async createWebsite(websiteData: Partial<Website>): Promise<Website> {
    const response = await this.client.post<ApiResponse<Website>>('/websites', websiteData)
    return response.data.data!
  }

  async updateWebsite(id: string, websiteData: Partial<Website>): Promise<Website> {
    const response = await this.client.put<ApiResponse<Website>>(`/websites/${id}`, websiteData)
    return response.data.data!
  }

  async deleteWebsite(id: string): Promise<void> {
    await this.client.delete(`/websites/${id}`)
  }

  // Scan endpoints
  async startScan(websiteId: string): Promise<Scan> {
    const response = await this.client.post<ApiResponse<Scan>>('/scans', { websiteId })
    return response.data.data!
  }

  async getScan(id: string): Promise<Scan> {
    const response = await this.client.get<ApiResponse<Scan>>(`/scans/${id}`)
    return response.data.data!
  }

  async getScans(websiteId?: string): Promise<Scan[]> {
    const url = websiteId ? `/scans?websiteId=${websiteId}` : '/scans'
    const response = await this.client.get<ApiResponse<Scan[]>>(url)
    return response.data.data!
  }

  // Optimization endpoints
  async optimizeContent(contentId: string, optimizationType: string): Promise<any> {
    const response = await this.client.post<ApiResponse>('/content/optimize', {
      contentId,
      optimizationType
    })
    return response.data.data!
  }

  async getOptimizationSuggestions(websiteId: string): Promise<any[]> {
    const response = await this.client.get<ApiResponse<any[]>>(`/optimization/suggestions/${websiteId}`)
    return response.data.data!
  }

  // AI Tracking endpoints
  async getAIMentions(websiteId: string, platform?: string): Promise<any[]> {
    const url = platform ? `/tracking/mentions/${websiteId}?platform=${platform}` : `/tracking/mentions/${websiteId}`
    const response = await this.client.get<ApiResponse<any[]>>(url)
    return response.data.data!
  }

  async getVisibilityTrends(websiteId: string): Promise<any> {
    const response = await this.client.get<ApiResponse>(`/tracking/trends/${websiteId}`)
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