import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  DocumentPlusIcon,
  GlobeAltIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  CircleStackIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import MedicalHeader from '../components/ui/MedicalHeader'
import useAuthStore from '../stores/authStore'
import KnowledgeBaseManager from '../components/admin/KnowledgeBaseManager'
import UserManagement from '../components/admin/UserManagement'
import ScrapingQueue from '../components/admin/ScrapingQueue'
import SystemSettings from '../components/admin/SystemSettings'

const AdminDashboard: React.FC = () => {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'knowledge' | 'users' | 'scraping' | 'settings'>('knowledge')

  const stats = [
    {
      name: 'Total Documents',
      value: '1,247',
      icon: DocumentPlusIcon,
      change: '+12%',
      changeType: 'increase' as const,
    },
    {
      name: 'Scraped Websites',
      value: '89',
      icon: GlobeAltIcon,
      change: '+5%',
      changeType: 'increase' as const,
    },
    {
      name: 'Knowledge Sources',
      value: '45',
      icon: CircleStackIcon,
      change: '+8%',
      changeType: 'increase' as const,
    },
    {
      name: 'Active Users',
      value: '234',
      icon: UserGroupIcon,
      change: '+2%',
      changeType: 'increase' as const,
    },
  ]

  const tabs = [
    {
      id: 'knowledge' as const,
      name: 'Knowledge Base',
      icon: CircleStackIcon,
      description: 'Manage PDFs, websites, and medical content',
    },
    {
      id: 'users' as const,
      name: 'User Management',
      icon: UserGroupIcon,
      description: 'Manage users and permissions',
    },
    {
      id: 'scraping' as const,
      name: 'Content Scraping',
      icon: GlobeAltIcon,
      description: 'Monitor and manage web scraping',
    },
    {
      id: 'settings' as const,
      name: 'System Settings',
      icon: Cog6ToothIcon,
      description: 'Configure system parameters',
    },
  ]

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MedicalHeader
        user={user}
        onSidebarToggle={() => {}}
        sidebarOpen={false}
      />

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Manage your F-Bot knowledge base, users, and system settings
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className="h-8 w-8 text-medical-600" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                    <p className={`ml-2 text-sm ${
                      stat.changeType === 'increase' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {stat.change}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="sm:hidden">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as any)}
              className="block w-full rounded-md border-gray-300 focus:border-medical-500 focus:ring-medical-500"
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.name}
                </option>
              ))}
            </select>
          </div>

          <div className="hidden sm:block">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-medical-500 text-medical-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'knowledge' && <KnowledgeBaseManager />}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'scraping' && <ScrapingQueue />}
          {activeTab === 'settings' && <SystemSettings />}
        </motion.div>
      </div>
    </div>
  )
}

export default AdminDashboard 