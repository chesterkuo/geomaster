import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface NotificationState {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

interface UIState {
  sidebarOpen: boolean
  notifications: NotificationState[]
  loading: {
    global: boolean
    [key: string]: boolean
  }
  modals: {
    [key: string]: boolean
  }
}

const initialState: UIState = {
  sidebarOpen: false,
  notifications: [],
  loading: {
    global: false
  },
  modals: {}
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload
    },
    
    // Notifications
    addNotification: (state, action: PayloadAction<Omit<NotificationState, 'id'>>) => {
      const id = Date.now().toString()
      state.notifications.push({
        id,
        ...action.payload,
        duration: action.payload.duration || 5000
      })
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload)
    },
    clearNotifications: (state) => {
      state.notifications = []
    },
    
    // Loading states
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.global = action.payload
    },
    setLoading: (state, action: PayloadAction<{ key: string; loading: boolean }>) => {
      state.loading[action.payload.key] = action.payload.loading
    },
    clearLoading: (state, action: PayloadAction<string>) => {
      delete state.loading[action.payload]
    },
    
    // Modals
    openModal: (state, action: PayloadAction<string>) => {
      state.modals[action.payload] = true
    },
    closeModal: (state, action: PayloadAction<string>) => {
      state.modals[action.payload] = false
    },
    toggleModal: (state, action: PayloadAction<string>) => {
      state.modals[action.payload] = !state.modals[action.payload]
    }
  }
})

export const {
  toggleSidebar,
  setSidebarOpen,
  addNotification,
  removeNotification,
  clearNotifications,
  setGlobalLoading,
  setLoading,
  clearLoading,
  openModal,
  closeModal,
  toggleModal
} = uiSlice.actions

export default uiSlice.reducer