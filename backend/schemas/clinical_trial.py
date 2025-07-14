from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class GetClinicalTrialRecommendationsRequest(BaseModel):
    """API request for getting clinical trial recommendations"""
    patient_id: str
    transcript_id: str
    search_criteria: Optional[Dict[str, Any]] = None

class GetClinicalTrialRequest(BaseModel):
    """API request for getting a specific clinical trial"""
    trial_id: str

class ClinicalTrialPreviewResponse(BaseModel):
    """API response for clinical trial preview (list view)"""
    external_id: str
    title: str
    status: str
    conditions: List[str]
    sponsor: str
    phases: List[str]
    age_range: Optional[str] = None
    locations: str
    summary: Optional[str] = None
    interventions: List[str]
    enrollment_size: Optional[int] = None
    start_date: Optional[str] = None
    relevance_score: Optional[float] = None
    relevance_label: Optional[str] = None
    match_score: Optional[float] = None

class ClinicalTrialDetailedResponse(BaseModel):
    """API response for detailed clinical trial view"""
    # Preview fields
    external_id: str
    title: str
    status: str
    conditions: List[str]
    sponsor: str
    phases: List[str]
    age_range: Optional[str] = None
    locations: str
    summary: Optional[str] = None
    interventions: List[str]
    enrollment_size: Optional[int] = None
    start_date: Optional[str] = None
    relevance_score: Optional[float] = None
    relevance_label: Optional[str] = None
    match_score: Optional[float] = None
    
    # Detailed fields
    official_title: str
    detailed_description: Optional[str] = None
    study_type: Optional[str] = None
    primary_purpose: Optional[str] = None
    study_design: Optional[Dict[str, Any]] = None
    completion_date: Optional[str] = None
    primary_completion_date: Optional[str] = None
    eligibility_criteria: Optional[str] = None
    sex: Optional[str] = None
    healthy_volunteers: Optional[bool] = None
    standard_ages: List[str] = []
    arm_groups: List[Dict[str, Any]] = []
    primary_outcomes: List[Dict[str, Any]] = []
    secondary_outcomes: List[Dict[str, Any]] = []
    other_outcomes: List[Dict[str, Any]] = []
    central_contacts: List[Dict[str, Any]] = []
    overall_officials: List[Dict[str, Any]] = []
    collaborators: List[str] = []
    responsible_party_type: Optional[str] = None
    oversight_has_dmc: Optional[bool] = None
    is_fda_regulated_drug: Optional[bool] = None
    is_fda_regulated_device: Optional[bool] = None
    ipd_sharing: Optional[str] = None
    ipd_sharing_description: Optional[str] = None
    references: List[Dict[str, Any]] = []
    see_also_links: List[Dict[str, Any]] = []
    source_registry: str
    registry_version: Optional[str] = None
    last_updated: Optional[str] = None
    distance_to_patient: Optional[float] = None

class GetClinicalTrialRecommendationsResponse(BaseModel):
    """API response for clinical trial recommendations"""
    eligible_trials: List[ClinicalTrialPreviewResponse]
    uncertain_trials: List[ClinicalTrialPreviewResponse]
    total_eligible_count: int
    total_uncertain_count: int
    total_count: int
    search_criteria: Dict[str, Any]

class GetClinicalTrialResponse(BaseModel):
    """API response for a specific clinical trial"""
    trial: ClinicalTrialDetailedResponse 