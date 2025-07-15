-- Add status column to provider_recommended_trials table
-- This allows tracking whether recommendations are pending, accepted, or rejected

-- Add status column with default value 'pending'
ALTER TABLE provider_recommended_trials 
ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected'));

-- Create index for better performance on status queries
CREATE INDEX idx_provider_recommended_trials_status ON provider_recommended_trials(status);

-- Add comment for documentation
COMMENT ON COLUMN provider_recommended_trials.status IS 'Status of the recommendation: pending (default), accepted (patient saved), or rejected (patient dismissed)';

-- Update the existing trigger to include the new column
-- (The existing trigger will automatically handle the updated_at column) 