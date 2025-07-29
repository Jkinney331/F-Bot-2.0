import React from 'react'
import { Cog6ToothIcon } from '@heroicons/react/24/outline'

const SystemSettings: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="text-center">
        <Cog6ToothIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">System Settings</h3>
        <p className="text-gray-500">
          Configure system parameters, API keys, and integration settings.
        </p>
        <div className="mt-6 text-sm text-gray-400">
          Settings panel coming soon...
        </div>
      </div>
    </div>
  )
}

export default SystemSettings 