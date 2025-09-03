// Simple auth types for now - can be expanded later
export interface User {
  id: string
  email: string
  fullName: string
  role: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  plan: string
  credits: number
}

export interface AuthResponse {
  data: {
    user: User
    token: string
    refreshToken?: string
    organization?: Organization
    organizations?: Organization[]
  }
}

// Placeholder auth functions
export const login = async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
  // This would be replaced with actual API call
  return Promise.resolve({
    data: {
      user: {
        id: '1',
        email: credentials.email,
        fullName: 'Test User',
        role: 'user'
      },
      token: 'mock-token',
      refreshToken: 'mock-refresh-token',
      organization: {
        id: '1',
        name: 'Test Organization',
        slug: 'test-org',
        plan: 'free',
        credits: 1000
      }
    }
  })
}

export const register = async (userData: any): Promise<AuthResponse> => {
  // This would be replaced with actual API call
  return Promise.resolve({
    data: {
      user: {
        id: '1',
        email: userData.email,
        fullName: userData.fullName,
        role: 'user'
      },
      token: 'mock-token',
      refreshToken: 'mock-refresh-token',
      organization: {
        id: '1',
        name: `${userData.fullName}'s Organization`,
        slug: 'user-org',
        plan: 'free',
        credits: 1000
      }
    }
  })
}

export const refreshToken = async (_refreshToken: string): Promise<AuthResponse> => {
  return Promise.resolve({
    data: {
      user: { id: '1', email: 'test@test.com', fullName: 'Test User', role: 'user' },
      token: 'new-mock-token',
      refreshToken: 'new-mock-refresh-token'
    }
  })
}

export const getProfile = async (): Promise<AuthResponse> => {
  return Promise.resolve({
    data: {
      user: { id: '1', email: 'test@test.com', fullName: 'Test User', role: 'user' },
      token: 'mock-token',
      organizations: [{
        id: '1',
        name: 'Test Organization',
        slug: 'test-org',
        plan: 'free',
        credits: 1000
      }]
    }
  })
}

// Export as authAPI for compatibility with Redux slice
export const authAPI = {
  login,
  register,
  refreshToken,
  getProfile
}