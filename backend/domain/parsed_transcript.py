from typing import List, Optional
from domain.address import Address

class ParsedTranscript:
    def __init__(self,
                 # Core medical information
                 conditions: Optional[List[str]] = None,
                 medications: Optional[List[str]] = None,
                 procedures: Optional[List[str]] = None,
                 
                 # Demographics
                 age: Optional[int] = None,
                 sex: Optional[str] = None,  # 'MALE', 'FEMALE'
                 
                 # Location
                 location: Optional[Address] = None,
                 
                 # Comprehensive medical record (for downstream analysis)
                 positive_symptoms: Optional[List[str]] = None,
                 negative_symptoms: Optional[List[str]] = None,
                 
                 positive_lab_results: Optional[List[str]] = None,
                 negative_lab_results: Optional[List[str]] = None,
                 
                 positive_imaging_results: Optional[List[str]] = None,
                 negative_imaging_results: Optional[List[str]] = None,
                 
                 past_diagnoses: Optional[List[str]] = None,
                 past_surgeries: Optional[List[str]] = None,
                 family_history: Optional[List[str]] = None,
                 
                 positive_lifestyle_factors: Optional[List[str]] = None,
                 negative_lifestyle_factors: Optional[List[str]] = None,
                 
                 # Metadata
                 extraction_notes: Optional[List[str]] = None):
        
        # Initialize with defaults
        self.conditions = conditions or []
        self.medications = medications or []
        self.procedures = procedures or []
        self.age = age
        self.sex = sex
        self.location = location
        
        # Comprehensive medical record
        self.positive_symptoms = positive_symptoms or []
        self.negative_symptoms = negative_symptoms or []
        self.positive_lab_results = positive_lab_results or []
        self.negative_lab_results = negative_lab_results or []
        self.positive_imaging_results = positive_imaging_results or []
        self.negative_imaging_results = negative_imaging_results or []
        self.past_diagnoses = past_diagnoses or []
        self.past_surgeries = past_surgeries or []
        self.family_history = family_history or []
        self.positive_lifestyle_factors = positive_lifestyle_factors or []
        self.negative_lifestyle_factors = negative_lifestyle_factors or []
        
        # Metadata
        self.extraction_notes = extraction_notes or []
    
    def get_medical_profile(self) -> dict:
        """Get comprehensive medical profile for downstream analysis"""
        return {
            "core_medical": {
                "conditions": self.conditions,
                "medications": self.medications,
                "procedures": self.procedures
            },
            "demographics": {
                "age": self.age,
                "sex": self.sex,
                "location": self.location
            },
            "symptoms": {
                "positive": self.positive_symptoms,
                "negative": self.negative_symptoms
            },
            "lab_results": {
                "positive": self.positive_lab_results,
                "negative": self.negative_lab_results
            },
            "imaging_results": {
                "positive": self.positive_imaging_results,
                "negative": self.negative_imaging_results
            },
            "medical_history": {
                "diagnoses": self.past_diagnoses,
                "surgeries": self.past_surgeries
            },
            "family_history": self.family_history,
            "lifestyle_factors": {
                "positive": self.positive_lifestyle_factors,
                "negative": self.negative_lifestyle_factors
            },
            "metadata": {
                "extraction_notes": self.extraction_notes
            }
        }
    
    def __str__(self) -> str:
        return f"ParsedTranscript(conditions={len(self.conditions)}, medications={len(self.medications)}, procedures={len(self.procedures)}, age={self.age}, sex={self.sex})"
    
    def __repr__(self) -> str:
        return self.__str__() 