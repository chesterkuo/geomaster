import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { apiService, Scan } from '../../services/api'

// Async thunks
export const startScan = createAsyncThunk(
  'scans/startScan',
  async (websiteId: string) => {
    return await apiService.startScan(websiteId)
  }
)

export const fetchScan = createAsyncThunk(
  'scans/fetchScan',
  async (id: string) => {
    return await apiService.getScan(id)
  }
)

export const fetchScans = createAsyncThunk(
  'scans/fetchScans',
  async (websiteId?: string) => {
    return await apiService.getScans(websiteId)
  }
)

interface ScanState {
  scans: Scan[]
  currentScan: Scan | null
  loading: boolean
  error: string | null
}

const initialState: ScanState = {
  scans: [],
  currentScan: null,
  loading: false,
  error: null
}

const scanSlice = createSlice({
  name: 'scans',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setCurrentScan: (state, action: PayloadAction<Scan | null>) => {
      state.currentScan = action.payload
    },
    updateScanProgress: (state, action: PayloadAction<{ id: string; progress: number; status?: string }>) => {
      const { id, progress, status } = action.payload
      
      // Update in scans array
      const scanIndex = state.scans.findIndex(s => s.id === id)
      if (scanIndex !== -1) {
        state.scans[scanIndex].progress = progress
        if (status) {
          state.scans[scanIndex].status = status
        }
      }
      
      // Update current scan
      if (state.currentScan?.id === id) {
        state.currentScan.progress = progress
        if (status) {
          state.currentScan.status = status
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Start scan
      .addCase(startScan.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(startScan.fulfilled, (state, action) => {
        state.loading = false
        state.scans.unshift(action.payload) // Add to beginning
        state.currentScan = action.payload
      })
      .addCase(startScan.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to start scan'
      })
      
      // Fetch single scan
      .addCase(fetchScan.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchScan.fulfilled, (state, action) => {
        state.loading = false
        state.currentScan = action.payload
        
        // Update in scans array if it exists
        const index = state.scans.findIndex(s => s.id === action.payload.id)
        if (index !== -1) {
          state.scans[index] = action.payload
        } else {
          state.scans.unshift(action.payload)
        }
      })
      .addCase(fetchScan.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch scan'
      })
      
      // Fetch scans
      .addCase(fetchScans.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchScans.fulfilled, (state, action) => {
        state.loading = false
        state.scans = action.payload
      })
      .addCase(fetchScans.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch scans'
      })
  }
})

export const { clearError, setCurrentScan, updateScanProgress } = scanSlice.actions
export default scanSlice.reducer