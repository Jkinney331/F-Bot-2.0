import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

const MedicalDisclaimer: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="relative z-50 bg-yellow-50 border-b border-yellow-200"
      >
        <div className="max-w-7xl mx-auto py-2 px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between flex-wrap">
            <div className="w-0 flex-1 flex items-center">
              <span className="flex p-1 rounded-lg bg-yellow-100">
                <ExclamationTriangleIcon
                  className="h-4 w-4 text-yellow-600"
                  aria-hidden="true"
                />
              </span>
              <p className="ml-3 font-medium text-yellow-800 text-sm">
                <span className="md:hidden">
                  For educational use only. Not for diagnosis.
                </span>
                <span className="hidden md:inline">
                  Medical Disclaimer: F-Bot is designed for educational and research purposes only. 
                  It should not be used as a substitute for professional medical advice, diagnosis, or treatment.
                </span>
              </p>
            </div>
            <div className="order-3 mt-2 flex-shrink-0 w-full sm:order-2 sm:mt-0 sm:w-auto">
              <button
                onClick={() => setIsVisible(false)}
                className="flex items-center justify-center px-2 py-1 border border-transparent rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-100 transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
                <span className="sr-only">Dismiss</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default MedicalDisclaimer 