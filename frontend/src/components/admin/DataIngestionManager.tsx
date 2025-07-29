import React, { useState } from 'react'
import { dataIngestionService, IngestionResult } from '../../services/dataIngestion'
import { createFasciaIndex } from '../../config/pinecone'

interface DataIngestionManagerProps {
  className?: string
}

export const DataIngestionManager: React.FC<DataIngestionManagerProps> = ({ className = '' }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<IngestionResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)

  const initializePinecone = async () => {
    setIsInitializing(true)
    setError(null)
    
    try {
      console.log('🔧 Initializing Pinecone index...')
      await createFasciaIndex()
      console.log('✅ Pinecone index initialized successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize Pinecone'
      setError(errorMessage)
      console.error('❌ Pinecone initialization failed:', err)
    } finally {
      setIsInitializing(false)
    }
  }

  const startIngestion = async () => {
    setIsLoading(true)
    setError(null)
    setResults([])
    
    try {
      console.log('🚀 Starting data ingestion...')
      const ingestionResults = await dataIngestionService.ingestFasciaResearch()
      setResults(ingestionResults)
      
      const totalCount = ingestionResults.reduce((sum, result) => sum + result.count, 0)
      console.log(`✅ Data ingestion completed. Total items: ${totalCount}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Data ingestion failed'
      setError(errorMessage)
      console.error('❌ Data ingestion failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-600' : 'text-red-600'
  }

  const getStatusIcon = (success: boolean) => {
    return success ? '✅' : '❌'
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Data Ingestion Manager</h2>
        <div className="flex space-x-3">
          <button
            onClick={initializePinecone}
            disabled={isInitializing}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isInitializing ? 'Initializing...' : 'Initialize Pinecone'}
          </button>
          <button
            onClick={startIngestion}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Ingesting...' : 'Start Ingestion'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* API Sources Info */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Data Sources</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-md">
            <h4 className="font-medium text-blue-900">PubMed</h4>
            <p className="text-sm text-blue-700">Medical research papers</p>
          </div>
          <div className="bg-green-50 p-4 rounded-md">
            <h4 className="font-medium text-green-900">Google Scholar</h4>
            <p className="text-sm text-green-700">Academic research</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-md">
            <h4 className="font-medium text-purple-900">ORCID</h4>
            <p className="text-sm text-purple-700">Researcher profiles</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-md">
            <h4 className="font-medium text-orange-900">OpenFDA</h4>
            <p className="text-sm text-orange-700">Medical device data</p>
          </div>
        </div>
      </div>

      {/* Results Display */}
      {results.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Ingestion Results</h3>
          <div className="space-y-3">
            {results.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getStatusIcon(result.success)}</span>
                  <div>
                    <h4 className="font-medium text-gray-900 capitalize">{result.source}</h4>
                    <p className="text-sm text-gray-600">
                      {result.success ? `${result.count} items processed` : 'Failed to process'}
                    </p>
                  </div>
                </div>
                <div className={`font-medium ${getStatusColor(result.success)}`}>
                  {result.success ? 'Success' : 'Failed'}
                </div>
              </div>
            ))}
          </div>
          
          {/* Summary */}
          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <h4 className="font-medium text-blue-900 mb-2">Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Total Sources:</span>
                <span className="ml-2 font-medium">{results.length}</span>
              </div>
              <div>
                <span className="text-blue-700">Total Items:</span>
                <span className="ml-2 font-medium">
                  {results.reduce((sum, result) => sum + result.count, 0)}
                </span>
              </div>
              <div>
                <span className="text-blue-700">Successful:</span>
                <span className="ml-2 font-medium">
                  {results.filter(r => r.success).length}
                </span>
              </div>
              <div>
                <span className="text-blue-700">Failed:</span>
                <span className="ml-2 font-medium">
                  {results.filter(r => !r.success).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-md">
        <h3 className="text-lg font-semibold text-yellow-900 mb-2">Instructions</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-800">
          <li>First, initialize the Pinecone index to ensure it's ready for data storage</li>
          <li>Click "Start Ingestion" to begin collecting data from all sources</li>
          <li>Monitor the results to ensure all sources are processed successfully</li>
          <li>Data will be stored in Pinecone for use by the AI assistant</li>
        </ol>
      </div>
    </div>
  )
}

export default DataIngestionManager 