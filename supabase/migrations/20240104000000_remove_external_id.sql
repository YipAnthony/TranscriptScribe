-- Migration to remove external_id column from patients table
-- This removes the external_id field since it's not being used in core business logic

-- Drop the index on external_id first
DROP INDEX IF EXISTS idx_patients_external_id;

-- Remove the external_id column from patients table
ALTER TABLE patients DROP COLUMN IF EXISTS external_id;

-- Update the updated_at trigger for patients (in case it was affected)
CREATE OR REPLACE TRIGGER update_patients_updated_at 
    BEFORE UPDATE ON patients 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 