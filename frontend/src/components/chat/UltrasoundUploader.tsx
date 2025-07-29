import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import {
  XMarkIcon,
  PhotoIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { apiService } from '../../services/api'
import { UltrasoundAnalysis } from '../../types'
import LoadingSpinner from '../ui/LoadingSpinner'
import { toast } from 'react-hot-toast'

interface UltrasoundUploaderProps {
  onClose: () => void
  onAnalysisComplete?: (analysis: UltrasoundAnalysis) => void
}

const UltrasoundUploader: React.FC<UltrasoundUploaderProps> = ({
  onClose,
  onAnalysisComplete,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [bodyPart, setBodyPart] = useState('')
  const [clinicalContext, setClinicalContext] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff'],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0]
      if (file) {
        setSelectedFile(file)
        
        // Create preview
        const reader = new FileReader()
        reader.onload = () => {
          setPreview(reader.result as string)
        }
        reader.readAsDataURL(file)
      }
    },
  })

  const handleUpload = async () => {
    if (!selectedFile || !bodyPart.trim()) {
      toast.error('Please select an image and specify the body part')
      return
    }

    setIsUploading(true)
    try {
      const analysis = await apiService.uploadUltrasound({
        image: selectedFile,
        bodyPart: bodyPart.trim(),
        clinicalContext: clinicalContext.trim() || undefined,
      })

      toast.success('Ultrasound analysis completed!')
      onAnalysisComplete?.(analysis)
      onClose()
    } catch (error: any) {
      console.error('Upload failed:', error)
      toast.error(error.response?.data?.message || 'Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const bodyParts = [
    'Shoulder',
    'Neck',
    'Back',
    'Hip',
    'Knee',
    'Ankle',
    'Wrist',
    'Elbow',
    'Thoracic',
    'Lumbar',
    'Cervical',
    'Other',
  ]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white border border-gray-200 rounded-lg p-6 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Upload Ultrasound Image
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Medical Disclaimer */}
      <div className="medical-warning">
        <div className="flex items-start space-x-2">
          <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs">
            <p className="font-medium">Medical Image Analysis</p>
            <p>
              AI analysis is for educational purposes only. Always consult with qualified 
              healthcare professionals for clinical interpretation.
            </p>
          </div>
        </div>
      </div>

      {/* File Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-medical-400 bg-medical-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        
        {preview ? (
          <div className="space-y-3">
            <img
              src={preview}
              alt="Ultrasound preview"
              className="max-h-32 mx-auto rounded"
            />
            <div className="flex items-center justify-center space-x-2 text-sm text-green-600">
              <CheckCircleIcon className="h-4 w-4" />
              <span>Image selected: {selectedFile?.name}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelectedFile(null)
                setPreview(null)
              }}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Remove image
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto" />
            <div className="text-sm text-gray-600">
              <p className="font-medium">Click to upload or drag and drop</p>
              <p>PNG, JPG, GIF up to 10MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Body Part Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Body Part *
        </label>
        <select
          value={bodyPart}
          onChange={(e) => setBodyPart(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500"
          required
        >
          <option value="">Select body part</option>
          {bodyParts.map((part) => (
            <option key={part} value={part}>
              {part}
            </option>
          ))}
        </select>
      </div>

      {/* Clinical Context */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Clinical Context (Optional)
        </label>
        <textarea
          value={clinicalContext}
          onChange={(e) => setClinicalContext(e.target.value)}
          placeholder="Describe symptoms, suspected conditions, or specific areas of interest..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500"
          rows={3}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          <p>Analysis typically takes 10-30 seconds</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || !bodyPart.trim() || isUploading}
            className="flex items-center space-x-2 px-4 py-2 bg-medical-600 text-white text-sm rounded-md hover:bg-medical-700 focus:outline-none focus:ring-2 focus:ring-medical-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? (
              <>
                <LoadingSpinner size="small" color="white" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <CloudArrowUpIcon className="h-4 w-4" />
                <span>Analyze Image</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default UltrasoundUploader 