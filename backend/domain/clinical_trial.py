from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class SourceRegistry(Enum):
    """Enum for clinical trial registries"""
    CLINICALTRIALS_GOV = "CLINICALTRIALS_GOV"
    EUCTR = "EUCTR"
    ISRCTN = "ISRCTN"

class Intervention:
    """Intervention details"""
    def __init__(self, 
                 type: str,
                 name: str,
                 description: Optional[str] = None):
        self.type = type
        self.name = name
        self.description = description

class Location:
    """Trial location details"""
    def __init__(self,
                 status: str,
                 facility: str,
                 city: str,
                 state: str,
                 country: str,
                 zip_code: Optional[str] = None,
                 latitude: Optional[float] = None,
                 longitude: Optional[float] = None):
        self.status = status
        self.facility = facility
        self.city = city
        self.state = state
        self.country = country
        self.zip_code = zip_code
        self.latitude = latitude
        self.longitude = longitude

class Contact:
    """Contact information"""
    def __init__(self,
                 name: str,
                 role: str,
                 affiliation: Optional[str] = None,
                 phone: Optional[str] = None,
                 email: Optional[str] = None):
        self.name = name
        self.role = role
        self.affiliation = affiliation
        self.phone = phone
        self.email = email

class Outcome:
    """Study outcome details"""
    def __init__(self,
                 measure: str,
                 description: str,
                 time_frame: str,
                 outcome_type: str):
        self.measure = measure
        self.description = description
        self.time_frame = time_frame
        self.outcome_type = outcome_type

