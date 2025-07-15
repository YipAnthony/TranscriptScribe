// Common domain types for the frontend

export interface Patient {
  id: string
  first_name: string
  last_name: string
  date_of_birth?: string | null
  sex?: string | null
  email?: string | null
  phone?: string | null
  address_id?: string | null
  created_at?: string
  updated_at?: string
  transcript_count?: number
}

// Remove Appointment interface and replace with Transcript interface matching the transcripts table schema

export interface Transcript {
  id: string
  patient_id: string
  conditions?: string[]
  interventions?: string[]
  medications?: string[]
  procedures?: string[]
  positive_symptoms?: string[]
  negative_symptoms?: string[]
  positive_lab_results?: string[]
  negative_lab_results?: string[]
  positive_imaging_results?: string[]
  negative_imaging_results?: string[]
  past_diagnoses?: string[]
  past_surgeries?: string[]
  family_history?: string[]
  positive_lifestyle_factors?: string[]
  negative_lifestyle_factors?: string[]
  extraction_notes?: string[]
  // Location fields
  street?: string
  city?: string
  state?: string
  zip_code?: string
  country?: string
  // Demographics
  sex?: string
  age?: number
  // Metadata
  recorded_at?: string
  status?: string
  processing_metadata?: any
  created_at?: string
  updated_at?: string
}

export interface ClinicalTrial {
  id: string
  external_id: string
  brief_title: string
  official_title?: string
  status?: string
  conditions: string[]
  brief_summary: string
  locations: string[]
  eligibility_criteria?: string
  created_at: string
}

export interface ClinicalTrialDetails {
  external_id: string
  brief_title: string
  official_title?: string
  status: string
  conditions: string[]
  sponsor_name?: string
  phases: string[]
  minimum_age?: string
  maximum_age?: string
  locations: string[]
  brief_summary?: string
  detailed_description?: string
  study_type?: string
  primary_purpose?: string
  enrollment_count?: number
  start_date?: string
  completion_date?: string
  primary_completion_date?: string
  eligibility_criteria?: string
  sex?: string
  healthy_volunteers?: boolean
  standard_ages: string[]
  interventions: Array<{name: string, type: string}>
  primary_outcomes: Array<{measure: string, description: string, time_frame: string, outcome_type: string}>
  secondary_outcomes: Array<{measure: string, description: string, time_frame: string, outcome_type: string}>
  central_contacts: Array<{name: string, email?: string, phone?: string}>
  overall_officials: Array<{name: string, email?: string, phone?: string}>
  source_registry?: string
  registry_version?: string
  last_updated?: string
}

export interface TranscriptRecommendations {
  id: string
  transcript_id: string
  eligible_trials: string[]
  uncertain_trials: string[]
  created_at: string
} 