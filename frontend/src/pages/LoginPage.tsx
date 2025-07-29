import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { LockClosedIcon, UserIcon, HeartIcon } from '@heroicons/react/24/outline'
import useAuthStore from '../stores/authStore'
import { LoginCredentials } from '../types'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginCredentials>()

  const onSubmit = async (data: LoginCredentials) => {
    const success = await login(data)
    if (!success) {
      setError('username', { 
        type: 'manual', 
        message: 'Invalid credentials' 
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-medical-50 to-fascia-100 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto h-16 w-16 bg-medical-500 rounded-full flex items-center justify-center"
          >
            <HeartIcon className="h-8 w-8 text-white" />
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6 text-3xl font-bold text-gray-900"
          >
            F-Bot 2.0
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-2 text-sm text-gray-600"
          >
            Advanced Fascia AI Assistant
          </motion.p>
          
          {/* HIPAA Compliance Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
          >
            <LockClosedIcon className="h-3 w-3 mr-1" />
            HIPAA Compliant
          </motion.div>
        </div>

        {/* Login Form */}
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-8 space-y-6"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="rounded-md shadow-sm space-y-4">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('username', { 
                    required: 'Username is required',
                    minLength: {
                      value: 3,
                      message: 'Username must be at least 3 characters'
                    }
                  })}
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  className={`appearance-none relative block w-full pl-10 pr-3 py-3 border ${
                    errors.username ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-medical-500 focus:border-medical-500 focus:z-10 sm:text-sm transition-colors`}
                  placeholder="Enter your username or email"
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password', { 
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`appearance-none relative block w-full pl-10 pr-12 py-3 border ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-medical-500 focus:border-medical-500 focus:z-10 sm:text-sm transition-colors`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                    {showPassword ? 'Hide' : 'Show'}
                  </span>
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-medical-600 hover:bg-medical-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-medical-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <LoadingSpinner size="small" className="text-white" />
              ) : (
                <>
                  <LockClosedIcon className="h-5 w-5 mr-2" />
                  Sign in to F-Bot
                </>
              )}
            </motion.button>
          </div>

                                {/* Demo Mode Notice */}
                      <div className="text-center space-y-2">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                          <div className="flex items-center justify-center space-x-2 mb-3">
                            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium text-blue-800">Demo Mode Active</span>
                          </div>
                          
                          <p className="text-xs text-blue-600 mb-4">
                            Choose credentials based on the user type you want to test:
                          </p>
                          
                          {/* Admin Credentials */}
                          <div className="mb-3 p-3 bg-purple-100 rounded border border-purple-300">
                            <p className="text-xs font-semibold text-purple-800 mb-2">👨‍💼 Admin Access (Full Dashboard)</p>
                            <p className="text-sm font-bold text-purple-900">Username: admin@hashagency.com</p>
                            <p className="text-sm font-bold text-purple-900">Password: password</p>
                            <p className="text-xs text-purple-700 mt-1 italic">Access: Chat + Admin Dashboard + Knowledge Base</p>
                          </div>
                          
                          {/* User Credentials */}
                          <div className="mb-3 p-3 bg-green-100 rounded border border-green-300">
                            <p className="text-xs font-semibold text-green-800 mb-2">👨‍⚕️ Regular User (Chat Only)</p>
                            <p className="text-sm font-bold text-green-900">Username: test@hashagency.com</p>
                            <p className="text-sm font-bold text-green-900">Password: password</p>
                            <p className="text-xs text-green-700 mt-1 italic">Access: Chat Interface Only</p>
                          </div>
                          
                          <div className="mt-3 text-xs text-blue-700">
                            <p className="italic">Or use any other username/password combination</p>
                            <p className="text-xs text-blue-600 mt-1">(Include 'admin' in username for admin access)</p>
                          </div>
                        </div>
                        
                        <p className="text-xs text-gray-500">
                          By signing in, you agree to our medical terms of service
                        </p>
                        <div className="flex justify-center space-x-4 text-xs">
                          <button
                            type="button"
                            className="text-medical-600 hover:text-medical-500 transition-colors"
                          >
                            Forgot Password?
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            type="button"
                            className="text-medical-600 hover:text-medical-500 transition-colors"
                          >
                            Need Help?
                          </button>
                        </div>
                      </div>
        </motion.form>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <div className="flex">
            <LockClosedIcon className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-700">
              <p className="font-medium">Secure Medical Platform</p>
              <p className="mt-1">
                All data is encrypted and HIPAA compliant. This platform is for
                authorized healthcare professionals only.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default LoginPage 