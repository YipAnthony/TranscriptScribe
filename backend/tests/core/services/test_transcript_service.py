import pytest
from unittest.mock import Mock
from core.services.transcript_service import TranscriptService
from domain.parsed_transcript import ParsedTranscript
from ports.db import DatabasePort
from ports.llm import LLMPort

class DummyDBAdapter(DatabasePort):
    def create_transcript(self, patient_id, parsed_transcript, recorded_at=None):
        return "transcript-123"
    def get_transcript(self, transcript_id):
        return ParsedTranscript(conditions=["test"], medications=["testmed"], procedures=["testproc"])
    def get_patient(self, patient_id):
        pass
    def update_patient(self, patient_id, **kwargs):
        pass
    def create_patient(self, patient):
        pass
    def get_all_patients(self):
        pass
    def create_clinical_trial(self, *args, **kwargs):
        pass
    def get_clinical_trial(self, *args, **kwargs):
        pass
    def get_all_clinical_trials(self):
        pass
    def update_clinical_trial(self, *args, **kwargs):
        pass
    def delete_clinical_trial(self, *args, **kwargs):
        pass
    def update_transcript_status(self, transcript_id, status):
        pass
    def update_parsed_transcript(self, transcript_id, parsed_transcript):
        pass
    def delete_transcript(self, transcript_id):
        pass
    def upsert_clinical_trial(self, clinical_trial):
        return "trial-123"
    def upsert_clinical_trials(self, clinical_trials):
        return len(clinical_trials)
    def create_transcript_recommendations(self, transcript_id, eligible_trial_ids, uncertain_trial_ids):
        return "recommendations-123"
    def update_transcript_recommendations(self, transcript_id, eligible_trial_ids, uncertain_trial_ids):
        pass
    def get_transcript_recommendations(self, transcript_id):
        return None
    # Add missing abstract methods for chat
    def get_chat_session(self, session_id):
        pass
    def get_chat_messages(self, session_id, limit=4):
        return []
    def create_chat_message(self, session_id, sender, message, created_at, metadata={}):
        pass

class DummyLLMAdapter(LLMPort):
    def call_llm_json(self, prompt, temperature=0.1, max_tokens=4096):
        # Return a fake parsed transcript dict
        return {
            "conditions": ["Diabetes"],
            "medications": ["Metformin"],
            "procedures": ["Blood Test"],
            "age": 50,
            "sex": "MALE",
            "location": {"city": "New York", "state": "NY", "country": "USA", "zip_code": "10001"},
            "positive_symptoms": ["Fatigue"],
            "negative_symptoms": [],
            "positive_lab_results": [],
            "negative_lab_results": [],
            "positive_imaging_results": [],
            "negative_imaging_results": [],
            "past_diagnoses": [],
            "past_surgeries": [],
            "family_history": [],
            "positive_lifestyle_factors": [],
            "negative_lifestyle_factors": [],
            "extraction_notes": []
        }
    def call_llm(self, prompt, **kwargs):
        pass
    def health_check(self):
        return True

def test_process_raw_transcript_success():
    db_adapter = DummyDBAdapter()
    llm_adapter = DummyLLMAdapter()
    service = TranscriptService(db_adapter=db_adapter, llm_adapter=llm_adapter)
    transcript_id = service.process_raw_transcript("patient-1", "This is a transcript.")
    assert transcript_id == "transcript-123"

def test_process_raw_transcript_error(monkeypatch):
    db_adapter = DummyDBAdapter()
    llm_adapter = DummyLLMAdapter()
    service = TranscriptService(db_adapter=db_adapter, llm_adapter=llm_adapter)
    # Patch the LLM adapter to raise an error
    def fail_call_llm_json(*args, **kwargs):
        raise Exception("LLM error")
    service.llm_adapter.call_llm_json = fail_call_llm_json
    with pytest.raises(Exception):
        service.process_raw_transcript("patient-1", "This is a transcript.")

def test_get_transcript():
    db_adapter = DummyDBAdapter()
    llm_adapter = DummyLLMAdapter()
    service = TranscriptService(db_adapter=db_adapter, llm_adapter=llm_adapter)
    parsed = service.get_transcript("transcript-123")
    assert isinstance(parsed, ParsedTranscript)
    assert parsed.conditions == ["test"]

def test_generate_fake_transcript_success():
    db_adapter = DummyDBAdapter()
    llm_adapter = DummyLLMAdapter()
    service = TranscriptService(db_adapter=db_adapter, llm_adapter=llm_adapter)
    
    # Mock the LLM response for fake transcript generation
    def mock_call_llm(prompt, **kwargs):
        mock_response = Mock()
        mock_response.content = "**Dr. Smith:** Good morning, John. How have you been feeling?\n\n**John Doe:** Good morning, Doctor. I've been doing well..."
        return mock_response
    
    service.llm_adapter.call_llm = mock_call_llm
    
    # Mock patient data
    from domain.patient import Patient
    from datetime import date
    
    def mock_get_patient(patient_id):
        return Patient(
            id="patient-1",
            first_name="John",
            last_name="Doe",
            date_of_birth=date(1980, 1, 1),
            sex="MALE",
            city="New York",
            state="NY"
        )
    
    service.db_adapter.get_patient = mock_get_patient
    
    result = service.generate_fake_transcript("patient-1")
    assert isinstance(result, str)
    assert "Dr. Smith" in result
    assert "John Doe" in result 