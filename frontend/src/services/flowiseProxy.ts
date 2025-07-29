// Flowise Proxy Service for CORS handling
interface FlowiseProxyRequest {
  question: string
  chatHistory?: Array<{
    type: string
    content: string
  }>
}

interface FlowiseProxyResponse {
  text: string
  success: boolean
  error?: string
}

class FlowiseProxyService {
  private readonly endpoint = "https://flowise-h06w.onrender.com/api/v1/prediction/09e81caf-5151-4748-8373-75e31493baf4"
  private readonly authorization = "Bearer 1lwLFwmqmhWCP4Ew-Bng_7rP0d9R4mujhopekjI0uhQ"

  async query(data: FlowiseProxyRequest): Promise<FlowiseProxyResponse> {
    try {
      // Method 1: Direct fetch with CORS headers
      const response = await fetch(this.endpoint, {
        headers: {
          Authorization: this.authorization,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        method: "POST",
        mode: "cors",
        credentials: "omit",
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      return {
        text: result.text || result.response || "No response text received",
        success: true
      }

    } catch (error) {
      console.error('Flowise proxy error:', error)
      
      // Method 2: Try with different CORS settings
      try {
        const response2 = await fetch(this.endpoint, {
          headers: {
            Authorization: this.authorization,
            "Content-Type": "application/json"
          },
          method: "POST",
          mode: "no-cors",
          body: JSON.stringify(data)
        })

        if (response2.type === 'opaque') {
          throw new Error('CORS blocked: Opaque response received')
        }

        const result2 = await response2.json()
        return {
          text: result2.text || result2.response || "No response text received",
          success: true
        }

      } catch (error2) {
        console.error('Flowise proxy fallback error:', error2)
        
        // Method 3: Return a helpful error message
        return {
          text: "I'm having trouble connecting to my knowledge base right now. Please try again in a moment, or contact support if the issue persists.",
          success: false,
          error: error2 instanceof Error ? error2.message : 'Unknown error'
        }
      }
    }
  }
}

export const flowiseProxy = new FlowiseProxyService() 