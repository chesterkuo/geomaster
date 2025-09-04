import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { apiService, Website } from '../../services/api'

// Async thunks
export const fetchWebsites = createAsyncThunk(
  'websites/fetchWebsites',
  async () => {
    return await apiService.getWebsites()
  }
)

export const fetchWebsite = createAsyncThunk(
  'websites/fetchWebsite',
  async (id: string) => {
    return await apiService.getWebsite(id)
  }
)

export const createWebsite = createAsyncThunk(
  'websites/createWebsite',
  async (websiteData: Partial<Website>) => {
    return await apiService.createWebsite(websiteData)
  }
)

export const updateWebsite = createAsyncThunk(
  'websites/updateWebsite',
  async ({ id, data }: { id: string; data: Partial<Website> }) => {
    return await apiService.updateWebsite(id, data)
  }
)

export const deleteWebsite = createAsyncThunk(
  'websites/deleteWebsite',
  async (id: string) => {
    await apiService.deleteWebsite(id)
    return id
  }
)

interface WebsiteState {
  websites: Website[]
  currentWebsite: Website | null
  loading: boolean
  error: string | null
}

const initialState: WebsiteState = {
  websites: [],
  currentWebsite: null,
  loading: false,
  error: null
}

const websiteSlice = createSlice({
  name: 'websites',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setCurrentWebsite: (state, action: PayloadAction<Website | null>) => {
      state.currentWebsite = action.payload
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch websites
      .addCase(fetchWebsites.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchWebsites.fulfilled, (state, action) => {
        state.loading = false
        // Handle both old and new response formats
        state.websites = action.payload.websites || action.payload
      })
      .addCase(fetchWebsites.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch websites'
      })
      
      // Fetch single website
      .addCase(fetchWebsite.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchWebsite.fulfilled, (state, action) => {
        state.loading = false
        // Handle new response format with website and metrics
        const website = action.payload.website || action.payload
        state.currentWebsite = website
        
        // Update in websites array if it exists
        const index = state.websites.findIndex(w => w.id === website.id)
        if (index !== -1) {
          state.websites[index] = website
        }
      })
      .addCase(fetchWebsite.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch website'
      })
      
      // Create website
      .addCase(createWebsite.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createWebsite.fulfilled, (state, action) => {
        state.loading = false
        state.websites.push(action.payload)
      })
      .addCase(createWebsite.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to create website'
      })
      
      // Update website
      .addCase(updateWebsite.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateWebsite.fulfilled, (state, action) => {
        state.loading = false
        const index = state.websites.findIndex(w => w.id === action.payload.id)
        if (index !== -1) {
          state.websites[index] = action.payload
        }
        if (state.currentWebsite?.id === action.payload.id) {
          state.currentWebsite = action.payload
        }
      })
      .addCase(updateWebsite.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to update website'
      })
      
      // Delete website
      .addCase(deleteWebsite.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteWebsite.fulfilled, (state, action) => {
        state.loading = false
        state.websites = state.websites.filter(w => w.id !== action.payload)
        if (state.currentWebsite?.id === action.payload) {
          state.currentWebsite = null
        }
      })
      .addCase(deleteWebsite.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to delete website'
      })
  }
})

export const { clearError, setCurrentWebsite } = websiteSlice.actions
export default websiteSlice.reducer