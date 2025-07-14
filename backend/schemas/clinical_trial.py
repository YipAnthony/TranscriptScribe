from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class CreateClinicalTrialRecommendationsRequest(BaseModel):
    """API request for creating clinical trial recommendations"""
    patient_id: str
    transcript_id: str
    search_criteria: Optional[Dict[str, Any]] = None

class CreateClinicalTrialRecommendationsResponse(BaseModel):
    """API response for creating clinical trial recommendations"""
    status: str
    message: str

class GetClinicalTrialRequest(BaseModel):
    """API request for getting a specific clinical trial"""
    trial_id: str

class GetClinicalTrialResponse(BaseModel):
    """API response for a specific clinical trial"""
    status: str
    message: str 