import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Bars3Icon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  ShieldCheckIcon,
  CommandLineIcon,
} from '@heroicons/react/24/outline'
import { User } from '../../types'
import useAuthStore from '../../stores/authStore'

interface MedicalHeaderProps {
  user: User | null
  onSidebarToggle: () => void
  sidebarOpen: boolean
}

const MedicalHeader: React.FC<MedicalHeaderProps> = ({
  user,
  onSidebarToggle,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { logout, toggleRole } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const getRoleDisplayName = (role: string) => {
    const roleMap = {
      admin: 'Administrator',
      user: 'User',
    }
    return roleMap[role as keyof typeof roleMap] || role
  }

  const getRoleBadgeColor = (role: string) => {
    const colorMap = {
      admin: 'bg-red-100 text-red-800',
      physician: 'bg-blue-100 text-blue-800',
      researcher: 'bg-green-100 text-green-800',
      patient: 'bg-gray-100 text-gray-800',
    }
    return colorMap[role as keyof typeof colorMap] || 'bg-gray-100 text-gray-800'
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side */}
          <div className="flex items-center">
            <button
              onClick={onSidebarToggle}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-medical-500 transition-colors"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            
            <div className="hidden lg:flex lg:items-center lg:space-x-4 ml-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-3"
              >
                <div className="h-8 w-8 bg-medical-500 rounded-lg flex items-center justify-center">
                  <ShieldCheckIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">F-Bot 2.0</h1>
                  <p className="text-xs text-gray-500">Medical AI Assistant</p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Role Toggle Button */}
            <button
              onClick={toggleRole}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                user?.role === 'admin'
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
              title={`Switch to ${user?.role === 'admin' ? 'User' : 'Admin'} mode`}
            >
              <CommandLineIcon className="h-4 w-4" />
              <span className="hidden sm:inline">
                {user?.role === 'admin' ? 'User Mode' : 'Admin Mode'}
              </span>
            </button>

            {/* Admin Button - Only show for admin users */}
            {user?.role === 'admin' && (
              <button
                onClick={() => navigate(location.pathname === '/admin' ? '/chat' : '/admin')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === '/admin'
                    ? 'bg-medical-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <CommandLineIcon className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {location.pathname === '/admin' ? 'Chat' : 'Admin'}
                </span>
              </button>
            )}

            {/* Notifications */}
            <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md transition-colors">
              <BellIcon className="h-6 w-6" />
            </button>

            {/* User dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {user?.firstName || user?.lastName ? (
                    <div className="h-8 w-8 bg-medical-500 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {(user.firstName?.[0] || '') + (user.lastName?.[0] || '')}
                      </span>
                    </div>
                  ) : (
                    <UserCircleIcon className="h-8 w-8 text-gray-400" />
                  )}
                  
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.firstName && user?.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user?.email || 'User'}
                    </p>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          user?.role ? getRoleBadgeColor(user.role) : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {user?.role ? getRoleDisplayName(user.role) : 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              </button>

              {/* Dropdown menu */}
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50"
                >
                  <div className="py-1">
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.firstName && user?.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user?.email || 'User'}
                      </p>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                      <div className="mt-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            user?.role ? getRoleBadgeColor(user.role) : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {user?.role ? getRoleDisplayName(user.role) : 'Unknown'}
                        </span>
                      </div>
                    </div>

                    {/* Menu items */}
                    <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                      <Cog6ToothIcon className="h-4 w-4 mr-3" />
                      Settings
                    </button>
                    
                    <button
                      onClick={() => {
                        logout()
                        setDropdownOpen(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                      Sign out
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {dropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setDropdownOpen(false)}
        />
      )}
    </header>
  )
}

export default MedicalHeader 