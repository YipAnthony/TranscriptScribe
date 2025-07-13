import pytest
from unittest.mock import Mock, MagicMock
from adapters.transcript_analyzer.gemini import GeminiTranscriptAnalyzer
from domain.parsed_transcript import ParsedTranscript
from domain.address import Address
from ports.llm import LLMResponse

class TestGeminiTranscriptAnalyzer:
    
    def setup_method(self):
        """Set up test fixtures"""
        self.mock_llm = Mock()
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
                "country": "USA"
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
        
        # Test transcript
        raw_transcript = "Patient is a 45-year-old male with diabetes and hypertension. Currently taking metformin and lisinopril."
        
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
        
        # Verify LLM was called
        self.mock_llm.call_llm_json.assert_called_once()
        call_args = self.mock_llm.call_llm_json.call_args
        assert "diabetes" in call_args[1]["prompt"]
        assert call_args[1]["temperature"] == 0.1
    
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