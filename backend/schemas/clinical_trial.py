from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

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

class ClinicalTrialData(BaseModel):
    """Clinical trial data for API responses"""
    external_id: str
    brief_title: str
    official_title: Optional[str] = None
    status: str
    conditions: List[str] = []
    sponsor_name: Optional[str] = None
    phases: List[str] = []
    minimum_age: Optional[str] = None
    maximum_age: Optional[str] = None
    locations: List[str] = []
    brief_summary: Optional[str] = None
    detailed_description: Optional[str] = None
    study_type: Optional[str] = None
    primary_purpose: Optional[str] = None
    enrollment_count: Optional[int] = None
    start_date: Optional[datetime] = None
    completion_date: Optional[datetime] = None
    primary_completion_date: Optional[datetime] = None
    eligibility_criteria: Optional[str] = None
    sex: Optional[str] = None
    healthy_volunteers: Optional[bool] = None
    standard_ages: List[str] = []
    interventions: List[Dict[str, Any]] = []
    primary_outcomes: List[Dict[str, Any]] = []
    secondary_outcomes: List[Dict[str, Any]] = []
    central_contacts: List[Dict[str, Any]] = []
    overall_officials: List[Dict[str, Any]] = []
    source_registry: Optional[str] = None
    registry_version: Optional[str] = None
    last_updated: Optional[datetime] = None

class GetClinicalTrialResponse(BaseModel):
    """API response for a specific clinical trial"""
    status: str
    message: str
    trial: Optional[ClinicalTrialData] = None 