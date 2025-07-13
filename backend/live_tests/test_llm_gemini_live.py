import pytest
import os
import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from adapters.llm.gemini import GeminiAdapter
from ports.llm import LLMResponse


class TestGeminiAdapterLive:
    """Live tests for GeminiAdapter (requires real API key)"""
    
    def test_real_api_call(self) -> None:
        """Test with real API (requires GOOGLE_AI_API_KEY env var)"""
        api_key = os.getenv("GOOGLE_AI_API_KEY")
        if not api_key:
            pytest.skip("GOOGLE_AI_API_KEY not set")
        
        adapter = GeminiAdapter(api_key=api_key)
        
        # Test basic call
        response = adapter.call_llm("Say hello in one word")
        assert isinstance(response, LLMResponse)
        assert len(response.content) > 0
        
        # Test health check
        assert adapter.health_check() is True
    
    def test_real_json_api_call(self) -> None:
        """Test JSON API call with real API"""
        api_key = os.getenv("GOOGLE_AI_API_KEY")
        if not api_key:
            pytest.skip("GOOGLE_AI_API_KEY not set")
        
        adapter = GeminiAdapter(api_key=api_key)
        
        # Test JSON call
        result = adapter.call_llm_json("Return a simple JSON object with a greeting")
        assert isinstance(result, dict)
        assert len(result) > 0
    
    def test_real_api_with_parameters(self) -> None:
        """Test API call with custom parameters"""
        api_key = os.getenv("GOOGLE_AI_API_KEY")
        if not api_key:
            pytest.skip("GOOGLE_AI_API_KEY not set")
        
        adapter = GeminiAdapter(api_key=api_key)
        
        # Test with custom temperature
        response = adapter.call_llm(
            "Give me a random number between 1 and 10",
            temperature=0.9,
            max_tokens=50
        )
        assert isinstance(response, LLMResponse)
        assert len(response.content) > 0 