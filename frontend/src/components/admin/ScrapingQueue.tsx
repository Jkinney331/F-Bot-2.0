import React from 'react'
import { ClockIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

const ScrapingQueue: React.FC = () => {
  const queueItems = [
    { id: 1, url: 'https://pubmed.ncbi.nlm.nih.gov', status: 'processing', progress: 75 },
    { id: 2, url: 'https://fascialresearch.com', status: 'completed', progress: 100 },
    { id: 3, url: 'https://physiotherapy.ca', status: 'pending', progress: 0 },
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Scraping Queue</h3>
      <div className="space-y-4">
        {queueItems.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <div className="text-sm font-medium">{item.url}</div>
              <div className="text-xs text-gray-500">Status: {item.status}</div>
            </div>
            <div className="flex items-center space-x-2">
              {item.status === 'processing' && <ClockIcon className="h-4 w-4 text-yellow-500" />}
              {item.status === 'completed' && <CheckCircleIcon className="h-4 w-4 text-green-500" />}
              {item.status === 'pending' && <ExclamationTriangleIcon className="h-4 w-4 text-gray-400" />}
              <span className="text-sm">{item.progress}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ScrapingQueue 