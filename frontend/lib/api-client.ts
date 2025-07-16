// API client for making requests to the backend
// Uses industry standard patterns for HTTP client management

import { createClient } from './supabase/client'
import type { Patient } from '../types'
import type { Transcript } from '../types'
import type { TranscriptRecommendations } from '../types'
import type { ClinicalTrial } from '../types'
import type { ClinicalTrialDetails, GetClinicalTrialResponse } from '@/types'

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
    
    // Get the current session to extract JWT token
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    // Add Authorization header with JWT token if available
    if (session?.access_token) {
      defaultHeaders['Authorization'] = `Bearer ${session.access_token}`
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

  async getClinicalTrial(trialId: string): Promise<{ trial: ClinicalTrialDetails | null, error?: string }> {
    const response = await this.request<GetClinicalTrialResponse>(`/api/v1/clinical-trials/${trialId}`)
    return { trial: response.data?.trial || null, error: response.error || undefined }
  }

  // PATIENTS
  async getPatients(): Promise<Patient[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('patients')
      .select(`*, transcripts:transcripts(count), addresses:address_id(city, state)`)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data || []).map((patient: any) => ({
      ...patient,
      transcript_count: patient.transcripts?.[0]?.count || 0,
      city: patient.addresses?.city || '',
      state: patient.addresses?.state || ''
    }))
  }

  async getPatientById(patientId: string): Promise<Patient | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('patients')
      .select(`*, addresses:address_id(city, state)`)
      .eq('id', patientId)
      .single()
    if (error) throw error
    if (!data) return null
    return {
      ...data,
      city: data.addresses?.city || '',
      state: data.addresses?.state || ''
    }
  }

  async addPatient(patient: Omit<Patient, 'id' | 'created_at' | 'updated_at' | 'transcript_count'> & { city?: string, state?: string }): Promise<void> {
    const supabase = createClient()
    let addressId = null
    if (patient.city || patient.state) {
      const { data: existingAddress } = await supabase
        .from('addresses')
        .select('id')
        .eq('city', patient.city || null)
        .eq('state', patient.state || null)
        .single()
      if (existingAddress) {
        addressId = existingAddress.id
      } else {
        const { data: newAddress, error: addressError } = await supabase
          .from('addresses')
          .insert({ city: patient.city || null, state: patient.state || null })
          .select('id')
          .single()
        if (addressError) throw addressError
        addressId = newAddress.id
      }
    }
    const { error } = await supabase
      .from('patients')
      .insert({
        first_name: patient.first_name,
        last_name: patient.last_name,
        date_of_birth: patient.date_of_birth || null,
        sex: patient.sex || null,
        address_id: addressId,
        email: patient.email || null,
        phone: patient.phone || null
      })
    if (error) throw error
  }

  async updatePatient(patientId: string, patient: Omit<Patient, 'id' | 'created_at' | 'updated_at' | 'transcript_count'> & { city?: string, state?: string }): Promise<void> {
    const supabase = createClient()
    let addressId = null
    if (patient.city || patient.state) {
      const { data: existingAddress } = await supabase
        .from('addresses')
        .select('id')
        .eq('city', patient.city || null)
        .eq('state', patient.state || null)
        .single()
      if (existingAddress) {
        addressId = existingAddress.id
      } else {
        const { data: newAddress, error: addressError } = await supabase
          .from('addresses')
          .insert({ city: patient.city || null, state: patient.state || null })
          .select('id')
          .single()
        if (addressError) throw addressError
        addressId = newAddress.id
      }
    }
    const { error } = await supabase
      .from('patients')
      .update({
        first_name: patient.first_name,
        last_name: patient.last_name,
        date_of_birth: patient.date_of_birth || null,
        sex: patient.sex || null,
        address_id: addressId,
        email: patient.email || null,
        phone: patient.phone || null
      })
      .eq('id', patientId)
    if (error) throw error
  }

  async deletePatient(patientId: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', patientId)
    if (error) throw error
  }

  // APPOINTMENTS / TRANSCRIPTS
  async getAppointments(patientId?: string): Promise<any[]> {
    const supabase = createClient()
    let query = supabase
      .from('transcripts')
      .select(`*, patients:patient_id(first_name, last_name)`)
      .order('created_at', { ascending: false })
    if (patientId) {
      query = query.eq('patient_id', patientId)
    }
    const { data: transcriptsData, error: transcriptsError } = await query
    if (transcriptsError) throw transcriptsError
    // Fetch recommendations for all transcripts
    const { data: recommendationsData, error: recommendationsError } = await supabase
      .from('transcript_recommendations')
      .select('*')
    if (recommendationsError) throw recommendationsError
    // Transform
    return (transcriptsData || []).map(transcript => {
      const recommendations = recommendationsData?.find(rec => rec.transcript_id === transcript.id)
      const eligibleCount = recommendations?.eligible_trials?.length || 0
      const uncertainCount = recommendations?.uncertain_trials?.length || 0
      const totalTrials = eligibleCount + uncertainCount
      return {
        ...transcript,
        patient_name: transcript.patients 
          ? `${transcript.patients.first_name} ${transcript.patients.last_name}`
          : 'Unknown Patient',
        clinical_trials_count: totalTrials,
        conditions: transcript.conditions || []
      }
    })
  }

  async getAppointmentById(appointmentId: string): Promise<any | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('transcripts')
      .select(`*, patients:patient_id(first_name, last_name)`)
      .eq('id', appointmentId)
      .single()
    if (error) throw error
    if (!data) return null
    return {
      ...data,
      patient_name: data.patients 
        ? `${data.patients.first_name} ${data.patients.last_name}`
        : 'Unknown Patient'
    }
  }

  async deleteAppointment(appointmentId: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('transcripts')
      .delete()
      .eq('id', appointmentId)
    if (error) throw error
  }

  async getPatientsForSelect(): Promise<{ id: string, first_name: string, last_name: string }[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('patients')
      .select('id, first_name, last_name')
      .order('first_name', { ascending: true })
    if (error) throw error
    return data || []
  }

  // PATIENT SAVED TRIALS
  async getSavedTrials(patientId: string): Promise<string[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('patient_saved_trials')
      .select('clinical_trial_id')
      .eq('patient_id', patientId)
    if (error) throw error
    return (data || []).map((item: any) => item.clinical_trial_id)
  }

  async saveTrial(patientId: string, trialId: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('patient_saved_trials')
      .insert({
        patient_id: patientId,
        clinical_trial_id: trialId,
        created_at: new Date().toISOString()
      })
    if (error) throw error
  }

  async removeSavedTrial(patientId: string, trialId: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('patient_saved_trials')
      .delete()
      .eq('patient_id', patientId)
      .eq('clinical_trial_id', trialId)
    if (error) throw error
  }

  // COUNTS
  async getAppointmentCount(): Promise<number> {
    const supabase = createClient()
    const { count, error } = await supabase
      .from('transcripts')
      .select('*', { count: 'exact', head: true })
    if (error) throw error
    return count || 0
  }

  async getPatientCount(): Promise<number> {
    const supabase = createClient()
    const { count, error } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
    if (error) throw error
    return count || 0
  }

  // PATIENT TRIALS PAGE
  async getPatientsWithTrials(): Promise<Patient[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  }

  async getPatientTrials(patientId: string): Promise<{
    savedTrials: any[],
    providerRecommendations: any[],
    acceptedRecommendations: any[],
    rejectedRecommendations: any[],
  }> {
    const supabase = createClient()
    // Saved trials
    const { data: savedTrials, error: savedError } = await supabase
      .from('patient_saved_trials')
      .select('*, trial:clinical_trials(*)')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
    if (savedError) throw savedError
    // Provider recommendations (pending)
    const { data: providerRecommendations, error: providerRecommendationsError } = await supabase
      .from('provider_recommended_trials')
      .select('*, trial:clinical_trials(*)')
      .eq('patient_id', patientId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    if (providerRecommendationsError) throw providerRecommendationsError
    // Accepted recommendations
    const { data: acceptedRecommendations, error: acceptedRecommendationsError } = await supabase
      .from('provider_recommended_trials')
      .select('*, trial:clinical_trials(*)')
      .eq('patient_id', patientId)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })
    if (acceptedRecommendationsError) throw acceptedRecommendationsError
    // Rejected recommendations
    const { data: rejectedRecommendations, error: rejectedRecommendationsError } = await supabase
      .from('provider_recommended_trials')
      .select('*, trial:clinical_trials(*)')
      .eq('patient_id', patientId)
      .eq('status', 'rejected')
      .order('created_at', { ascending: false })
    if (rejectedRecommendationsError) throw rejectedRecommendationsError
    return {
      savedTrials: savedTrials || [],
      providerRecommendations: providerRecommendations || [],
      acceptedRecommendations: acceptedRecommendations || [],
      rejectedRecommendations: rejectedRecommendations || [],
    }
  }

  // PATIENT TRIAL ACTIONS
  async saveTrialWithRecommendation(patientId: string, trialId: string, recommendationId?: string): Promise<void> {
    const supabase = createClient()
    // Save the trial
    const { error: saveError } = await supabase
      .from('patient_saved_trials')
      .insert({
        patient_id: patientId,
        clinical_trial_id: trialId,
        created_at: new Date().toISOString()
      })
    if (saveError) throw saveError
    // If from a provider recommendation, update its status
    if (recommendationId) {
      const { error: updateError } = await supabase
        .from('provider_recommended_trials')
        .update({ status: 'accepted' })
        .eq('id', recommendationId)
      if (updateError) throw updateError
    }
  }

  async removeSavedTrialById(savedTrialId: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('patient_saved_trials')
      .delete()
      .eq('id', savedTrialId)
    if (error) throw error
  }

  async rejectRecommendation(recommendationId: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('provider_recommended_trials')
      .update({ status: 'rejected' })
      .eq('id', recommendationId)
    if (error) throw error
  }

  async rejectSavedTrial(savedTrialId: string, patientId: string): Promise<void> {
    const supabase = createClient()
    // Remove from saved trials
    const { error: removeError } = await supabase
      .from('patient_saved_trials')
      .delete()
      .eq('id', savedTrialId)
    if (removeError) throw removeError
    // Find if this trial was originally recommended by a provider
    const { data: recommendationData, error: recommendationError } = await supabase
      .from('provider_recommended_trials')
      .select('id')
      .eq('patient_id', patientId)
      .eq('clinical_trial_id', savedTrialId)
      .eq('status', 'accepted')
      .single()
    if (!recommendationError && recommendationData) {
      // Update the existing recommendation to rejected status
      const { error: updateError } = await supabase
        .from('provider_recommended_trials')
        .update({ status: 'rejected' })
        .eq('id', recommendationData.id)
      if (updateError) throw updateError
    }
  }

  async acceptAndSaveRejected(recommendation: { id: string, patient_id: string, trial: { id: string } }): Promise<void> {
    const supabase = createClient()
    // Update provider recommendation status to 'accepted'
    const { error: updateError } = await supabase
      .from('provider_recommended_trials')
      .update({ status: 'accepted' })
      .eq('id', recommendation.id)
    if (updateError) throw updateError
    // Try to insert into patient_saved_trials, but ignore duplicate errors
    const { error: insertError } = await supabase
      .from('patient_saved_trials')
      .insert({
        patient_id: recommendation.patient_id,
        clinical_trial_id: recommendation.trial.id,
        created_at: new Date().toISOString(),
      })
    if (insertError && insertError.code !== '23505') throw insertError
  }

  // RECOMMENDED TRIALS DIALOG HELPERS
  async getTranscriptRecommendations(appointmentId: string): Promise<TranscriptRecommendations | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('transcript_recommendations')
      .select('*')
      .eq('transcript_id', appointmentId)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return data || null
  }

  async getClinicalTrialsByIds(trialIds: string[]): Promise<ClinicalTrial[]> {
    if (!trialIds.length) return []
    const supabase = createClient()
    const { data, error } = await supabase
      .from('clinical_trials')
      .select('*')
      .in('id', trialIds)
    if (error) throw error
    return data || []
  }

  async getPatientNameByTranscript(appointmentId: string): Promise<{ patientId: string, patientName: string } | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('transcripts')
      .select('patient_id, patients:patient_id(first_name, last_name)')
      .eq('id', appointmentId)
      .single()
    if (error) throw error
    if (!data) return null
    let patientName = ''
    if (data.patients) {
      if (Array.isArray(data.patients) && data.patients.length > 0) {
        const patient = data.patients[0]
        if (patient.first_name && patient.last_name) {
          patientName = `${patient.first_name} ${patient.last_name}`
        }
      } else if (
        typeof data.patients === 'object' &&
        'first_name' in data.patients &&
        'last_name' in data.patients &&
        data.patients.first_name && data.patients.last_name
      ) {
        patientName = `${data.patients.first_name} ${data.patients.last_name}`
      }
    }
    return { patientId: data.patient_id, patientName }
  }

  async getRecommendedTrials(patientId: string): Promise<Set<string>> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('provider_recommended_trials')
      .select('clinical_trial_id')
      .eq('patient_id', patientId)
      .in('status', ['pending', 'accepted'])
    if (error) throw error
    return new Set(data?.map(item => item.clinical_trial_id) || [])
  }

  async getClinicalTrialById(externalId: string): Promise<ClinicalTrial | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('clinical_trials')
      .select('*')
      .eq('external_id', externalId)
      .single()
    if (error) return null
    if (!data) return null
    return {
      ...data,
      phases: Array.isArray(data.phases) ? data.phases : [],
      primary_outcomes: Array.isArray(data.primary_outcomes) ? data.primary_outcomes : [],
      secondary_outcomes: Array.isArray(data.secondary_outcomes) ? data.secondary_outcomes : [],
      standard_ages: Array.isArray(data.standard_ages) ? data.standard_ages : [],
      interventions: Array.isArray(data.interventions) ? data.interventions : [],
      central_contacts: Array.isArray(data.central_contacts) ? data.central_contacts : [],
      overall_officials: Array.isArray(data.overall_officials) ? data.overall_officials : [],
    }
  }

  async suggestTrial(patientId: string, clinicalTrialId: string, notes: string | null): Promise<{ error?: any }> {
    const supabase = createClient()
    const { error } = await supabase
      .from('provider_recommended_trials')
      .insert({
        patient_id: patientId,
        clinical_trial_id: clinicalTrialId,
        notes
      })
    return { error }
  }

  /**
   * Generate a fake patient-doctor conversation transcript for a given patient.
   * @param patientId The patient ID
   * @returns The generated conversation as a string (markdown)
   */
  async generateFakeTranscript(patientId: string): Promise<string> {
    const response = await this.request<{ fake_transcript: string; error?: string }>(
      `/api/v1/transcripts/generate-fake/${patientId}`,
      {
        method: 'POST',
      }
    )
    if (response.error) throw new Error(response.error)
    return response.data?.fake_transcript || ''
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Export types for use in components
export type { ApiResponse } 