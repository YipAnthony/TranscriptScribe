-- Migration to add profiles table and admin functionality
-- This creates a profiles table that will be automatically populated when someone signs up via Supabase Auth
-- Following the official Supabase pattern for user management

-- Create profiles table to store additional user information
CREATE TABLE public.profiles (
    id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'patient')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- Create clinical_trials table for storing clinical trial preview data
CREATE TABLE clinical_trials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Core identification fields
    external_id VARCHAR(255) NOT NULL UNIQUE, -- ClinicalTrials.gov NCT ID or other registry ID
    brief_title TEXT NOT NULL,
    
    -- Preview data fields (essential for list display)
    status VARCHAR(50) NOT NULL, -- e.g., "RECRUITING", "COMPLETED", etc.
    conditions TEXT[] NOT NULL, -- Array of conditions
    brief_summary TEXT,
    
    -- Location data (simplified for preview)
    locations TEXT[], -- Array of location strings
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transcript_recommendations table to store organized trial recommendations per transcript
CREATE TABLE transcript_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transcript_id UUID NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
    eligible_trials UUID[] DEFAULT '{}', -- Array of trial_recommendation IDs that are clearly eligible
    uncertain_trials UUID[] DEFAULT '{}', -- Array of trial_recommendation IDs that need more review
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(transcript_id)
);

-- Create patient_saved_trials table for patients to save trials they're interested in
CREATE TABLE patient_saved_trials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    clinical_trial_id UUID NOT NULL REFERENCES clinical_trials(id) ON DELETE CASCADE,
    notes TEXT, -- Patient's personal notes about the trial
    priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5), -- 1=lowest, 5=highest
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(patient_id, clinical_trial_id)
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_is_active ON profiles(is_active);
CREATE INDEX idx_clinical_trials_external_id ON clinical_trials(external_id);
CREATE INDEX idx_clinical_trials_status ON clinical_trials(status);
CREATE INDEX idx_clinical_trials_conditions ON clinical_trials USING GIN(conditions);
CREATE INDEX idx_clinical_trials_locations ON clinical_trials USING GIN(locations);
CREATE INDEX idx_transcript_recommendations_transcript_id ON transcript_recommendations(transcript_id);
CREATE INDEX idx_transcript_recommendations_eligible_trials ON transcript_recommendations USING GIN(eligible_trials);
CREATE INDEX idx_transcript_recommendations_uncertain_trials ON transcript_recommendations USING GIN(uncertain_trials);
CREATE INDEX idx_patient_saved_trials_patient_id ON patient_saved_trials(patient_id);
CREATE INDEX idx_patient_saved_trials_priority ON patient_saved_trials(priority);

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clinical_trials_updated_at BEFORE UPDATE ON clinical_trials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transcript_recommendations_updated_at BEFORE UPDATE ON transcript_recommendations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patient_saved_trials_updated_at BEFORE UPDATE ON patient_saved_trials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create a profile record when someone signs up
-- Following the official Supabase pattern
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, first_name, last_name, role)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data ->> 'first_name',
        NEW.raw_user_meta_data ->> 'last_name',
        COALESCE(NEW.raw_user_meta_data ->> 'role', 'admin')
    );
    RETURN NEW;
END;
$$;

-- Trigger to automatically create user record on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update last_login timestamp
CREATE OR REPLACE FUNCTION public.handle_user_login()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles 
    SET last_login = NOW()
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Row Level Security (RLS) is disabled for MVP/testing purposes
-- Enable RLS in production by uncommenting the following lines:
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE clinical_trials ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE transcript_recommendations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE patient_saved_trials ENABLE ROW LEVEL SECURITY;

-- Add comments for documentation
COMMENT ON TABLE profiles IS 'Stores user profile information for admin and patient users';
COMMENT ON TABLE clinical_trials IS 'Stores clinical trial preview data (public table, no patient-specific data)';
COMMENT ON TABLE transcript_recommendations IS 'Stores organized trial recommendations per transcript (eligible vs uncertain)';
COMMENT ON TABLE patient_saved_trials IS 'Stores trials that patients have saved for later review';
COMMENT ON COLUMN profiles.role IS 'User role: admin (full access) or patient (limited access)';
COMMENT ON COLUMN clinical_trials.external_id IS 'ClinicalTrials.gov NCT ID or other registry identifier';
COMMENT ON COLUMN clinical_trials.brief_title IS 'Short title for trial display';
COMMENT ON COLUMN clinical_trials.status IS 'Trial recruitment status (RECRUITING, COMPLETED, etc.)';
COMMENT ON COLUMN clinical_trials.conditions IS 'Array of medical conditions the trial addresses';
COMMENT ON COLUMN clinical_trials.brief_summary IS 'Brief summary of the trial for preview display';
COMMENT ON COLUMN clinical_trials.locations IS 'Array of location strings (e.g., "City, State")';
COMMENT ON COLUMN transcript_recommendations.eligible_trials IS 'Array of clinical_trial IDs that are clearly eligible for the patient';
COMMENT ON COLUMN transcript_recommendations.uncertain_trials IS 'Array of clinical_trial IDs that need more review or clarification';
COMMENT ON COLUMN patient_saved_trials.priority IS 'Patient-assigned priority level (1=lowest, 5=highest)'; 