# TODO: Refine fields later if i have time.
class ClinicalTrial:
    """Domain model for clinical trials with comprehensive fields for both preview and detailed views"""
    
    def __init__(self,
                 # Core identification fields
                 external_id: str,
                 brief_title: str,
                 official_title: str,
                 
                 # Preview list fields (essential for scrolling)
                 status: str,  # e.g., "RECRUITING", "COMPLETED", etc.
                 conditions: List[str],
                 sponsor_name: str,
                 phases: List[str],  # e.g., ["PHASE_3"], ["PHASE_1", "PHASE_2"]
                 minimum_age: Optional[str] = None,
                 maximum_age: Optional[str] = None,
                 locations: Optional[List[Location]] = None,
                 brief_summary: Optional[str] = None,
                 interventions: Optional[List[Intervention]] = None,
                 enrollment_count: Optional[int] = None,
                 start_date: Optional[datetime] = None,
                 
                 # Detailed view fields (for full trial information)
                 detailed_description: Optional[str] = None,
                 study_type: Optional[str] = None,  # e.g., "INTERVENTIONAL", "OBSERVATIONAL"
                 primary_purpose: Optional[str] = None,
                 study_design: Optional[Dict[str, Any]] = None,  # Generic dict for registry-specific data
                 completion_date: Optional[datetime] = None,
                 primary_completion_date: Optional[datetime] = None,
                 
                 # Eligibility details
                 eligibility_criteria: Optional[str] = None,
                 sex: Optional[str] = None,  # e.g., "ALL", "FEMALE", "MALE"
                 healthy_volunteers: Optional[bool] = None,
                 standard_ages: Optional[List[str]] = None,  # e.g., ["ADULT", "OLDER_ADULT"]
                 
                 # Interventions and arms - made generic
                 arm_groups: Optional[List[Dict[str, Any]]] = None,  # Generic dict for registry-specific arm data
                 
                 # Outcomes
                 primary_outcomes: Optional[List[Outcome]] = None,
                 secondary_outcomes: Optional[List[Outcome]] = None,
                 other_outcomes: Optional[List[Outcome]] = None,
                 
                 # Contacts
                 central_contacts: Optional[List[Contact]] = None,
                 overall_officials: Optional[List[Contact]] = None,
                 
                 # Source and version information
                 source_registry: SourceRegistry = SourceRegistry.CLINICALTRIALS_GOV,
                 registry_version: Optional[str] = None,  # Registry-specific version (e.g., "2.0.4" for CTG)
                 
                 # Additional metadata
                 last_updated: Optional[datetime] = None,
                 
                 # LLM-generated fields (optional enhancements)
                 relevance_score: Optional[float] = None,
                 relevance_label: Optional[str] = None,  # e.g., "Highly Relevant", "Possibly Eligible"
                 distance_to_patient: Optional[float] = None,  # in miles/km
                 match_score: Optional[float] = None):
        
        # Core identification
        self.external_id = external_id
        self.brief_title = brief_title
        self.official_title = official_title
        
        # Preview list fields
        self.status = status
        self.conditions = conditions or []
        self.sponsor_name = sponsor_name
        self.phases = phases or []
        self.minimum_age = minimum_age
        self.maximum_age = maximum_age
        self.locations = locations or []
        self.brief_summary = brief_summary
        self.interventions = interventions or []
        self.enrollment_count = enrollment_count
        self.start_date = start_date
        
        # Detailed view fields
        self.detailed_description = detailed_description
        self.study_type = study_type
        self.primary_purpose = primary_purpose
        self.study_design = study_design
        self.completion_date = completion_date
        self.primary_completion_date = primary_completion_date
        
        # Eligibility
        self.eligibility_criteria = eligibility_criteria
        self.sex = sex
        self.healthy_volunteers = healthy_volunteers
        self.standard_ages = standard_ages or []
        
        # Interventions and arms
        self.arm_groups = arm_groups or []
        
        # Outcomes
        self.primary_outcomes = primary_outcomes or []
        self.secondary_outcomes = secondary_outcomes or []
        self.other_outcomes = other_outcomes or []
        
        # Contacts
        self.central_contacts = central_contacts or []
        self.overall_officials = overall_officials or []
        
        # Source and version
        self.source_registry = source_registry
        self.registry_version = registry_version
        
        # Additional metadata
        self.last_updated = last_updated
        
        # LLM-generated fields
        self.relevance_score = relevance_score
        self.relevance_label = relevance_label
        self.distance_to_patient = distance_to_patient
        self.match_score = match_score
    
    def get_preview_data(self) -> Dict[str, Any]:
        """Get data suitable for preview list display"""
        return {
            "external_id": self.external_id,
            "title": self.brief_title,
            "status": self.status,
            "conditions": self.conditions,
            "sponsor": self.sponsor_name,
            "phases": self.phases,
            "age_range": self._format_age_range(),
            "locations": self._format_locations_preview(),
            "summary": self.brief_summary,
            "interventions": [intervention.name for intervention in self.interventions],
            "enrollment_size": self.enrollment_count,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "relevance_score": self.relevance_score,
            "relevance_label": self.relevance_label,
            "match_score": self.match_score
        }
    
    def get_detailed_data(self) -> Dict[str, Any]:
        """Get complete data for detailed view"""
        preview_data = self.get_preview_data()
        detailed_data = {
            **preview_data,
            "official_title": self.official_title,
            "detailed_description": self.detailed_description,
            "study_type": self.study_type,
            "primary_purpose": self.primary_purpose,
            "study_design": self.study_design,
            "completion_date": self.completion_date.isoformat() if self.completion_date else None,
            "primary_completion_date": self.primary_completion_date.isoformat() if self.primary_completion_date else None,
            "eligibility_criteria": self.eligibility_criteria,
            "sex": self.sex,
            "healthy_volunteers": self.healthy_volunteers,
            "standard_ages": self.standard_ages,
            "arm_groups": self.arm_groups,
            "primary_outcomes": [self._outcome_to_dict(outcome) for outcome in self.primary_outcomes],
            "secondary_outcomes": [self._outcome_to_dict(outcome) for outcome in self.secondary_outcomes],
            "other_outcomes": [self._outcome_to_dict(outcome) for outcome in self.other_outcomes],
            "central_contacts": [self._contact_to_dict(contact) for contact in self.central_contacts],
            "overall_officials": [self._contact_to_dict(contact) for contact in self.overall_officials],
            "source_registry": self.source_registry.value,
            "registry_version": self.registry_version,
            "last_updated": self.last_updated.isoformat() if self.last_updated else None,
            "distance_to_patient": self.distance_to_patient
        }
        return detailed_data
    
    def _format_age_range(self) -> Optional[str]:
        """Format age range for display"""
        if self.minimum_age and self.maximum_age:
            return f"{self.minimum_age} - {self.maximum_age}"
        elif self.minimum_age:
            return f"{self.minimum_age}+"
        elif self.maximum_age:
            return f"Up to {self.maximum_age}"
        return None
    
    def _format_locations_preview(self) -> str:
        """Format locations for preview display"""
        if not self.locations:
            return "No locations specified"
        
        if len(self.locations) == 1:
            loc = self.locations[0]
            return f"{loc.city}, {loc.state}"
        elif len(self.locations) <= 3:
            location_strings = [f"{loc.city}, {loc.state}" for loc in self.locations[:3]]
            return " and ".join(location_strings)
        else:
            first_loc = self.locations[0]
            return f"{first_loc.city}, {first_loc.state} and {len(self.locations) - 1} more"
    
    def _outcome_to_dict(self, outcome: Outcome) -> Dict[str, Any]:
        """Convert outcome to dictionary"""
        return {
            "measure": outcome.measure,
            "description": outcome.description,
            "time_frame": outcome.time_frame,
            "outcome_type": outcome.outcome_type
        }
    
    def _contact_to_dict(self, contact: Contact) -> Dict[str, Any]:
        """Convert contact to dictionary"""
        return {
            "name": contact.name,
            "role": contact.role,
            "affiliation": contact.affiliation,
            "phone": contact.phone,
            "email": contact.email
        } 