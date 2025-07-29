import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDownIcon,
  ChevronUpIcon,
  LinkIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  BeakerIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline'
import { Source } from '../../types'

interface MessageSourcesProps {
  sources: Source[]
}

const MessageSources: React.FC<MessageSourcesProps> = ({ sources }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const getSourceIcon = (type: Source['type']) => {
    switch (type) {
      case 'pubmed':
        return <AcademicCapIcon className="h-4 w-4" />
      case 'textbook':
        return <DocumentTextIcon className="h-4 w-4" />
      case 'research':
        return <BeakerIcon className="h-4 w-4" />
      case 'guideline':
        return <DocumentTextIcon className="h-4 w-4" />
      case 'clinical':
        return <BeakerIcon className="h-4 w-4" />
      default:
        return <LinkIcon className="h-4 w-4" />
    }
  }

  const getEvidenceLevelColor = (level?: string) => {
    if (!level) return 'bg-gray-100 text-gray-600'

    switch (level) {
      case '1A':
      case '1B':
        return 'bg-green-100 text-green-800'
      case '2A':
      case '2B':
        return 'bg-blue-100 text-blue-800'
      case '3A':
      case '3B':
        return 'bg-yellow-100 text-yellow-800'
      case '4':
      case '5':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const getEvidenceLevelDescription = (level?: string) => {
    if (!level) return 'Unknown evidence level'

    const descriptions: Record<string, string> = {
      '1A': 'Systematic review of RCTs',
      '1B': 'Individual RCT',
      '2A': 'Systematic review of cohort studies',
      '2B': 'Individual cohort study',
      '3A': 'Systematic review of case-control studies',
      '3B': 'Individual case-control study',
      '4': 'Case series/reports',
      '5': 'Expert opinion',
    }

    return descriptions[level] || level
  }

  const formatDOI = (doi?: string) => {
    if (!doi) return null
    const cleanDOI = doi.replace(/^doi:/, '').replace(/^https?:\/\/doi\.org\//, '')
    return `https://doi.org/${cleanDOI}`
  }

  if (!sources || sources.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center space-x-2 text-xs text-gray-600 hover:text-gray-800 transition-colors"
      >
        <span className="font-medium">
          {sources.length} source{sources.length !== 1 ? 's' : ''}
        </span>
        {isExpanded ? (
          <ChevronUpIcon className="h-3 w-3" />
        ) : (
          <ChevronDownIcon className="h-3 w-3" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {sources.map((source, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-3 bg-gray-50 rounded border border-gray-200"
              >
                <div className="flex items-start space-x-3">
                  <div className="text-gray-500 mt-0.5 flex-shrink-0">
                    {getSourceIcon(source.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-xs font-medium text-gray-900 line-clamp-2 mb-1">
                          {source.title}
                        </h4>

                        {/* Authors */}
                        {source.authors && source.authors.length > 0 && (
                          <p className="text-xs text-gray-600 mb-1">
                            {source.authors.slice(0, 3).join(', ')}
                            {source.authors.length > 3 && ` et al.`}
                          </p>
                        )}

                        {/* Journal and Year */}
                        <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
                          {source.journal && (
                            <span className="italic">{source.journal}</span>
                          )}
                          {source.year && (
                            <span>({source.year})</span>
                          )}
                        </div>

                        {/* Evidence Level */}
                        {source.evidenceLevel && (
                          <div className="flex items-center space-x-2 mb-2">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getEvidenceLevelColor(
                                source.evidenceLevel
                              )}`}
                              title={getEvidenceLevelDescription(source.evidenceLevel)}
                            >
                              Level {source.evidenceLevel}
                            </span>
                          </div>
                        )}

                        {/* Links */}
                        <div className="flex items-center space-x-3 text-xs">
                          {source.url && (
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-medical-600 hover:text-medical-700 flex items-center space-x-1"
                            >
                              <span>View Source</span>
                                                            <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                            </a>
                          )}
                          
                          {source.doi && (
                            <a
                              href={formatDOI(source.doi) || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-medical-600 hover:text-medical-700 flex items-center space-x-1"
                            >
                              <span>DOI</span>
                              <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Source Type Badge */}
                      <div className="ml-2 flex-shrink-0">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-medical-100 text-medical-800 capitalize">
                          {source.type}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MessageSources 