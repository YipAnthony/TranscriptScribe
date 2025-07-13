import pytest
from unittest.mock import Mock, MagicMock
from adapters.llm.gemini import GeminiAdapter
from ports.llm import LLMResponse

class TestGeminiAdapter:
    
    def setup_method(self):
        """Set up test fixtures"""
        self.api_key = "test_api_key"
        self.model_name = "gemini-2.0-flash-exp"
        self.adapter = GeminiAdapter(api_key=self.api_key, model_name=self.model_name)
    
    def test_init_with_api_key(self):
        """Test initialization with API key"""
        assert self.adapter.api_key == self.api_key
        assert self.adapter.model_name == self.model_name
    
    def test_init_without_api_key_raises_error(self):
        """Test that initialization without API key raises error"""
        with pytest.raises(ValueError, match="Google AI API key is required"):
            GeminiAdapter(api_key="")
    
    def test_call_llm_success(self):
        """Test successful LLM call"""
        # Mock the model's generate_content method
        mock_response = Mock()
        mock_response.text = "Test response"
        mock_response.candidates = [Mock()]
        mock_response.candidates[0].token_count = Mock()
        mock_response.candidates[0].token_count.prompt_token_count = 10
        mock_response.candidates[0].token_count.candidates_token_count = 5
        mock_response.candidates[0].token_count.total_token_count = 15
        mock_response.finish_reason = "STOP"
        
        self.adapter.model.generate_content = Mock(return_value=mock_response)
        
        # Test call
        result = self.adapter.call_llm("Test prompt")
        
        # Verify
        assert isinstance(result, LLMResponse)
        assert result.content == "Test response"
        assert result.metadata["model"] == self.model_name
        assert result.metadata["finish_reason"] == "STOP"
        assert result.usage["prompt_token_count"] == 10
        assert result.usage["candidates_token_count"] == 5
        assert result.usage["total_token_count"] == 15
    
    def test_call_llm_json_success(self):
        """Test successful JSON LLM call"""
        # Mock the model's generate_content method
        mock_response = Mock()
        mock_response.text = '{"key": "value"}'
        
        self.adapter.model.generate_content = Mock(return_value=mock_response)
        
        # Test call
        result = self.adapter.call_llm_json("Test prompt")
        
        # Verify
        assert result == {"key": "value"}
    
    def test_call_llm_json_with_markdown(self):
        """Test JSON call with markdown code blocks"""
        # Mock the model's generate_content method
        mock_response = Mock()
        mock_response.text = '```json\n{"key": "value"}\n```'
        
        self.adapter.model.generate_content = Mock(return_value=mock_response)
        
        # Test call
        result = self.adapter.call_llm_json("Test prompt")
        
        # Verify
        assert result == {"key": "value"}
    
    def test_call_llm_json_invalid_json(self):
        """Test JSON call with invalid JSON response"""
        # Mock the model's generate_content method
        mock_response = Mock()
        mock_response.text = "Invalid JSON"
        
        self.adapter.model.generate_content = Mock(return_value=mock_response)
        
        # Test call should raise error
        with pytest.raises(RuntimeError, match="LLM response is not valid JSON"):
            self.adapter.call_llm_json("Test prompt")
    
    def test_health_check_success(self):
        """Test successful health check"""
        # Mock the model's generate_content method
        mock_response = Mock()
        mock_response.text = "Hello"
        
        self.adapter.model.generate_content = Mock(return_value=mock_response)
        
        # Test health check
        result = self.adapter.health_check()
        
        # Verify
        assert result is True
    
    def test_health_check_failure(self):
        """Test failed health check"""
        # Mock the model's generate_content method to raise exception
        self.adapter.model.generate_content = Mock(side_effect=Exception("API Error"))
        
        # Test health check
        result = self.adapter.health_check()
        
        # Verify
        assert result is False 