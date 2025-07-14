"""
Integration tests for transcript processing flow
Tests real interactions between handlers, services, and adapters
Mocks external APIs (LLM, Database, CTG API) for controlled testing
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime
import uuid

from handlers.transcript import TranscriptHandler
from handlers.clinical_trial import ClinicalTrialHandler
from core.services.transcript_service import TranscriptService
from core.services.clinical_trial_service import ClinicalTrialService
from adapters.db.supabase import SupabaseAdapter
from adapters.llm.gemini import GeminiAdapter
from adapters.clinical_trials.ctg_v2_0_4 import CTGV2_0_4Adapter
from domain.patient import Patient
from domain.parsed_transcript import ParsedTranscript
from domain.clinical_trial import ClinicalTrial, SourceRegistry
from schemas.transcript import TranscriptUploadRequest, TranscriptResponse
from schemas.clinical_trial import (
    CreateClinicalTrialRecommendationsRequest,
    CreateClinicalTrialRecommendationsResponse,
    GetClinicalTrialRequest,
    GetClinicalTrialResponse
)


class TestTranscriptFlowIntegration:
    """Integration tests for the complete transcript processing flow"""
    
    @pytest.fixture
    def mock_llm_response(self):
        """Mock LLM response for transcript analysis"""
        return {
            "conditions": ["Type 2 Diabetes", "Hypertension"],
            "medications": ["Metformin", "Lisinopril"],
            "procedures": [],
            "age": 45,
            "sex": "MALE",
            "location": {
                "city": "New York",
                "state": "NY",
                "country": "USA",
                "zip_code": "10001"
            },
            "positive_symptoms": ["Fatigue", "Shortness of breath"],
            "negative_symptoms": ["Chest pain"],
            "positive_lab_results": ["Elevated blood glucose"],
            "negative_lab_results": ["Normal cholesterol"],
            "positive_imaging_results": [],
            "negative_imaging_results": [],
            "past_diagnoses": ["Type 2 Diabetes"],
            "past_surgeries": [],
            "family_history": ["Diabetes"],
            "positive_lifestyle_factors": [],
            "negative_lifestyle_factors": ["Sedentary lifestyle"],
            "extraction_notes": ["Patient shows signs of heart failure"]
        }
    
    @pytest.fixture
    def mock_patient(self):
        """Mock patient data"""
        return Patient(
            id="test-patient-123",
            first_name="John",
            last_name="Doe",
            date_of_birth=datetime(1978, 1, 1).date(),
            sex="MALE",
            address=None
        )
    
    @pytest.fixture
    def mock_clinical_trials(self):
        """Mock clinical trial data"""
        return [
            ClinicalTrial(
                external_id="NCT12345678",
                brief_title="Test Clinical Trial for Diabetes",
                official_title="A Phase 3 Study of Test Drug in Patients with Diabetes",
                status="RECRUITING",
                conditions=["Type 2 Diabetes"],
                sponsor_name="Test Pharmaceutical Company",
                phases=["PHASE_3"],
                minimum_age="18 years",
                maximum_age="75 years",
                brief_summary="This is a test clinical trial",
                detailed_description="Detailed description of the trial",
                study_type="INTERVENTIONAL",
                primary_purpose="TREATMENT",
                eligibility_criteria="Inclusion criteria...",
                sex="ALL",
                healthy_volunteers=False,
                standard_ages=["ADULT", "OLDER_ADULT"],
                source_registry=SourceRegistry.CLINICALTRIALS_GOV,
                registry_version="2.0.4"
            )
        ]
    
    @pytest.fixture
    def mock_adapters(self, mock_llm_response, mock_patient, mock_clinical_trials):
        """Create mocked adapters for integration testing"""
        # Mock LLM adapter
        mock_llm = Mock(spec=GeminiAdapter)
        mock_llm.call_llm_json.return_value = mock_llm_response
        mock_llm.health_check.return_value = True
        
        # Mock database adapter
        mock_db = Mock(spec=SupabaseAdapter)
        mock_db.create_transcript.return_value = "test-transcript-123"
        mock_db.get_transcript.return_value = ParsedTranscript(
            conditions=["Type 2 Diabetes", "Hypertension"],
            medications=["Metformin", "Lisinopril"],
            age=45,
            sex="MALE"
        )
        mock_db.get_patient.return_value = mock_patient
        
        # Mock clinical trials adapter
        mock_ctg = Mock(spec=CTGV2_0_4Adapter)
        mock_ctg.find_recommended_clinical_trials = AsyncMock(return_value=mock_clinical_trials)
        mock_ctg.get_clinical_trial = AsyncMock(return_value=mock_clinical_trials[0])
        
        return mock_llm, mock_db, mock_ctg
    
    @pytest.fixture
    def services(self, mock_adapters):
        """Create services with mocked adapters"""
        mock_llm, mock_db, mock_ctg = mock_adapters
        
        transcript_service = TranscriptService(
            db_adapter=mock_db,
            llm_adapter=mock_llm
        )
        
        clinical_trial_service = ClinicalTrialService(
            db_adapter=mock_db,
            clinical_trials_adapter=mock_ctg,
            llm_adapter=mock_llm
        )
        
        return transcript_service, clinical_trial_service
    
    @pytest.fixture
    def handlers(self, services):
        """Create handlers with services"""
        transcript_service, clinical_trial_service = services
        
        transcript_handler = TranscriptHandler(transcript_service)
        clinical_trial_handler = ClinicalTrialHandler(clinical_trial_service)
        
        return transcript_handler, clinical_trial_handler
    
    def test_transcript_processing_integration(self, handlers, mock_adapters):
        """Test complete transcript processing flow through handlers"""
        transcript_handler, _ = handlers
        mock_llm, mock_db, _ = mock_adapters
        
        # Create request
        request = TranscriptUploadRequest(
            patient_id="test-patient-123",
            raw_transcript="Patient reports fatigue and shortness of breath...",
            recorded_at=datetime.now()
        )
        
        # Process through handler
        response = transcript_handler.process_transcript(request)
        
        # Verify response
        assert response.status == "success"
        assert response.error is None
        
        # Verify LLM was called
        mock_llm.call_llm_json.assert_called_once()
        
        # Verify database was called
        mock_db.create_transcript.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_clinical_trial_recommendations_integration(self, handlers, mock_adapters):
        """Test clinical trial recommendations flow through handlers"""
        _, clinical_trial_handler = handlers
        mock_llm, mock_db, mock_ctg = mock_adapters
        
        # Create request
        request = CreateClinicalTrialRecommendationsRequest(
            patient_id="test-patient-123",
            transcript_id="test-transcript-123",
            search_criteria={"max_distance": 50}
        )
        
        # Mock the eligibility filter agent response
        mock_llm.call_llm_json.return_value = {
            "eligible_trial_ids": ["NCT12345678"],
            "uncertain_trial_ids": []
        }
        
        # Process through handler
        response = await clinical_trial_handler.handle_create_clinical_trial_recommendations(request)
        
        # Verify response structure
        assert isinstance(response, CreateClinicalTrialRecommendationsResponse)
        assert response.status == "success"
        assert "successfully" in response.message
        
        # Verify adapters were called
        mock_db.get_patient.assert_called_once_with("test-patient-123")
        mock_db.get_transcript.assert_called_once_with("test-transcript-123")
        mock_ctg.find_recommended_clinical_trials.assert_awaited_once()
        mock_db.upsert_clinical_trials.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_clinical_trial_details_integration(self, handlers, mock_adapters):
        """Test clinical trial details retrieval flow through handlers"""
        _, clinical_trial_handler = handlers
        mock_ctg = mock_adapters[2]
        
        # Create request
        request = GetClinicalTrialRequest(trial_id="NCT12345678")
        
        # Process through handler
        response = await clinical_trial_handler.handle_get_clinical_trial(request)
        
        # Verify response structure
        assert isinstance(response, GetClinicalTrialResponse)
        assert response.status == "success"
        assert "successfully" in response.message
        
        # Verify adapter was called
        mock_ctg.get_clinical_trial.assert_awaited_once_with("NCT12345678")
    
    def test_error_propagation_integration(self, handlers, mock_adapters):
        """Test error propagation through the stack"""
        transcript_handler, _ = handlers
        mock_llm, _, _ = mock_adapters
        
        # Make LLM fail
        mock_llm.call_llm_json.side_effect = Exception("LLM API error")
        
        # Create request
        request = TranscriptUploadRequest(
            patient_id="test-patient-123",
            raw_transcript="Patient reports fatigue...",
            recorded_at=datetime.now()
        )
        
        # Process through handler
        response = transcript_handler.process_transcript(request)
        
        # Verify error is properly handled
        assert response.status == "error"
        assert "LLM API error" in response.error
    
    @pytest.mark.asyncio
    async def test_service_layer_integration(self, services, mock_adapters):
        """Test direct service layer integration"""
        transcript_service, clinical_trial_service = services
        mock_llm, mock_db, mock_ctg = mock_adapters
        
        # Test transcript service
        transcript_id = transcript_service.process_raw_transcript(
            patient_id="test-patient-123",
            raw_transcript="Patient reports fatigue...",
            recorded_at=datetime.now().isoformat()
        )
        
        assert transcript_id == "test-transcript-123"
        mock_llm.call_llm_json.assert_called_once()
        mock_db.create_transcript.assert_called_once()
        
        # Test clinical trial service
        with patch.object(clinical_trial_service, '_eligibility_filter_agent', new_callable=AsyncMock) as mock_eligibility:
            with patch.object(clinical_trial_service, '_relevance_ranking_agent', new_callable=AsyncMock) as mock_relevance:
                mock_eligibility.return_value = {
                    "eligible_trial_ids": ["NCT12345678"],
                    "uncertain_trial_ids": []
                }
                mock_relevance.return_value = ["NCT12345678"]
                
                result = await clinical_trial_service.create_recommended_trials(
                    patient_id="test-patient-123",
                    transcript_id="test-transcript-123"
                )
                
                assert result is None 