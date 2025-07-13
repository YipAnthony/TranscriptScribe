class PatientNotFoundError(Exception):
    """Raised when a patient is not found in the database"""
    pass

class TranscriptNotFoundError(Exception):
    """Raised when a transcript is not found in the database"""
    pass

class TrialNotFoundError(Exception):
    """Raised when a clinical trial is not found"""
    pass 