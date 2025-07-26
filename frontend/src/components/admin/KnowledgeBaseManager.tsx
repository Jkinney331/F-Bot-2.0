import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import {
  DocumentTextIcon,
  GlobeAltIcon,
  CloudArrowUpIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  LinkIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

interface KnowledgeItem {
  id: string
  type: 'pdf' | 'website' | 'manual'
  title: string
  source: string
  status: 'processing' | 'completed' | 'failed'
  dateAdded: string
  size?: string
  pages?: number
  lastScraped?: string
  description?: string
}

const KnowledgeBaseManager: React.FC = () => {
  const [items, setItems] = useState<KnowledgeItem[]>([
    {
      id: '1',
      type: 'pdf',
      title: 'Fascial Anatomy and Treatment Manual',
      source: 'manual-upload.pdf',
      status: 'completed',
      dateAdded: '2024-01-15',
      size: '2.4 MB',
      pages: 45,
      description: 'Comprehensive guide to fascial anatomy and treatment protocols',
    },
    {
      id: '2',
      type: 'website',
      title: 'PubMed Research Database',
      source: 'https://pubmed.ncbi.nlm.nih.gov',
      status: 'completed',
      dateAdded: '2024-01-10',
      lastScraped: '2024-01-16',
      description: 'Medical research papers and clinical studies',
    },
    {
      id: '3',
      type: 'website',
      title: 'Fascial Research Society',
      source: 'https://fascialresearch.com',
      status: 'processing',
      dateAdded: '2024-01-16',
      description: 'Latest research and clinical findings on fascial health',
    },
  ])

  const [showAddModal, setShowAddModal] = useState(false)
  const [addType, setAddType] = useState<'pdf' | 'website'>('pdf')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [websiteDescription, setWebsiteDescription] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc', '.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 10,
    maxSize: 50 * 1024 * 1024, // 50MB
    onDrop: (acceptedFiles) => {
      acceptedFiles.forEach((file) => {
        const newItem: KnowledgeItem = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          type: 'pdf',
          title: file.name.replace(/\.[^/.]+$/, ''),
          source: file.name,
          status: 'processing',
          dateAdded: new Date().toISOString().split('T')[0],
          size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
          description: 'Processing document...',
        }

        setItems((prev) => [newItem, ...prev])
        
        // Simulate processing
        setTimeout(() => {
          setItems((prev) =>
            prev.map((item) =>
              item.id === newItem.id
                ? { ...item, status: 'completed' as const, description: 'Document processed successfully' }
                : item
            )
          )
          toast.success(`"${file.name}" processed successfully`)
        }, 3000)
      })

      toast.success(`${acceptedFiles.length} file(s) uploaded for processing`)
    },
    onDropRejected: (rejectedFiles) => {
      rejectedFiles.forEach((rejection) => {
        toast.error(`Failed to upload "${rejection.file.name}": ${rejection.errors[0].message}`)
      })
    },
  })

  const handleAddWebsite = () => {
    if (!websiteUrl.trim()) {
      toast.error('Please enter a valid URL')
      return
    }

    const newItem: KnowledgeItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type: 'website',
      title: websiteUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, ''),
      source: websiteUrl,
      status: 'processing',
      dateAdded: new Date().toISOString().split('T')[0],
      description: websiteDescription || 'Scraping website content...',
    }

    setItems((prev) => [newItem, ...prev])
    setShowAddModal(false)
    setWebsiteUrl('')
    setWebsiteDescription('')

    // Simulate scraping
    setTimeout(() => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === newItem.id
            ? { 
                ...item, 
                status: 'completed' as const, 
                lastScraped: new Date().toISOString().split('T')[0],
                description: 'Website content scraped successfully'
              }
            : item
        )
      )
      toast.success(`Website "${websiteUrl}" scraped successfully`)
    }, 5000)

    toast.success('Website added to scraping queue')
  }

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
    toast.success('Item removed from knowledge base')
  }

  const getStatusIcon = (status: KnowledgeItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      case 'processing':
        return <ClockIcon className="h-4 w-4 text-yellow-500 animate-spin" />
      case 'failed':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
    }
  }

  const getTypeIcon = (type: KnowledgeItem['type']) => {
    switch (type) {
      case 'pdf':
        return <DocumentTextIcon className="h-5 w-5 text-red-500" />
      case 'website':
        return <GlobeAltIcon className="h-5 w-5 text-blue-500" />
      case 'manual':
        return <DocumentTextIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search knowledge base..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-medical-500 focus:ring-medical-500"
            />
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-medical-600 text-white px-4 py-2 rounded-lg hover:bg-medical-700 transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Add Content</span>
        </button>
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragActive
            ? 'border-medical-500 bg-medical-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-700 mb-2">
          {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p className="text-sm text-gray-500 mb-4">
          or click to browse
        </p>
        <p className="text-xs text-gray-400">
          Supports PDF, DOC, DOCX, TXT files up to 50MB
        </p>
      </div>

      {/* Knowledge Base Items */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Knowledge Base ({filteredItems.length} items)
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredItems.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchQuery ? 'No items match your search' : 'No content in knowledge base yet'}
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-6 py-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex-shrink-0">
                      {getTypeIcon(item.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {item.title}
                        </h4>
                        {getStatusIcon(item.status)}
                      </div>

                      <div className="mt-1 text-xs text-gray-500 space-y-1">
                        <div className="flex items-center space-x-4">
                          <span>Added: {item.dateAdded}</span>
                          {item.size && <span>Size: {item.size}</span>}
                          {item.pages && <span>Pages: {item.pages}</span>}
                          {item.lastScraped && <span>Last scraped: {item.lastScraped}</span>}
                        </div>
                        <div className="flex items-center space-x-1">
                          <LinkIcon className="h-3 w-3" />
                          <span className="truncate">{item.source}</span>
                        </div>
                        {item.description && (
                          <p className="text-gray-600">{item.description}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      className="p-2 text-gray-400 hover:text-gray-600 rounded"
                      title="View details"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded"
                      title="Delete item"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Add Content Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-gray-600 bg-opacity-75"
                onClick={() => setShowAddModal(false)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto"
              >
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    Add Content to Knowledge Base
                  </h3>
                </div>

                <div className="px-6 py-4 space-y-4">
                  {/* Content Type Selection */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Content Type
                    </label>
                    <div className="flex space-x-4">
                      <button
                        onClick={() => setAddType('pdf')}
                        className={`flex-1 p-3 border rounded-lg text-sm font-medium ${
                          addType === 'pdf'
                            ? 'border-medical-500 bg-medical-50 text-medical-700'
                            : 'border-gray-300 text-gray-700'
                        }`}
                      >
                        <DocumentTextIcon className="h-5 w-5 mx-auto mb-1" />
                        Upload Files
                      </button>
                      <button
                        onClick={() => setAddType('website')}
                        className={`flex-1 p-3 border rounded-lg text-sm font-medium ${
                          addType === 'website'
                            ? 'border-medical-500 bg-medical-50 text-medical-700'
                            : 'border-gray-300 text-gray-700'
                        }`}
                      >
                        <GlobeAltIcon className="h-5 w-5 mx-auto mb-1" />
                        Scrape Website
                      </button>
                    </div>
                  </div>

                  {addType === 'website' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Website URL
                        </label>
                        <input
                          type="url"
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                          placeholder="https://example.com"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-medical-500 focus:ring-medical-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description (optional)
                        </label>
                        <textarea
                          value={websiteDescription}
                          onChange={(e) => setWebsiteDescription(e.target.value)}
                          placeholder="Brief description of the content..."
                          rows={3}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-medical-500 focus:ring-medical-500"
                        />
                      </div>
                    </div>
                  )}

                  {addType === 'pdf' && (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-600">
                        Close this dialog and use the drag & drop area above to upload files.
                      </p>
                    </div>
                  )}
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  {addType === 'website' && (
                    <button
                      onClick={handleAddWebsite}
                      className="px-4 py-2 bg-medical-600 text-white rounded-lg text-sm font-medium hover:bg-medical-700"
                    >
                      Add Website
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default KnowledgeBaseManager 