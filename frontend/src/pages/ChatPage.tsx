import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import ChatSidebar from '../components/chat/ChatSidebar'
import ChatInterface from '../components/chat/ChatInterface'
import MedicalHeader from '../components/ui/MedicalHeader'
import useChatStore from '../stores/chatStore'
import useAuthStore from '../stores/authStore'

const ChatPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { loadSessions, currentSession, sessions } = useChatStore()
  const { user } = useAuthStore()

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="relative"
      >
        <ChatSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          sessions={sessions}
          currentSession={currentSession}
        />
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <MedicalHeader 
          user={user}
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />

        {/* Chat Interface */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface />
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

export default ChatPage 