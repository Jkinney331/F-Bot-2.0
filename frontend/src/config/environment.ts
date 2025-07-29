// Environment Configuration
export const ENV = {
  // API Configuration
  FLOWISE_API_URL: 'https://flowise-h06w.onrender.com/api/v1/prediction/09e81caf-5151-4748-8373-75e31493baf4',
  FLOWISE_API_KEY: '1lwLFwmqmhWCP4Ew-Bng_7rP0d9R4mujhopekjI0uhQ',
  
  // Pinecone Configuration
  PINECONE_API_KEY: 'pcsk_6yGqug_9TeXjbLDv5Tz2Mk5CTrvbpZjicVmevweSU65EZ2NwXXx1SbSpSMznBi8eEpCf4u',
  PINECONE_INDEX: 'fascia-medical-knowledge',
  
  // App Configuration
  APP_NAME: 'F-Bot 2.0',
  APP_VERSION: '2.0.0',
  CACHE_BUST: Date.now(), // Force cache refresh for Netlify deployment
  
  // Feature Flags
  ENABLE_PINECONE: false, // Temporarily disabled until SDK is installed
  ENABLE_ULTRASOUND: true,
  ENABLE_ADMIN: true,
  
  // Security
  HIPAA_COMPLIANT: true,
  ENCRYPTION_ENABLED: true
}

// Environment configuration for F-Bot frontend
export interface AppConfig {
  apiBaseUrl: string
  environment: 'development' | 'staging' | 'production'
  isDevelopment: boolean
  isProduction: boolean
  demoMode: boolean
  enableAnalytics: boolean
  enableErrorReporting: boolean
  version: string
}

// Get environment variables with fallbacks
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  // In Vite, environment variables are available as import.meta.env
  if (typeof window !== 'undefined') {
    // Browser environment
    return (window as any).__ENV__?.[key] || defaultValue
  }
  
  // Build time environment
  const envVars = (import.meta as any).env || {}
  return envVars[key] || defaultValue
}

// Determine current environment
const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
const isDevelopment = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('localhost')
const isNetlify = hostname.includes('netlify.app') || hostname.includes('netlify.com')
const isProduction = !isDevelopment && (isNetlify || getEnvVar('VITE_ENVIRONMENT') === 'production')

// Create configuration object
export const config: AppConfig = {
  apiBaseUrl: getEnvVar('VITE_API_BASE_URL', isDevelopment ? 'http://localhost:3000/api' : '/api'),
  environment: isProduction ? 'production' : isDevelopment ? 'development' : 'staging',
  isDevelopment,
  isProduction,
  demoMode: true, // Always loginless mode - no login required
  enableAnalytics: isProduction && getEnvVar('VITE_ENABLE_ANALYTICS', 'true') === 'true',
  enableErrorReporting: isProduction && getEnvVar('VITE_ENABLE_ERROR_REPORTING', 'true') === 'true',
  version: getEnvVar('VITE_APP_VERSION', '2.0.0'),
}

// Utility functions
export const isDemo = () => config.demoMode
export const getApiUrl = (endpoint: string) => `${config.apiBaseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`
export const logEnvironmentInfo = () => {
  if (config.isDevelopment) {
    console.log('🚀 F-Bot Environment Info:', {
      environment: config.environment,
      apiBaseUrl: config.apiBaseUrl,
      demoMode: config.demoMode,
      version: config.version,
      hostname,
    })
  }
}

// Medical compliance settings
export const medicalConfig = {
  showDisclaimers: true,
  requireConsent: config.isProduction,
  hipaaCompliant: true,
  auditLogging: config.isProduction,
  dataRetentionDays: config.isProduction ? 2555 : 30, // 7 years for production, 30 days for dev
}

// Feature flags
export const features = {
  ultrasoundAnalysis: true,
  multiLLM: true,
  realTimeChat: !config.isProduction, // Disable WebSocket in prod until backend ready
  fileUpload: true,
  exportChat: true,
  darkMode: false, // TODO: Implement dark mode
  voice: false, // TODO: Implement voice features
  mobileApp: false, // TODO: PWA features
}

// Performance configuration
export const performance = {
  enableSourceMaps: config.isDevelopment,
  chunkSizeLimit: 500 * 1024, // 500KB
  enableCodeSplitting: true,
  enableLazyLoading: true,
  cacheTimeMinutes: config.isProduction ? 60 : 5,
}

// Security configuration
export const security = {
  enableCSP: config.isProduction,
  enableHTTPS: config.isProduction,
  sessionTimeoutMinutes: config.isProduction ? 60 : 480, // 1 hour prod, 8 hours dev
  maxLoginAttempts: 5,
  requireStrongPasswords: config.isProduction,
}

// Analytics configuration
export const analytics = {
  enabled: config.enableAnalytics,
  trackingId: getEnvVar('VITE_GA_TRACKING_ID'),
  enableHeatmaps: config.isProduction,
  enableSessionRecording: false, // HIPAA compliance - no session recording
  enableErrorTracking: config.enableErrorReporting,
}

// Initialize environment
logEnvironmentInfo()

export default config 