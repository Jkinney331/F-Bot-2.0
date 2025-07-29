// F-Bot Flowise Integration Service
import { ChatMessage, SendMessageRequest } from '../types'

interface FlowiseResponse {
  text: string
  sourceDocuments?: Array<{
    pageContent: string
    metadata: {
      source: string
      title?: string
      author?: string
      year?: string
    }
  }>
  chatHistory?: Array<{
    type: string
    content: string
  }>
}

interface FlowiseRequest {
  question: string
  chatHistory?: Array<{
    type: string
    content: string
  }>
  overrideConfig?: {
    sessionId?: string
  }
}

class FlowiseService {
  private readonly endpoint = "https://flowise-h06w.onrender.com/api/v1/prediction/09e81caf-5151-4748-8373-75e31493baf4"
  private readonly authorization = "Bearer 1lwLFwmqmhWCP4Ew-Bng_7rP0d9R4mujhopekjI0uhQ"
  // Kimi API key for future integration
  // private readonly kimiApiKey = "sk-IcNS9jgAA8KRTGL6j4XMdaoKPRGdMrKn4EvwGvqkQNluyByI"
  
  private chatHistories: Map<string, Array<{ type: string; content: string }>> = new Map()

  async query(data: FlowiseRequest): Promise<FlowiseResponse> {
    try {
      const response = await fetch(this.endpoint, {
        headers: {
          Authorization: this.authorization,
          "Content-Type": "application/json"
        },
        method: "POST",
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error(`Flowise API error: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Flowise API error:', error)
      throw error
    }
  }

  async sendMessage(request: SendMessageRequest): Promise<ChatMessage> {
    try {
      const { message, sessionId } = request
      
      if (!sessionId) {
        throw new Error('Session ID is required')
      }
      
      // Get or initialize chat history for this session
      let chatHistory = this.chatHistories.get(sessionId) || []
      
      // Prepare Flowise request
      const flowiseRequest: FlowiseRequest = {
        question: message,
        chatHistory: chatHistory,
        overrideConfig: {
          sessionId: sessionId
        }
      }

      // Call Flowise API
      const startTime = Date.now()
      const flowiseResponse = await this.query(flowiseRequest)
      const processingTime = (Date.now() - startTime) / 1000

      // Update chat history
      chatHistory.push(
        { type: 'human', content: message },
        { type: 'ai', content: flowiseResponse.text }
      )
      this.chatHistories.set(sessionId, chatHistory)

      // Format response as ChatMessage
      const chatMessage: ChatMessage = {
        id: `flowise-${Date.now()}`,
        content: flowiseResponse.text,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        confidence: 0.9, // High confidence for Dr. Fascia responses
        sources: this.formatSources(flowiseResponse.sourceDocuments),
        modelUsed: 'Dr. Fascia (Flowise + meta-llama)',
        cost: 0.003, // Estimate for now
        processingTime: processingTime,
        disclaimer: '⚠️ This is AI-generated medical information. Always consult healthcare professionals for medical advice.'
      }

      return chatMessage
    } catch (error) {
      console.error('Flowise service error:', error)
      throw new Error('Failed to get response from Dr. Fascia. Please try again.')
    }
  }

  private formatSources(sourceDocuments?: FlowiseResponse['sourceDocuments']) {
    if (!sourceDocuments) return undefined

    return sourceDocuments.map(doc => ({
      type: 'research' as const,
      title: doc.metadata.title || 'Medical Research Document',
      evidenceLevel: '2A' as const, // Default evidence level
      journal: doc.metadata.source || 'Medical Database',
      year: doc.metadata.year ? parseInt(doc.metadata.year) : new Date().getFullYear(),
      authors: doc.metadata.author ? [doc.metadata.author] : undefined,
      content: doc.pageContent
    }))
  }

  // Method to clear chat history for a session
  clearSession(sessionId: string) {
    this.chatHistories.delete(sessionId)
  }

  // Method to get chat history for debugging
  getSessionHistory(sessionId: string) {
    if (!sessionId) return []
    return this.chatHistories.get(sessionId) || []
  }
}

export const flowiseService = new FlowiseService() 