import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { apiService } from '../../services/api'

interface User {
  id: string
  email: string
  fullName?: string
  company?: string
  role: string
}

interface Organization {
  id: string
  name: string
  slug: string
  plan: string
  credits: number
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  organizations: Organization[]
  currentOrganization: Organization | null
  token: string | null
  refreshToken: string | null
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  isAuthenticated: !!localStorage.getItem('accessToken'),
  user: null,
  organizations: [],
  currentOrganization: null,
  token: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  loading: false,
  error: null,
}

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: { email: string; password: string }) => {
    const response = await apiService.login(credentials)
    return response
  }
)

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData: { 
    email: string
    password: string
    fullName: string
    company?: string
  }) => {
    const response = await apiService.register(userData)
    return response
  }
)

export const refreshUserToken = createAsyncThunk(
  'auth/refreshToken',
  async (refreshToken: string) => {
    // This is handled automatically by the API service interceptor
    // Return current token for now
    return { token: localStorage.getItem('accessToken'), refreshToken }
  }
)

export const getUserProfile = createAsyncThunk(
  'auth/getUserProfile',
  async () => {
    const user = await apiService.getProfile()
    return { user, organizations: [] } // Organizations will be loaded separately if needed
  }
)

export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData: { fullName?: string; company?: string }) => {
    const user = await apiService.updateProfile(profileData)
    return user
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.isAuthenticated = false
      state.user = null
      state.organizations = []
      state.currentOrganization = null
      state.token = null
      state.refreshToken = null
      state.error = null
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('currentOrgId')
    },
    clearError: (state) => {
      state.error = null
    },
    setCurrentOrganization: (state, action: PayloadAction<Organization>) => {
      state.currentOrganization = action.payload
      localStorage.setItem('currentOrgId', action.payload.id)
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.organizations = action.payload.organizations || []
        state.token = action.payload.token || action.payload.accessToken
        state.refreshToken = action.payload.refreshToken || null
        
        // Set current organization (first one by default)  
        if (action.payload.organization) {
          state.currentOrganization = action.payload.organization
          state.organizations = [action.payload.organization]
          localStorage.setItem('currentOrgId', action.payload.organization.id)
        }

        localStorage.setItem('accessToken', action.payload.token || action.payload.accessToken)
        if (action.payload.refreshToken) {
          localStorage.setItem('refreshToken', action.payload.refreshToken)
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Login failed'
        state.isAuthenticated = false
      })
      
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.organizations = action.payload.organization ? [action.payload.organization] : []
        state.token = action.payload.accessToken
        state.refreshToken = action.payload.refreshToken || null
        
        if (action.payload.organization) {
          state.currentOrganization = action.payload.organization
          localStorage.setItem('currentOrgId', action.payload.organization.id)
        }

        localStorage.setItem('accessToken', action.payload.token || action.payload.accessToken)
        if (action.payload.refreshToken) {
          localStorage.setItem('refreshToken', action.payload.refreshToken)
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Registration failed'
        state.isAuthenticated = false
      })
      
      // Refresh token
      .addCase(refreshUserToken.fulfilled, (state, action) => {
        state.token = action.payload.token
        state.refreshToken = action.payload.refreshToken || null
        localStorage.setItem('accessToken', action.payload.token!)
        if (action.payload.refreshToken) {
          localStorage.setItem('refreshToken', action.payload.refreshToken)
        }
      })
      .addCase(refreshUserToken.rejected, (state) => {
        state.isAuthenticated = false
        state.user = null
        state.token = null
        state.refreshToken = null
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
      })
      
      // Get profile
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.organizations = action.payload.organizations || []
      })
      
      // Update profile
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.user = action.payload
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update profile'
      })
  },
})

export const { logout, clearError, setCurrentOrganization } = authSlice.actions
export default authSlice.reducer