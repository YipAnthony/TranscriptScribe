import pytest
from unittest.mock import Mock, MagicMock
from adapters.transcript_analyzer.gemini import GeminiTranscriptAnalyzer
from domain.parsed_transcript import ParsedTranscript
from domain.address import Address
from ports.llm import LLMPort

class TestGeminiTranscriptAnalyzer:
    
    def setup_method(self):
        """Set up test fixtures"""
        self.mock_llm = Mock(spec=LLMPort)
        self.analyzer = GeminiTranscriptAnalyzer(llm_adapter=self.mock_llm)
    
    def test_analyze_transcript_success(self):
        """Test successful transcript analysis"""
        # Mock LLM response
        mock_response = {
            "conditions": ["diabetes", "hypertension"],
            "medications": ["metformin", "lisinopril"],
            "procedures": ["blood pressure monitoring"],
            "age": 45,
            "sex": "MALE",
            "location": {
                "city": "New York",
                "state": "NY",
                "country": "USA",
                "zip_code": "10001"
            },
            "positive_symptoms": ["fatigue", "thirst"],
            "negative_symptoms": ["chest pain", "shortness of breath"],
            "positive_lab_results": ["elevated glucose", "high A1C"],
            "negative_lab_results": ["normal kidney function"],
            "positive_imaging_results": [],
            "negative_imaging_results": ["normal chest x-ray"],
            "past_diagnoses": ["prediabetes"],
            "past_surgeries": ["appendectomy"],
            "family_history": ["diabetes in father"],
            "positive_lifestyle_factors": ["regular exercise"],
            "negative_lifestyle_factors": ["poor diet"],
            "extraction_notes": ["Patient reports good medication compliance"]
        }
        
        self.mock_llm.call_llm_json.return_value = mock_response
        
        # Test transcript
        raw_transcript = "Patient is a 45-year-old male with diabetes and hypertension. Currently taking metformin and lisinopril. Reports fatigue and increased thirst but denies chest pain. Lab results show elevated glucose and high A1C but normal kidney function."
        
        # Analyze
        result = self.analyzer.analyze_transcript(raw_transcript)
        
        # Verify
        assert isinstance(result, ParsedTranscript)
        assert result.conditions == ["diabetes", "hypertension"]
        assert result.medications == ["metformin", "lisinopril"]
        assert result.procedures == ["blood pressure monitoring"]
        assert result.age == 45
        assert result.sex == "MALE"
        assert isinstance(result.location, Address)
        assert result.location.city == "New York"
        assert result.location.state == "NY"
        assert result.location.country == "USA"
        assert result.location.zip_code == "10001"
        
        # Verify comprehensive medical record
        assert result.positive_symptoms == ["fatigue", "thirst"]
        assert result.negative_symptoms == ["chest pain", "shortness of breath"]
        assert result.positive_lab_results == ["elevated glucose", "high A1C"]
        assert result.negative_lab_results == ["normal kidney function"]
        assert result.positive_imaging_results == []
        assert result.negative_imaging_results == ["normal chest x-ray"]
        assert result.past_diagnoses == ["prediabetes"]
        assert result.past_surgeries == ["appendectomy"]
        assert result.family_history == ["diabetes in father"]
        assert result.positive_lifestyle_factors == ["regular exercise"]
        assert result.negative_lifestyle_factors == ["poor diet"]
        assert result.extraction_notes == ["Patient reports good medication compliance"]
        
        # Verify LLM was called
        self.mock_llm.call_llm_json.assert_called_once()
        call_args = self.mock_llm.call_llm_json.call_args
        assert "diabetes" in call_args[1]["prompt"]
        assert call_args[1]["temperature"] == 0.1
        assert call_args[1]["max_tokens"] == 4096
    
    def test_analyze_transcript_empty_response(self):
        """Test handling of empty/null response fields"""
        mock_response = {
            "conditions": None,
            "medications": [],
            "procedures": None,
            "age": None,
            "sex": None,
            "location": None,
            "positive_symptoms": None,
            "negative_symptoms": [],
            "positive_lab_results": None,
            "negative_lab_results": [],
            "positive_imaging_results": None,
            "negative_imaging_results": [],
            "past_diagnoses": None,
            "past_surgeries": [],
            "family_history": None,
            "positive_lifestyle_factors": [],
            "negative_lifestyle_factors": None,
            "extraction_notes": []
        }
        
        self.mock_llm.call_llm_json.return_value = mock_response
        
        result = self.analyzer.analyze_transcript("Test transcript")
        
        assert isinstance(result, ParsedTranscript)
        assert result.conditions == []
        assert result.medications == []
        assert result.procedures == []
        assert result.age is None
        assert result.sex is None
        assert result.location is None
        assert result.positive_symptoms == []
        assert result.negative_symptoms == []
        assert result.positive_lab_results == []
        assert result.negative_lab_results == []
        assert result.positive_imaging_results == []
        assert result.negative_imaging_results == []
        assert result.past_diagnoses == []
        assert result.past_surgeries == []
        assert result.family_history == []
        assert result.positive_lifestyle_factors == []
        assert result.negative_lifestyle_factors == []
        assert result.extraction_notes == []
    
    def test_analyze_transcript_dict_input(self):
        """Test handling of dict input"""
        mock_response = {
            "conditions": ["test condition"],
            "medications": ["test medication"],
            "procedures": ["test procedure"],
            "age": 30,
            "sex": "FEMALE",
            "location": None,
            "positive_symptoms": [],
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
        
        self.mock_llm.call_llm_json.return_value = mock_response
        
        dict_transcript = {"text": "Test transcript", "metadata": "test"}
        result = self.analyzer.analyze_transcript(dict_transcript)
        
        assert isinstance(result, ParsedTranscript)
        # Verify the dict was converted to JSON string
        call_args = self.mock_llm.call_llm_json.call_args
        assert '"text": "Test transcript"' in call_args[1]["prompt"]
    
    def test_analyze_transcript_llm_error(self):
        """Test handling of LLM errors"""
        self.mock_llm.call_llm_json.side_effect = Exception("LLM error")
        
        result = self.analyzer.analyze_transcript("Test transcript")
        
        # Should return empty ParsedTranscript as fallback
        assert isinstance(result, ParsedTranscript)
        assert result.conditions == []
        assert result.medications == []
        assert result.procedures == []
    
    def test_analyze_transcript_no_llm_adapter(self):
        """Test error when LLM adapter is not set"""
        analyzer = GeminiTranscriptAnalyzer()  # No LLM adapter
        
        with pytest.raises(RuntimeError, match="LLM adapter not set"):
            analyzer.analyze_transcript("Test transcript")
    
    def test_set_llm_adapter(self):
        """Test setting LLM adapter after initialization"""
        analyzer = GeminiTranscriptAnalyzer()
        mock_llm = Mock()
        
        analyzer.set_llm_adapter(mock_llm)
        
        assert analyzer.llm_adapter == mock_llm
    
    def test_analyze_transcript_partial_location(self):
        """Test handling of partial location data"""
        mock_response = {
            "conditions": [],
            "medications": [],
            "procedures": [],
            "age": None,
            "sex": None,
            "location": {
                "city": "Boston",
                "state": "MA"
                # Missing country and zip_code
            },
            "positive_symptoms": [],
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
        
        self.mock_llm.call_llm_json.return_value = mock_response
        
        result = self.analyzer.analyze_transcript("Test transcript")
        
        assert isinstance(result.location, Address)
        assert result.location.city == "Boston"
        assert result.location.state == "MA"
        assert result.location.country is None
        assert result.location.zip_code is None 