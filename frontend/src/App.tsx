import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import useAuthStore from './stores/authStore'
import LoginPage from './pages/LoginPage'
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
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? (
                <Navigate to="/chat" replace />
              ) : (
                <LoginPage />
              )
            } 
          />
          
          {/* Protected Routes */}
          <Route 
            path="/chat" 
            element={
              isAuthenticated ? (
                <ChatPage />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          
          {/* Admin Routes */}
          <Route 
            path="/admin" 
            element={
              isAuthenticated ? (
                <AdminDashboard />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          
          {/* Root redirect */}
          <Route 
            path="/" 
            element={
              <Navigate 
                to={isAuthenticated ? "/chat" : "/login"} 
                replace 
              />
            } 
          />
          
          {/* Catch-all redirect */}
          <Route 
            path="*" 
            element={
              <Navigate 
                to={isAuthenticated ? "/chat" : "/login"} 
                replace 
              />
            } 
          />
        </Routes>
      </AnimatePresence>
    </div>
  )
}

export default App 