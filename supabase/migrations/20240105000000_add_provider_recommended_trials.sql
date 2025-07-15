-- Create provider_recommended_trials table
CREATE TABLE provider_recommended_trials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    clinical_trial_id UUID NOT NULL REFERENCES clinical_trials(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(patient_id, clinical_trial_id)
);

-- Create indexes for better performance
CREATE INDEX idx_provider_recommended_trials_patient_id ON provider_recommended_trials(patient_id);
CREATE INDEX idx_provider_recommended_trials_clinical_trial_id ON provider_recommended_trials(clinical_trial_id);
CREATE INDEX idx_provider_recommended_trials_created_at ON provider_recommended_trials(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_provider_recommended_trials_updated_at 
    BEFORE UPDATE ON provider_recommended_trials 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 