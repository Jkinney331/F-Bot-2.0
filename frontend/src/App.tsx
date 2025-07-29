import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import useAuthStore from './stores/authStore'
import ChatPage from './pages/ChatPage'
import AdminDashboard from './pages/AdminDashboard'
import LoadingSpinner from './components/ui/LoadingSpinner'
import MedicalDisclaimer from './components/ui/MedicalDisclaimer'

function App() {
  const { isAuthenticated, isLoading, initialize } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Medical Disclaimer - always visible */}
      <MedicalDisclaimer />
      
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          {/* Chat Route - always accessible */}
          <Route 
            path="/chat" 
            element={<ChatPage />}
          />
          
          {/* Admin Routes - accessible when authenticated */}
          <Route 
            path="/admin" 
            element={
              isAuthenticated ? (
                <AdminDashboard />
              ) : (
                <Navigate to="/chat" replace />
              )
            } 
          />
          
          {/* Root redirect to chat */}
          <Route 
            path="/" 
            element={<Navigate to="/chat" replace />}
          />
          
          {/* Catch-all redirect to chat */}
          <Route 
            path="*" 
            element={<Navigate to="/chat" replace />}
          />
        </Routes>
      </AnimatePresence>
    </div>
  )
}

export default App 