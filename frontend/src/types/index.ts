// User and Authentication Types
export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role: 'admin' | 'user'
  permissions: string[]
  isPending?: boolean
  createdAt: string
  updatedAt: string
}

export interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthResponse {
  token: string
  refreshToken: string
  expiresIn: number
  user: User
}

// Chat Types
export interface ChatMessage {
  id: string
  content: string
  role: 'user' | 'assistant' | 'system'
  timestamp: string
  confidence?: number
  sources?: Source[]
  modelUsed?: string
  cost?: number
  processingTime?: number
  disclaimer?: string
  metadata?: MessageMetadata
}

export interface MessageMetadata {
  patientId?: string
  urgency?: 'low' | 'medium' | 'high' | 'critical'
  specialty?: string
  language?: string
  attachments?: Attachment[]
}

export interface Source {
  type: 'pubmed' | 'textbook' | 'guideline' | 'research' | 'clinical'
  title: string
  url?: string
  evidenceLevel?: '1A' | '1B' | '2A' | '2B' | '3A' | '3B' | '4' | '5'
  authors?: string[]
  journal?: string
  year?: number
  doi?: string
}

export interface ChatSession {
  id: string
  userId: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
  isActive: boolean
  patientContext?: PatientContext
}

export interface PatientContext {
  patientId: string
  age?: number
  gender?: 'male' | 'female' | 'other'
  medicalHistory?: string[]
  currentSymptoms?: string[]
  contraindications?: string[]
}

// Ultrasound Analysis Types
export interface UltrasoundAnalysis {
  id: string
  patientId?: string
  imageUrl: string
  findings: UltrasoundFinding[]
  recommendations: string[]
  confidence: number
  modelUsed: string
  processingTime: number
  createdAt: string
  status: 'processing' | 'completed' | 'failed'
}

export interface UltrasoundFinding {
  finding: string
  location: {
    x: number
    y: number
    width: number
    height: number
  }
  confidence: number
  severity: 'mild' | 'moderate' | 'severe'
  description?: string
}

export interface Attachment {
  id: string
  name: string
  type: 'image' | 'document' | 'ultrasound'
  url: string
  size: number
  uploadedAt: string
}

// API Response Types
export interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
  timestamp: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
  nextCursor?: string
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
  timestamp: string
  requestId: string
}

// Model and Cost Types
export interface AvailableModel {
  id: string
  name: string
  provider: 'openai' | 'anthropic' | 'google' | 'local'
  costPerToken: number
  capabilities: string[]
  status: 'available' | 'unavailable' | 'limited'
  maxTokens?: number
  description?: string
}

export interface ModelPerformance {
  modelId: string
  averageResponseTime: number
  accuracyRate: number
  costEfficiency: number
  userSatisfaction: number
  totalRequests: number
  errorRate: number
}

export interface CostTracking {
  totalCost: number
  monthlyCost: number
  dailyCost: number
  costByModel: Record<string, number>
  requestCount: number
  averageCostPerRequest: number
}

// Medical Safety Types
export interface MedicalAlert {
  type: 'contraindication' | 'drug_interaction' | 'red_flag' | 'emergency'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  recommendations: string[]
  requiresAction: boolean
}

export interface ComplianceLog {
  id: string
  userId: string
  action: string
  resource: string
  timestamp: string
  ipAddress: string
  userAgent: string
  outcome: 'success' | 'failure' | 'blocked'
  details?: Record<string, any>
}

// UI State Types
export interface ChatState {
  currentSession: ChatSession | null
  sessions: ChatSession[]
  isLoading: boolean
  isTyping: boolean
  error: string | null
  selectedModel?: string
  costBudget?: number
}

export interface UIState {
  sidebarOpen: boolean
  darkMode: boolean
  notifications: Notification[]
  activeModal: string | null
  isUploading: boolean
}

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: string
  read: boolean
  actions?: NotificationAction[]
}

export interface NotificationAction {
  label: string
  action: () => void
  style: 'primary' | 'secondary' | 'danger'
}

// Form Types
export interface SendMessageRequest {
  message: string
  sessionId?: string
  patientId?: string
  context?: {
    language?: string
    urgency?: string
    specialty?: string
  }
  modelPreference?: string
  maxCost?: number
}

export interface CreateSessionRequest {
  title?: string
  patientContext?: PatientContext
}

export interface UltrasoundUploadRequest {
  image: File
  patientId?: string
  bodyPart: string
  clinicalContext?: string
}

// Settings Types
export interface UserSettings {
  language: string
  theme: 'light' | 'dark' | 'auto'
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
  }
  privacy: {
    shareUsageData: boolean
    allowAnalytics: boolean
  }
  medical: {
    defaultSpecialty: string
    showDisclaimers: boolean
    requireDoubleConfirmation: boolean
  }
} 