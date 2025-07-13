import pytest
import os
import sys
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
from typing import Generator, Tuple

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

from adapters.llm.gemini import GeminiAdapter
from ports.llm import LLMResponse


class TestGeminiAdapter:
    """Test cases for GeminiAdapter"""
    
    @pytest.fixture
    def mock_api_key(self) -> str:
        """Mock API key for testing"""
        return "test-api-key-12345"
    
    @pytest.fixture
    def gemini_adapter(self, mock_api_key: str) -> Generator[Tuple[GeminiAdapter, Mock], None, None]:
        """Create a GeminiAdapter instance for testing"""
        with patch('adapters.llm.gemini.configure') as mock_configure:
            with patch('adapters.llm.gemini.GenerativeModel') as mock_model_class:
                # Create a mock model instance
                mock_model_instance = Mock()
                mock_model_class.return_value = mock_model_instance
                
                # Create a mock for generate_content method
                mock_generate_content = Mock()
                mock_model_instance.generate_content = mock_generate_content
                
                # Create the adapter
                adapter = GeminiAdapter(api_key=mock_api_key)
                adapter.model = mock_model_instance
                
                yield adapter, mock_generate_content
    
    def test_init_with_api_key(self, mock_api_key: str) -> None:
        """Test initialization with API key"""
        with patch('adapters.llm.gemini.configure') as mock_configure:
            with patch('adapters.llm.gemini.GenerativeModel') as mock_model:
                mock_model_instance = Mock()
                mock_model.return_value = mock_model_instance
                
                adapter = GeminiAdapter(api_key=mock_api_key)
                
                assert adapter.api_key == mock_api_key
                assert adapter.model_name == "gemini-2.0-flash-exp"
                mock_configure.assert_called_once_with(api_key=mock_api_key)
                mock_model.assert_called_once()
    
    def test_init_without_api_key_raises_error(self) -> None:
        """Test initialization without API key raises error"""
        with pytest.raises(ValueError, match="Google AI API key is required"):
            GeminiAdapter(api_key="")
    
    def test_call_llm_success(self, gemini_adapter: Tuple[GeminiAdapter, Mock]) -> None:
        """Test successful LLM call"""
        adapter, mock_generate_content = gemini_adapter
        
        # Mock response
        mock_response = Mock()
        mock_response.text = "Hello, this is a test response"
        mock_response.candidates = []
        
        mock_generate_content.return_value = mock_response
        
        # Call the method
        result = adapter.call_llm("Test prompt")
        
        # Verify result
        assert isinstance(result, LLMResponse)
        assert result.content == "Hello, this is a test response"
        assert result.metadata is not None
        assert result.metadata["model"] == "gemini-2.0-flash-exp"
        
        # Verify the model was called correctly
        mock_generate_content.assert_called_once()
        call_args = mock_generate_content.call_args
        assert call_args[0][0] == "Test prompt"  # First positional arg is prompt
    
    def test_call_llm_with_kwargs(self, gemini_adapter: Tuple[GeminiAdapter, Mock]) -> None:
        """Test LLM call with custom parameters"""
        adapter, mock_generate_content = gemini_adapter
        
        mock_response = Mock()
        mock_response.text = "Custom response"
        mock_response.candidates = []
        
        mock_generate_content.return_value = mock_response
        
        # Call with custom parameters
        result = adapter.call_llm(
            "Test prompt",
            temperature=0.5,
            max_tokens=1000
        )
        
        # Verify the method was called
        mock_generate_content.assert_called_once()
        
        # Verify result
        assert isinstance(result, LLMResponse)
        assert result.content == "Custom response"
    
    def test_call_llm_json_success(self, gemini_adapter: Tuple[GeminiAdapter, Mock]) -> None:
        """Test successful JSON LLM call"""
        adapter, mock_generate_content = gemini_adapter
        
        # Mock response with JSON
        mock_response = Mock()
        mock_response.text = '{"key": "value", "number": 42}'
        
        mock_generate_content.return_value = mock_response
        
        # Call the method
        result = adapter.call_llm_json("Return JSON")
        
        # Verify result
        assert isinstance(result, dict)
        assert result["key"] == "value"
        assert result["number"] == 42
        
        # Verify the prompt was modified for JSON
        call_args = mock_generate_content.call_args
        prompt = call_args[0][0]
        assert "Please respond with valid JSON only" in prompt
    
    def test_call_llm_json_with_markdown(self, gemini_adapter: Tuple[GeminiAdapter, Mock]) -> None:
        """Test JSON call with markdown code blocks"""
        adapter, mock_generate_content = gemini_adapter
        
        # Mock response with JSON in markdown
        mock_response = Mock()
        mock_response.text = '```json\n{"key": "value"}\n```'
        
        mock_generate_content.return_value = mock_response
        
        # Call the method
        result = adapter.call_llm_json("Return JSON")
        
        # Verify result
        assert result["key"] == "value"
    
    def test_call_llm_json_invalid_json(self, gemini_adapter: Tuple[GeminiAdapter, Mock]) -> None:
        """Test JSON call with invalid JSON response"""
        adapter, mock_generate_content = gemini_adapter
        
        # Mock response with invalid JSON
        mock_response = Mock()
        mock_response.text = "This is not JSON"
        
        mock_generate_content.return_value = mock_response
        
        # Call the method and expect error
        with pytest.raises(RuntimeError, match="LLM response is not valid JSON"):
            adapter.call_llm_json("Return JSON")
    
    def test_health_check_success(self, gemini_adapter: Tuple[GeminiAdapter, Mock]) -> None:
        """Test successful health check"""
        adapter, mock_generate_content = gemini_adapter
        
        # Mock successful response
        mock_response = Mock()
        mock_response.text = "Hello"
        
        mock_generate_content.return_value = mock_response
        
        # Call health check
        result = adapter.health_check()
        
        assert result is True
        
        # Verify minimal prompt was used
        call_args = mock_generate_content.call_args
        assert call_args[0][0] == "Hello"
    
    def test_health_check_failure(self, gemini_adapter: Tuple[GeminiAdapter, Mock]) -> None:
        """Test health check failure"""
        adapter, mock_generate_content = gemini_adapter
        
        # Mock failed response
        mock_generate_content.side_effect = Exception("API Error")
        
        # Call health check
        result = adapter.health_check()
        
        assert result is False
    
    def test_call_llm_exception_handling(self, gemini_adapter: Tuple[GeminiAdapter, Mock]) -> None:
        """Test exception handling in LLM call"""
        adapter, mock_generate_content = gemini_adapter
        
        # Mock exception
        mock_generate_content.side_effect = Exception("API Error")
        
        # Call the method and expect error
        with pytest.raises(RuntimeError, match="Failed to call Gemini LLM"):
            adapter.call_llm("Test prompt")
    
    def test_call_llm_json_exception_handling(self, gemini_adapter: Tuple[GeminiAdapter, Mock]) -> None:
        """Test exception handling in JSON LLM call"""
        adapter, mock_generate_content = gemini_adapter
        
        # Mock exception
        mock_generate_content.side_effect = Exception("API Error")
        
        # Call the method and expect error
        with pytest.raises(RuntimeError, match="Failed to call Gemini LLM for JSON"):
            adapter.call_llm_json("Test prompt") 