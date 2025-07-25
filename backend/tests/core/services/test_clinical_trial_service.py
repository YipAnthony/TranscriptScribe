import pytest
from unittest.mock import Mock, patch, MagicMock, AsyncMock
from typing import List
from datetime import date
from domain.patient import Patient
from domain.parsed_transcript import ParsedTranscript
from domain.clinical_trial import ClinicalTrial, SourceRegistry
from core.services.clinical_trial_service import ClinicalTrialService
from domain.exceptions import PatientNotFoundError, TranscriptNotFoundError


class TestClinicalTrialService:
    """Test cases for ClinicalTrialService"""
    
    @pytest.fixture
    def mock_db_adapter(self) -> Mock:
        """Mock database adapter"""
        return Mock()
    
    @pytest.fixture
    def mock_clinical_trials_adapter(self) -> Mock:
        """Mock clinical trials adapter"""
        return Mock()
    
    @pytest.fixture
    def mock_llm_adapter(self) -> Mock:
        """Mock LLM adapter"""
        return Mock()
    
    @pytest.fixture
    def clinical_trial_service(self, mock_db_adapter: Mock, mock_clinical_trials_adapter: Mock, mock_llm_adapter: Mock) -> ClinicalTrialService:
        """Create ClinicalTrialService instance for testing"""
        return ClinicalTrialService(
            db_adapter=mock_db_adapter,
            clinical_trials_adapter=mock_clinical_trials_adapter,
            llm_adapter=mock_llm_adapter
        )
    
    @pytest.fixture
    def sample_patient(self) -> Patient:
        """Sample patient for testing"""
        return Patient(
            id="patient-123",
            first_name="John",
            last_name="Doe",
            date_of_birth=date(1980, 1, 1),
            sex="MALE",
            city="New York",
            state="NY",
            country="USA"
        )
    
    @pytest.fixture
    def sample_transcript(self) -> ParsedTranscript:
        """Sample parsed transcript for testing"""
        return ParsedTranscript(
            conditions=["Diabetes", "Hypertension"],
            medications=["Metformin", "Lisinopril"],
            procedures=["Blood glucose monitoring"],
            age=43,
            sex="MALE",
            positive_symptoms=["Fatigue", "Increased thirst"],
            past_diagnoses=["Type 2 Diabetes"]
        )
    
    @pytest.fixture
    def sample_trials(self) -> List[ClinicalTrial]:
        """Sample clinical trials for testing"""
        return [
            ClinicalTrial(
                external_id="NCT12345678",
                brief_title="Study of New Diabetes Treatment",
                official_title="A Phase 3 Study of Novel Diabetes Treatment",
                status="RECRUITING",
                conditions=["Diabetes"],
                sponsor_name="PharmaCorp",
                phases=["PHASE_3"],
                brief_summary="This study evaluates a new treatment for diabetes",
                eligibility_criteria="Age 18-65, diagnosed with Type 2 Diabetes"
            ),
            ClinicalTrial(
                external_id="NCT87654321",
                brief_title="Hypertension Management Study",
                official_title="Management of Hypertension in Adults",
                status="RECRUITING",
                conditions=["Hypertension"],
                sponsor_name="MedResearch",
                phases=["PHASE_2"],
                brief_summary="Study of hypertension management strategies",
                eligibility_criteria="Age 18+, diagnosed with hypertension"
            ),
            ClinicalTrial(
                external_id="NCT11111111",
                brief_title="Completed Heart Study",
                official_title="Completed Study of Heart Disease",
                status="COMPLETED",
                conditions=["Heart Disease"],
                sponsor_name="CardioCorp",
                phases=["PHASE_1"],
                brief_summary="This study has been completed",
                eligibility_criteria="Age 18+"
            )
        ]
    
    @pytest.mark.asyncio
    async def test_create_recommended_trials_success(self, clinical_trial_service: ClinicalTrialService, 
                                           mock_db_adapter: Mock, mock_clinical_trials_adapter: Mock, 
                                           mock_llm_adapter: Mock, sample_patient: Patient, 
                                           sample_transcript: ParsedTranscript, sample_trials: List[ClinicalTrial]) -> None:
        """Test successful create_recommended_trials with multi-agent approach"""
        # Setup mocks for eligibility filter agent and relevance ranking agents
        # Return 2 trials as eligible and 1 as uncertain (matching the sample_trials length)
        mock_llm_adapter.call_llm_json.side_effect = [
            {"eligible_trial_ids": ["NCT12345678", "NCT87654321"], "uncertain_trial_ids": ["NCT11111111"]},  # Agent 1 response
            {"ranked_trial_ids": ["NCT12345678", "NCT87654321"]},  # Agent 2 response for eligible trials
            {"ranked_trial_ids": ["NCT11111111"]}   # Agent 2 response for uncertain trials
        ]
        
        mock_db_adapter.get_patient.return_value = sample_patient
        mock_db_adapter.get_transcript.return_value = sample_transcript
        mock_clinical_trials_adapter.find_recommended_clinical_trials = AsyncMock(return_value=sample_trials)
        
        # Call the method
        result = await clinical_trial_service.create_recommended_trials("patient-123", "transcript-456")
        
        # Verify result is None
        assert result is None
        
        # Verify mocks were called correctly
        mock_db_adapter.get_patient.assert_called_once_with("patient-123")
        mock_db_adapter.get_transcript.assert_called_once_with("transcript-456")
        mock_clinical_trials_adapter.find_recommended_clinical_trials.assert_awaited_once_with(sample_patient, sample_transcript)
        
        # Verify that all 3 trials were stored (2 eligible + 1 uncertain)
        mock_db_adapter.upsert_clinical_trials.assert_called_once_with(sample_trials)
        assert mock_llm_adapter.call_llm_json.call_count == 3  # Called 3 times: Agent 1 + Agent 2 (eligible) + Agent 2 (uncertain)
    
    @pytest.mark.asyncio
    async def test_create_recommended_trials_no_initial_trials(self, clinical_trial_service: ClinicalTrialService,
                                                     mock_db_adapter: Mock, mock_clinical_trials_adapter: Mock,
                                                     sample_patient: Patient, sample_transcript: ParsedTranscript) -> None:
        """Test create_recommended_trials when no initial trials are found"""
        # Setup mocks
        mock_db_adapter.get_patient.return_value = sample_patient
        mock_db_adapter.get_transcript.return_value = sample_transcript
        mock_clinical_trials_adapter.find_recommended_clinical_trials = AsyncMock(return_value=[])
        
        # Call the method
        result = await clinical_trial_service.create_recommended_trials("patient-123", "transcript-456")
        
        # Verify result is None
        assert result is None
        
        # Verify LLM was not called since no trials were found
        mock_clinical_trials_adapter.find_recommended_clinical_trials.assert_awaited_once()
    
    @pytest.mark.asyncio
    async def test_create_recommended_trials_patient_not_found(self, clinical_trial_service: ClinicalTrialService,
                                                     mock_db_adapter: Mock) -> None:
        """Test create_recommended_trials when patient is not found"""
        # Setup mock to raise exception
        mock_db_adapter.get_patient.side_effect = PatientNotFoundError("Patient not found")
        
        # Call the method and expect exception
        with pytest.raises(PatientNotFoundError, match="Patient not found"):
            await clinical_trial_service.create_recommended_trials("patient-123", "transcript-456")
    
    @pytest.mark.asyncio
    async def test_create_recommended_trials_transcript_not_found(self, clinical_trial_service: ClinicalTrialService,
                                                        mock_db_adapter: Mock, sample_patient: Patient) -> None:
        """Test create_recommended_trials when transcript is not found"""
        # Setup mocks
        mock_db_adapter.get_patient.return_value = sample_patient
        mock_db_adapter.get_transcript.side_effect = TranscriptNotFoundError("Transcript not found")
        
        # Call the method and expect exception
        with pytest.raises(TranscriptNotFoundError, match="Transcript not found"):
            await clinical_trial_service.create_recommended_trials("patient-123", "transcript-456")
    
    @pytest.mark.asyncio
    async def test_create_recommended_trials_llm_failure_fallback(self, clinical_trial_service: ClinicalTrialService,
                                                        mock_db_adapter: Mock, mock_clinical_trials_adapter: Mock,
                                                        mock_llm_adapter: Mock, sample_patient: Patient,
                                                        sample_transcript: ParsedTranscript, sample_trials: List[ClinicalTrial]) -> None:
        """Test create_recommended_trials when LLM fails and falls back to excluding all trials"""
        # Setup mocks
        mock_db_adapter.get_patient.return_value = sample_patient
        mock_db_adapter.get_transcript.return_value = sample_transcript
        mock_clinical_trials_adapter.find_recommended_clinical_trials = AsyncMock(return_value=sample_trials)
        mock_llm_adapter.call_llm_json.side_effect = Exception("LLM API Error")
        
        # Call the method
        result = await clinical_trial_service.create_recommended_trials("patient-123", "transcript-456")
        
        # Verify result is None
        assert result is None
    
    @pytest.mark.asyncio
    async def test_create_recommended_trials_llm_unexpected_response(self, clinical_trial_service: ClinicalTrialService,
                                                           mock_db_adapter: Mock, mock_clinical_trials_adapter: Mock,
                                                           mock_llm_adapter: Mock, sample_patient: Patient,
                                                           sample_transcript: ParsedTranscript, sample_trials: List[ClinicalTrial]) -> None:
        """Test create_recommended_trials when LLM returns unexpected response format"""
        # Setup mocks
        mock_db_adapter.get_patient.return_value = sample_patient
        mock_db_adapter.get_transcript.return_value = sample_transcript
        mock_clinical_trials_adapter.find_recommended_clinical_trials = AsyncMock(return_value=sample_trials)
        mock_llm_adapter.call_llm_json.return_value = {"unexpected": "format"}
        
        # Call the method
        result = await clinical_trial_service.create_recommended_trials("patient-123", "transcript-456")
        
        # Verify result is None
        assert result is None
    
    @pytest.mark.asyncio
    async def test_create_recommended_trials_llm_empty_response(self, clinical_trial_service: ClinicalTrialService,
                                                      mock_db_adapter: Mock, mock_clinical_trials_adapter: Mock,
                                                      mock_llm_adapter: Mock, sample_patient: Patient,
                                                      sample_transcript: ParsedTranscript, sample_trials: List[ClinicalTrial]) -> None:
        """Test create_recommended_trials when LLM returns empty relevant trials"""
        # Setup mocks
        mock_db_adapter.get_patient.return_value = sample_patient
        mock_db_adapter.get_transcript.return_value = sample_transcript
        mock_clinical_trials_adapter.find_recommended_clinical_trials = AsyncMock(return_value=sample_trials)
        mock_llm_adapter.call_llm_json.return_value = {"eligible_trial_ids": [], "uncertain_trial_ids": []}
        
        # Call the method
        result = await clinical_trial_service.create_recommended_trials("patient-123", "transcript-456")
        
        # Verify result is None
        assert result is None
    
    @pytest.mark.asyncio
    async def test_get_clinical_trial(self, clinical_trial_service: ClinicalTrialService,
                               mock_db_adapter: Mock, mock_clinical_trials_adapter: Mock, sample_trials: List[ClinicalTrial]) -> None:
        """Test get_clinical_trial method with internal id lookup"""
        # Setup mock: db_adapter returns the trial for internal id (sync)
        mock_db_adapter.get_clinical_trial.return_value = sample_trials[0]
        # clinical_trials_adapter returns the trial for external_id (async)
        mock_clinical_trials_adapter.get_clinical_trial = AsyncMock(return_value=sample_trials[0])

        # Call the method with internal id
        result = await clinical_trial_service.get_clinical_trial("internal-uuid-123")

        # Verify result
        assert result == sample_trials[0]
        mock_db_adapter.get_clinical_trial.assert_called_once_with("internal-uuid-123")
        mock_clinical_trials_adapter.get_clinical_trial.assert_awaited_once_with("NCT12345678")
    
    @pytest.mark.asyncio
    async def test_eligibility_filter_agent(self, clinical_trial_service: ClinicalTrialService,
                                    mock_llm_adapter: Mock, sample_patient: Patient,
                                    sample_transcript: ParsedTranscript, sample_trials: List[ClinicalTrial]) -> None:
        """Test eligibility filter agent"""
        # Setup mock
        mock_llm_adapter.call_llm_json.return_value = {
            "eligible_trial_ids": ["NCT12345678"],
            "uncertain_trial_ids": ["NCT87654321"]
        }
        
        # Call the method
        result = await clinical_trial_service._eligibility_filter_agent(sample_patient, sample_transcript, sample_trials)
        
        # Verify result
        assert result == {
            "eligible_trial_ids": ["NCT12345678"],
            "uncertain_trial_ids": ["NCT87654321"]
        }
        mock_llm_adapter.call_llm_json.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_relevance_ranking_agent(self, clinical_trial_service: ClinicalTrialService,
                                   mock_llm_adapter: Mock, sample_patient: Patient,
                                   sample_transcript: ParsedTranscript, sample_trials: List[ClinicalTrial]) -> None:
        """Test relevance ranking agent"""
        # Setup mock
        mock_llm_adapter.call_llm_json.return_value = {
            "ranked_trial_ids": ["NCT12345678", "NCT87654321"]
        }
        
        eligible_trial_ids = ["NCT12345678", "NCT87654321"]
        
        # Call the method
        result = await clinical_trial_service._relevance_ranking_agent(sample_patient, sample_transcript, sample_trials, eligible_trial_ids, "eligible")
        
        # Verify result
        assert result == ["NCT12345678", "NCT87654321"]
        mock_llm_adapter.call_llm_json.assert_called_once()
    
    def test_create_comprehensive_patient_info(self, clinical_trial_service: ClinicalTrialService,
                                             sample_patient: Patient, sample_transcript: ParsedTranscript) -> None:
        """Test create_comprehensive_patient_info method"""
        # Call the method
        result = clinical_trial_service._create_comprehensive_patient_info(sample_patient, sample_transcript)
        
        # Verify result contains expected information
        assert "John Doe" in result
        assert "Diabetes" in result
        assert "Metformin" in result
        assert "Fatigue" in result
        assert "Type 2 Diabetes" in result 