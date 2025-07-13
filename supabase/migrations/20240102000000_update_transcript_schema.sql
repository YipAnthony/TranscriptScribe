-- Migration to update transcripts table for new ParsedTranscript domain model
-- This adds support for comprehensive medical record fields

-- Add new fields for comprehensive medical record
ALTER TABLE transcripts 
ADD COLUMN medications TEXT[], -- Array of medications
ADD COLUMN procedures TEXT[], -- Array of procedures
ADD COLUMN positive_symptoms TEXT[], -- Array of positive symptoms
ADD COLUMN negative_symptoms TEXT[], -- Array of negative symptoms
ADD COLUMN positive_lab_results TEXT[], -- Array of positive lab results
ADD COLUMN negative_lab_results TEXT[], -- Array of negative lab results
ADD COLUMN positive_imaging_results TEXT[], -- Array of positive imaging results
ADD COLUMN negative_imaging_results TEXT[], -- Array of negative imaging results
ADD COLUMN past_diagnoses TEXT[], -- Array of past diagnoses
ADD COLUMN past_surgeries TEXT[], -- Array of past surgeries
ADD COLUMN family_history TEXT[], -- Array of family history
ADD COLUMN positive_lifestyle_factors TEXT[], -- Array of positive lifestyle factors
ADD COLUMN negative_lifestyle_factors TEXT[], -- Array of negative lifestyle factors
ADD COLUMN extraction_notes TEXT[]; -- Array of extraction notes

-- Rename interventions to medications for backward compatibility
-- Note: We'll keep interventions for now and populate both during transition
-- This allows for a gradual migration

-- Create indexes for new fields
CREATE INDEX idx_transcripts_medications ON transcripts USING GIN(medications);
CREATE INDEX idx_transcripts_procedures ON transcripts USING GIN(procedures);
CREATE INDEX idx_transcripts_positive_symptoms ON transcripts USING GIN(positive_symptoms);
CREATE INDEX idx_transcripts_negative_symptoms ON transcripts USING GIN(negative_symptoms);
CREATE INDEX idx_transcripts_positive_lab_results ON transcripts USING GIN(positive_lab_results);
CREATE INDEX idx_transcripts_negative_lab_results ON transcripts USING GIN(negative_lab_results);
CREATE INDEX idx_transcripts_positive_imaging_results ON transcripts USING GIN(positive_imaging_results);
CREATE INDEX idx_transcripts_negative_imaging_results ON transcripts USING GIN(negative_imaging_results);
CREATE INDEX idx_transcripts_past_diagnoses ON transcripts USING GIN(past_diagnoses);
CREATE INDEX idx_transcripts_past_surgeries ON transcripts USING GIN(past_surgeries);
CREATE INDEX idx_transcripts_family_history ON transcripts USING GIN(family_history);
CREATE INDEX idx_transcripts_positive_lifestyle_factors ON transcripts USING GIN(positive_lifestyle_factors);
CREATE INDEX idx_transcripts_negative_lifestyle_factors ON transcripts USING GIN(negative_lifestyle_factors);
CREATE INDEX idx_transcripts_extraction_notes ON transcripts USING GIN(extraction_notes);

-- Add comment to document the schema
COMMENT ON TABLE transcripts IS 'Stores parsed medical transcripts with comprehensive medical record data';
COMMENT ON COLUMN transcripts.medications IS 'Array of medications prescribed or administered';
COMMENT ON COLUMN transcripts.procedures IS 'Array of medical procedures performed or recommended';
COMMENT ON COLUMN transcripts.positive_symptoms IS 'Array of symptoms the patient is experiencing';
COMMENT ON COLUMN transcripts.negative_symptoms IS 'Array of symptoms the patient denies or reports as absent';
COMMENT ON COLUMN transcripts.positive_lab_results IS 'Array of abnormal or significant lab findings';
COMMENT ON COLUMN transcripts.negative_lab_results IS 'Array of normal lab results or negative findings';
COMMENT ON COLUMN transcripts.positive_imaging_results IS 'Array of abnormal or significant imaging findings';
COMMENT ON COLUMN transcripts.negative_imaging_results IS 'Array of normal imaging results or negative findings';
COMMENT ON COLUMN transcripts.past_diagnoses IS 'Array of previous medical conditions';
COMMENT ON COLUMN transcripts.past_surgeries IS 'Array of previous surgical procedures';
COMMENT ON COLUMN transcripts.family_history IS 'Array of relevant family medical history';
COMMENT ON COLUMN transcripts.positive_lifestyle_factors IS 'Array of healthy behaviors and good habits';
COMMENT ON COLUMN transcripts.negative_lifestyle_factors IS 'Array of risk factors and unhealthy behaviors';
COMMENT ON COLUMN transcripts.extraction_notes IS 'Array of notes about the extraction process'; 