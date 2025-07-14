import pytest
from unittest.mock import Mock, patch, AsyncMock
from typing import Dict, Any
import httpx
from adapters.clinical_trials.ctg_v2_0_4 import CTGV2_0_4Adapter
from domain.patient import Patient
from domain.parsed_transcript import ParsedTranscript
from domain.clinical_trial import ClinicalTrial, SourceRegistry


class TestCTGV2_0_4Adapter:
    """Test cases for CTGV2_0_4Adapter"""
    
    @pytest.fixture
    def sample_trial_data(self) -> Dict[str, Any]:
        """Sample trial data from CTG API"""
        return {
            "protocolSection": {
                "identificationModule": {
                    "nctId": "NCT12345678",
                    "briefTitle": "Test Clinical Trial",
                    "officialTitle": "A Phase 3 Study of Test Drug in Patients"
                },
                "statusModule": {
                    "overallStatus": "RECRUITING",
                    "startDateStruct": {
                        "date": "2023-01-15"
                    },
                    "studyType": "INTERVENTIONAL",
                    "primaryPurpose": "TREATMENT"
                },
                "sponsorModule": {
                    "leadSponsor": {
                        "leadSponsorName": "Test Pharmaceutical Company"
                    }
                },
                "descriptionModule": {
                    "briefSummary": "This is a test clinical trial",
                    "detailedDescription": "Detailed description of the trial"
                },
                "conditionsModule": {
                    "conditions": ["Diabetes", "Hypertension"]
                },
                "armsInterventionsModule": {
                    "phaseInfo": [
                        {"phase": "PHASE_3"}
                    ],
                    "interventions": [
                        {
                            "type": "DRUG",
                            "name": "Test Drug",
                            "description": "Experimental drug"
                        }
                    ]
                },
                "eligibilityModule": {
                    "minimumAge": "18 years",
                    "maximumAge": "75 years",
                    "enrollmentCount": "100",
                    "eligibilityCriteria": "Inclusion criteria...",
                    "sex": "ALL",
                    "healthyVolunteers": "No",
                    "standardAges": ["ADULT", "OLDER_ADULT"]
                },
                "contactsLocationsModule": {
                    "locations": [
                        {
                            "status": "RECRUITING",
                            "facility": "Test Hospital",
                            "city": "New York",
                            "state": "NY",
                            "country": "United States",
                            "zip": "10001"
                        }
                    ]
                },
                "outcomesModule": {
                    "primaryOutcomes": [],
                    "secondaryOutcomes": []
                }
            }
        }
    
    @pytest.fixture
    def sample_patient(self) -> Patient:
        """Sample patient for testing"""
        return Patient(
            id="patient123",
            first_name="John",
            last_name="Doe",
            sex="MALE",
            address=None
        )
    
    @pytest.fixture
    def sample_parsed_transcript(self) -> ParsedTranscript:
        """Sample parsed transcript for testing"""
        return ParsedTranscript(
            conditions=["Diabetes", "Hypertension"],
            medications=["Metformin", "Lisinopril"],
            procedures=[],
            age=45,
            sex="MALE",
            location=None,
            positive_symptoms=["Fatigue", "Increased thirst"],
            negative_symptoms=[],
            positive_lab_results=[],
            negative_lab_results=[],
            positive_imaging_results=[],
            negative_imaging_results=[],
            past_diagnoses=[],
            past_surgeries=[],
            family_history=[],
            positive_lifestyle_factors=[],
            negative_lifestyle_factors=[],
            extraction_notes=[]
        )
    
    @pytest.fixture
    async def ctg_adapter(self):
        """Create CTG adapter instance for testing"""
        adapter = CTGV2_0_4Adapter(timeout=10)
        yield adapter
        try:
            await adapter.client.aclose()
        except RuntimeError:
            # Event loop is closed, which is expected in some test scenarios
            pass
    
    def test_init(self):
        """Test adapter initialization"""
        adapter = CTGV2_0_4Adapter()
        assert adapter.timeout == 30
        assert adapter.client is not None
        assert adapter.VERSION == "2.0.4"
        assert adapter.SOURCE_REGISTRY == SourceRegistry.CLINICALTRIALS_GOV
        assert adapter.BASE_URL == "https://beta-ut.clinicaltrials.gov/api/v2"
    
    @pytest.mark.asyncio
    async def test_find_recommended_clinical_trials_async_success(self, ctg_adapter, sample_patient, sample_parsed_transcript, sample_trial_data):
        """Test successful async clinical trial search"""
        # Mock the HTTP response
        mock_response = Mock()
        mock_response.json.return_value = {"studies": [sample_trial_data]}
        
        with patch.object(ctg_adapter.client, 'get', new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_response
            
            result = await ctg_adapter.find_recommended_clinical_trials(sample_patient, sample_parsed_transcript)
            
            # Verify result
            assert len(result) == 1
            assert isinstance(result[0], ClinicalTrial)
            assert result[0].external_id == "NCT12345678"
            assert result[0].brief_title == "Test Clinical Trial"
            assert result[0].status == "RECRUITING"
            assert result[0].conditions == ["Diabetes", "Hypertension"]
            assert result[0].sponsor_name == "Test Pharmaceutical Company"
            assert result[0].phases == ["PHASE_3"]
            
            # Verify API call
            mock_get.assert_called_once()
            call_args = mock_get.call_args
            assert "studies" in call_args[0][0]  # URL contains studies endpoint
    
    @pytest.mark.asyncio
    async def test_find_recommended_clinical_trials_async_no_results(self, ctg_adapter, sample_patient, sample_parsed_transcript):
        """Test async search with no results"""
        # Mock empty response
        mock_response = Mock()
        mock_response.json.return_value = {"studies": []}
        
        with patch.object(ctg_adapter.client, 'get', new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_response
            
            result = await ctg_adapter.find_recommended_clinical_trials(sample_patient, sample_parsed_transcript)
            
            assert result == []
    
    @pytest.mark.asyncio
    async def test_find_recommended_clinical_trials_async_http_error(self, ctg_adapter, sample_patient, sample_parsed_transcript):
        """Test async search with HTTP error"""
        with patch.object(ctg_adapter.client, 'get', new_callable=AsyncMock) as mock_get:
            mock_get.side_effect = httpx.HTTPStatusError("404 Not Found", request=Mock(), response=Mock())
            
            result = await ctg_adapter.find_recommended_clinical_trials(sample_patient, sample_parsed_transcript)
            
            assert result == []
    
    @pytest.mark.asyncio
    async def test_get_clinical_trial_async_success(self, ctg_adapter, sample_trial_data):
        """Test successful async trial retrieval"""
        # Mock the HTTP response
        mock_response = Mock()
        mock_response.json.return_value = {"studies": [sample_trial_data]}
        
        with patch.object(ctg_adapter.client, 'get', new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_response
            
            result = await ctg_adapter.get_clinical_trial("NCT12345678")
            
            # Verify result
            assert isinstance(result, ClinicalTrial)
            assert result.external_id == "NCT12345678"
            assert result.brief_title == "Test Clinical Trial"
            
            # Verify API call
            mock_get.assert_called_once()
            call_args = mock_get.call_args
            assert "studies" in call_args[0][0]  # URL contains studies endpoint
    
    @pytest.mark.asyncio
    async def test_get_clinical_trial_async_not_found(self, ctg_adapter):
        """Test async trial retrieval when trial not found"""
        # Mock empty response
        mock_response = Mock()
        mock_response.json.return_value = {"studies": []}
        
        with patch.object(ctg_adapter.client, 'get', new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_response
            
            with pytest.raises(Exception, match="Clinical trial with NCT ID NCT12345678 not found"):
                await ctg_adapter.get_clinical_trial("NCT12345678")
    
    def test_build_search_params_with_conditions_and_medications(self, ctg_adapter, sample_patient, sample_parsed_transcript):
        """Test search parameter building with conditions and medications"""
        params = ctg_adapter._build_search_params(sample_patient, sample_parsed_transcript)
        
        assert params["format"] == "json"
        assert params["pageSize"] == 50
        assert "NCTId" in params["fields"]
        assert "BriefTitle" in params["fields"]
        # The implementation uses query.term with AREA syntax, not query.cond
        assert "AREA[Condition]\"Diabetes\"" in params["query.term"]
        assert "AREA[Condition]\"Hypertension\"" in params["query.term"]
        assert "AREA[InterventionName]\"Metformin\"" in params["query.term"]
        assert "AREA[InterventionName]\"Lisinopril\"" in params["query.term"]
        assert "RECRUITING" in params["filter.overallStatus"]
    
    def test_build_search_params_with_age_filter(self, ctg_adapter, sample_parsed_transcript):
        """Test search parameter building with age filter"""
        from datetime import date
        # Create patient with date of birth to calculate age
        patient = Patient(
            id="patient123", 
            first_name="John", 
            last_name="Doe", 
            date_of_birth=date(1978, 1, 1),  # 45 years old in 2023
            sex="MALE", 
            address=None
        )
        
        params = ctg_adapter._build_search_params(patient, sample_parsed_transcript)
        
        assert "filter.advanced" in params
        # The age calculation is dynamic based on current date, so we'll check the pattern instead
        assert "years, MAX" in params["filter.advanced"]  # min age pattern
        assert "MIN, " in params["filter.advanced"] and "years" in params["filter.advanced"]  # max age pattern
    
    def test_build_search_params_with_sex_filter(self, ctg_adapter, sample_parsed_transcript):
        """Test search parameter building with sex filter"""
        patient = Patient(
            id="patient123", 
            first_name="John", 
            last_name="Doe", 
            sex="MALE", 
            address=None
        )
        
        params = ctg_adapter._build_search_params(patient, sample_parsed_transcript)
        
        assert "filter.advanced" in params
        assert "MALE" in params["filter.advanced"]
    
    def test_transform_to_clinical_trial(self, ctg_adapter, sample_trial_data):
        """Test transformation of API data to ClinicalTrial domain model"""
        result = ctg_adapter._transform_to_clinical_trial(sample_trial_data)
        
        assert isinstance(result, ClinicalTrial)
        assert result.external_id == "NCT12345678"
        assert result.brief_title == "Test Clinical Trial"
        assert result.official_title == "A Phase 3 Study of Test Drug in Patients"
        assert result.status == "RECRUITING"
        assert result.conditions == ["Diabetes", "Hypertension"]
        assert result.sponsor_name == "Test Pharmaceutical Company"
        assert result.phases == ["PHASE_3"]
        assert result.minimum_age == "18 years"
        assert result.maximum_age == "75 years"
        assert result.brief_summary == "This is a test clinical trial"
        assert result.detailed_description == "Detailed description of the trial"
        assert result.study_type == "INTERVENTIONAL"
        assert result.primary_purpose == "TREATMENT"
        assert result.eligibility_criteria == "Inclusion criteria..."
        assert result.sex == "ALL"
        assert result.healthy_volunteers is False  # "No" should be converted to False
        assert result.standard_ages == ["ADULT", "OLDER_ADULT"]
        assert result.source_registry == SourceRegistry.CLINICALTRIALS_GOV
        assert result.registry_version == "2.0.4"
        
        # Check locations
        assert len(result.locations) == 1
        location = result.locations[0]
        assert location.facility == "Test Hospital"
        assert location.city == "New York"
        assert location.state == "NY"
        assert location.country == "United States"
        assert location.zip_code == "10001"
        
        # Check interventions
        assert len(result.interventions) == 1
        intervention = result.interventions[0]
        assert intervention.type == "DRUG"
        assert intervention.name == "Test Drug"
        assert intervention.description == "Experimental drug"
    
    @pytest.mark.asyncio
    async def test_health_check_success(self, ctg_adapter):
        """Test successful health check"""
        # Mock successful response
        mock_response = Mock()
        mock_response.json.return_value = {"studies": []}
        
        with patch.object(ctg_adapter.client, 'get', new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_response
            
            result = await ctg_adapter.health_check()
            
            assert result is True
            mock_get.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_health_check_failure(self, ctg_adapter):
        """Test health check failure"""
        with patch.object(ctg_adapter.client, 'get', new_callable=AsyncMock) as mock_get:
            mock_get.side_effect = Exception("API Error")
            
            result = await ctg_adapter.health_check()
            
            assert result is False
    
    @pytest.mark.asyncio
    async def test_search_trials_http_error(self, ctg_adapter):
        """Test search trials with HTTP error"""
        with patch.object(ctg_adapter.client, 'get', new_callable=AsyncMock) as mock_get:
            mock_get.side_effect = httpx.HTTPStatusError("500 Internal Server Error", request=Mock(), response=Mock())
            
            with pytest.raises(httpx.HTTPStatusError):
                await ctg_adapter._search_trials({"format": "json", "pageSize": 1})
    
    @pytest.mark.asyncio
    async def test_search_trials_general_error(self, ctg_adapter):
        """Test search trials with general error"""
        with patch.object(ctg_adapter.client, 'get', new_callable=AsyncMock) as mock_get:
            mock_get.side_effect = Exception("Network error")
            
            with pytest.raises(Exception):
                await ctg_adapter._search_trials({"format": "json", "pageSize": 1})
    
    def test_transform_to_clinical_trial_missing_data(self, ctg_adapter):
        """Test transformation with missing data"""
        # Minimal trial data
        minimal_data = {
            "protocolSection": {
                "identificationModule": {
                    "nctId": "NCT12345678",
                    "briefTitle": "Test Trial"
                },
                "statusModule": {
                    "overallStatus": "RECRUITING"
                },
                "sponsorModule": {
                    "leadSponsor": {
                        "leadSponsorName": "Test Sponsor"
                    }
                },
                "descriptionModule": {},
                "conditionsModule": {},
                "armsInterventionsModule": {},
                "eligibilityModule": {},
                "contactsLocationsModule": {},
                "outcomesModule": {}
            }
        }
        
        result = ctg_adapter._transform_to_clinical_trial(minimal_data)
        
        assert isinstance(result, ClinicalTrial)
        assert result.external_id == "NCT12345678"
        assert result.brief_title == "Test Trial"
        assert result.status == "RECRUITING"
        assert result.sponsor_name == "Test Sponsor"
        assert result.conditions == []
        assert result.phases == []
        assert result.locations == []
        assert result.interventions == [] 