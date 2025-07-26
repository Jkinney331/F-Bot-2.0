import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { jwtDecode } from 'jwt-decode'
import { toast } from 'react-hot-toast'
import { AuthState, User, LoginCredentials, AuthResponse } from '../types'
import { apiService } from '../services/api'
import { isDemo } from '../config/environment'

interface AuthStore extends AuthState {
  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>
  logout: () => void
  refreshAuth: () => Promise<boolean>
  updateUser: (user: Partial<User>) => void
  checkTokenExpiry: () => boolean
  initialize: () => Promise<void>
}

const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
        login: async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      set({ isLoading: true })

      // Check if demo mode is enabled
      const isDemoEnabled = isDemo()
      
      // Allow specific demo credentials or any credentials in demo mode
      const isValidDemoCredentials = isDemoEnabled && (
        (credentials.username === 'test@hashagency.com' && credentials.password === 'password') ||
        (credentials.username === 'admin@hashagency.com' && credentials.password === 'password') ||
        (credentials.password === 'password') // Allow any username with 'password' in demo mode
      )
      
      if (isDemoEnabled && isValidDemoCredentials) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Create mock user based on credentials
        let firstName = 'Demo'
        let lastName = 'User'
        let role: 'admin' | 'user' = 'user'
        
        if (credentials.username === 'test@hashagency.com') {
          firstName = 'Test'
          lastName = 'User'
          role = 'user'
        } else if (credentials.username === 'admin@hashagency.com') {
          firstName = 'Admin'
          lastName = 'User'
          role = 'admin'
        } else if (credentials.username.includes('@')) {
          firstName = credentials.username.split('@')[0] || 'Demo'
          lastName = 'User'
          // Determine role from username for other emails
          if (credentials.username.toLowerCase().includes('admin')) {
            role = 'admin'
          }
        } else {
          firstName = credentials.username || 'Demo'
          lastName = 'User'
          // Determine role from username for non-email usernames
          if (credentials.username.toLowerCase().includes('admin')) {
            role = 'admin'
          }
        }

        const mockUser: User = {
          id: 'demo-user-123',
          email: credentials.username.includes('@') ? credentials.username : `${credentials.username}@example.com`,
          firstName: firstName,
          lastName: lastName,
          role: role,
          permissions: ['chat', 'ultrasound', 'medical_rag'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        const mockToken = `mock-jwt-token-${Date.now()}`
        const mockRefreshToken = `mock-refresh-token-${Date.now()}`

        // Store tokens
        localStorage.setItem('fbot_token', mockToken)
        localStorage.setItem('fbot_refresh_token', mockRefreshToken)

        set({
          user: mockUser,
          token: mockToken,
          refreshToken: mockRefreshToken,
          isAuthenticated: true,
          isLoading: false,
        })

        toast.success(`🚀 Demo Mode: Welcome ${mockUser.firstName} ${mockUser.lastName}! (${mockUser.role})`)
        return true
      }

      // Production mode - use actual API
      const authResponse: AuthResponse = await apiService.login(credentials)

      // Store tokens
      localStorage.setItem('fbot_token', authResponse.token)
      localStorage.setItem('fbot_refresh_token', authResponse.refreshToken)

      set({
        user: authResponse.user,
        token: authResponse.token,
        refreshToken: authResponse.refreshToken,
        isAuthenticated: true,
        isLoading: false,
      })

      toast.success(`Welcome back, ${authResponse.user.firstName || authResponse.user.email}!`)
      return true
    } catch (error: any) {
      console.error('Login failed:', error)
      set({ isLoading: false })

      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.'
      toast.error(errorMessage)
      return false
    }
  },

      logout: () => {
        // Clear local storage
        localStorage.removeItem('fbot_token')
        localStorage.removeItem('fbot_refresh_token')
        localStorage.removeItem('fbot_user')
        
        // Clear state
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        })

        // Notify API (skip in demo mode)
        if (!isDemo()) {
          apiService.logout_api().catch(console.error)
        }
        
        toast.success('Successfully logged out')
      },

      refreshAuth: async (): Promise<boolean> => {
        try {
          const refreshToken = get().refreshToken
          if (!refreshToken) {
            throw new Error('No refresh token available')
          }

          const authResponse: AuthResponse = await apiService.refreshToken(refreshToken)
          
          localStorage.setItem('fbot_token', authResponse.token)
          localStorage.setItem('fbot_refresh_token', authResponse.refreshToken)
          
          set({
            user: authResponse.user,
            token: authResponse.token,
            refreshToken: authResponse.refreshToken,
            isAuthenticated: true,
          })

          return true
        } catch (error) {
          console.error('Token refresh failed:', error)
          get().logout()
          return false
        }
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user
        if (currentUser) {
          const updatedUser = { ...currentUser, ...userData }
          set({ user: updatedUser })
          localStorage.setItem('fbot_user', JSON.stringify(updatedUser))
        }
      },

      checkTokenExpiry: (): boolean => {
        // Skip token expiry check in demo mode
        if (isDemo()) {
          return false
        }

        const token = get().token
        if (!token) return false

        try {
          const decoded: any = jwtDecode(token)
          const currentTime = Date.now() / 1000
          
          // Check if token expires in the next 5 minutes
          if (decoded.exp - currentTime < 300) {
            return true // Token is expiring soon
          }
          
          return false
        } catch (error) {
          console.error('Error decoding token:', error)
          return true // Assume expired if can't decode
        }
      },

      initialize: async () => {
        try {
          set({ isLoading: true })

          // Check for stored tokens
          const token = localStorage.getItem('fbot_token')
          const refreshToken = localStorage.getItem('fbot_refresh_token')
          const storedUser = localStorage.getItem('fbot_user')

          if (!token || !refreshToken) {
            set({ isLoading: false })
            return
          }

          // Check if token is expired (skip in demo mode)
          const isDemoModeForExpiry = isDemo()
          if (!isDemoModeForExpiry && get().checkTokenExpiry()) {
            // Try to refresh
            const refreshSuccess = await get().refreshAuth()
            if (!refreshSuccess) {
              set({ isLoading: false })
              return
            }
          } else {
            // Token is still valid, restore session
            let user: User | null = null
            
            if (storedUser) {
              try {
                user = JSON.parse(storedUser)
              } catch (error) {
                console.error('Error parsing stored user:', error)
              }
            }

            // Fetch current user info to ensure it's up to date (skip in demo mode)
            const isDemoMode = isDemo()
            if (!isDemoMode) {
              try {
                user = await apiService.getCurrentUser()
                localStorage.setItem('fbot_user', JSON.stringify(user))
              } catch (error) {
                console.error('Failed to fetch current user:', error)
              }
            }

            if (user) {
              set({
                user,
                token,
                refreshToken,
                isAuthenticated: true,
              })
            }
          }
        } catch (error) {
          console.error('Auth initialization failed:', error)
          get().logout()
        } finally {
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'fbot-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// Set up token refresh interval
let refreshInterval: NodeJS.Timeout | null = null

const startTokenRefreshInterval = () => {
  if (refreshInterval) clearInterval(refreshInterval as NodeJS.Timeout)
  
  refreshInterval = setInterval(() => {
    const store = useAuthStore.getState()
    if (store.isAuthenticated && store.checkTokenExpiry()) {
      store.refreshAuth()
    }
  }, 60000) // Check every minute
}

const stopTokenRefreshInterval = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval as NodeJS.Timeout)
    refreshInterval = null
  }
}

// Start interval when authenticated
useAuthStore.subscribe((state) => {
  if (state.isAuthenticated) {
    startTokenRefreshInterval()
  } else {
    stopTokenRefreshInterval()
  }
})

export default useAuthStore 