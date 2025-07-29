import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChatBubbleLeftRightIcon,
  TrashIcon,
  PencilIcon,
} from '@heroicons/react/24/outline'
import { ChatSession } from '../../types'
import useChatStore from '../../stores/chatStore'
import { formatDistanceToNow } from 'date-fns'

interface ChatSidebarProps {
  isOpen: boolean
  onToggle: () => void
  sessions: ChatSession[]
  currentSession: ChatSession | null
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  isOpen,
  onToggle,
  sessions,
  currentSession,
}) => {
  const [editingSession, setEditingSession] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const { createSession, selectSession, deleteSession, updateSessionTitle } = useChatStore()

  const handleCreateSession = async () => {
    await createSession()
  }

  const handleSelectSession = async (sessionId: string) => {
    await selectSession(sessionId)
  }

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm('Are you sure you want to delete this session?')) {
      await deleteSession(sessionId)
    }
  }

  const handleEditSession = (sessionId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingSession(sessionId)
    setEditTitle(currentTitle)
  }

  const handleSaveTitle = async (sessionId: string) => {
    if (editTitle.trim()) {
      await updateSessionTitle(sessionId, editTitle.trim())
    }
    setEditingSession(null)
    setEditTitle('')
  }

  const handleCancelEdit = () => {
    setEditingSession(null)
    setEditTitle('')
  }

  return (
    <div className={`${isOpen ? 'w-80' : 'w-16'} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col h-full`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {isOpen && (
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-lg font-semibold text-gray-900"
            >
              Chat Sessions
            </motion.h2>
          )}
          <button
            onClick={onToggle}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            {isOpen ? (
              <ChevronLeftIcon className="h-5 w-5" />
            ) : (
              <ChevronRightIcon className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* New Session Button */}
        {isOpen && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleCreateSession}
            className="w-full mt-3 flex items-center justify-center px-4 py-2 bg-medical-600 text-white rounded-lg hover:bg-medical-700 transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            New Session
          </motion.button>
        )}
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {isOpen ? (
          <div className="p-2 space-y-1">
            <AnimatePresence>
              {sessions.map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
                    currentSession?.id === session.id
                      ? 'bg-medical-50 border border-medical-200'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleSelectSession(session.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {editingSession === session.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-medical-500"
                            autoFocus
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveTitle(session.id)
                              } else if (e.key === 'Escape') {
                                handleCancelEdit()
                              }
                            }}
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleSaveTitle(session.id)}
                              className="px-2 py-1 text-xs bg-medical-600 text-white rounded hover:bg-medical-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {session.title || 'New Session'}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {session.messages.length} messages
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })}
                          </p>
                        </>
                      )}
                    </div>

                    {/* Action buttons */}
                    {editingSession !== session.id && (
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleEditSession(session.id, session.title, e)}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        >
                          <PencilIcon className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteSession(session.id, e)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded"
                        >
                          <TrashIcon className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Active indicator */}
                  {currentSession?.id === session.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-medical-500 rounded-r" />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {sessions.length === 0 && (
              <div className="text-center py-8">
                <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No sessions yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Create your first session to get started
                </p>
              </div>
            )}
          </div>
        ) : (
          // Collapsed view
          <div className="p-2 space-y-2">
            <button
              onClick={handleCreateSession}
              className="w-full p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            >
              <PlusIcon className="h-5 w-5 mx-auto" />
            </button>
            {sessions.slice(0, 5).map((session) => (
              <button
                key={session.id}
                onClick={() => handleSelectSession(session.id)}
                className={`w-full p-2 rounded transition-colors ${
                  currentSession?.id === session.id
                    ? 'bg-medical-100 text-medical-600'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5 mx-auto" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {isOpen && (
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            <p>🩺 HIPAA Compliant</p>
            <p className="mt-1">All conversations are encrypted</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatSidebar 