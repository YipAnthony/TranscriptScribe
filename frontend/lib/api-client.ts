// API client for making requests to the backend
// Uses industry standard patterns for HTTP client management

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

interface ApiResponse<T = any> {
  data?: T
  error?: string
  status: number
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = BACKEND_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        return {
          error: data.detail || `HTTP error! status: ${response.status}`,
          status: response.status,
        }
      }

      return {
        data,
        status: response.status,
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      }
    }
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    return this.request('/health')
  }

  // Transcript endpoints
  async processTranscript(request: {
    patient_id: string
    raw_transcript: string
    recorded_at?: string
  }): Promise<ApiResponse> {
    return this.request('/api/v1/transcripts', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  // Clinical trial endpoints
  async createClinicalTrialRecommendations(request: {
    patient_id: string
    transcript_id: string
  }): Promise<ApiResponse> {
    return this.request('/api/v1/clinical-trials/recommendations', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  async getClinicalTrial(trialId: string): Promise<ApiResponse> {
    return this.request(`/api/v1/clinical-trials/${trialId}`)
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Export types for use in components
export type { ApiResponse } 