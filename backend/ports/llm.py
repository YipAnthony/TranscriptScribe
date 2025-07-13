from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from dataclasses import dataclass

@dataclass
class LLMResponse:
    """Structured response from LLM"""
    content: str
    metadata: Optional[Dict[str, Any]] = None
    usage: Optional[Dict[str, Any]] = None

class LLMPort(ABC):
    @abstractmethod
    def call_llm(self, prompt: str, **kwargs) -> LLMResponse:
        """
        Call LLM with prompt and return structured response
        
        Args:
            prompt: The prompt to send to the LLM
            **kwargs: Additional parameters (temperature, max_tokens, etc.)
            
        Returns:
            LLMResponse: Structured response with content and metadata
        """
        pass
    
    @abstractmethod
    def call_llm_json(self, prompt: str, **kwargs) -> Dict[str, Any]:
        """
        Call LLM with prompt and return JSON response
        
        Args:
            prompt: The prompt to send to the LLM
            **kwargs: Additional parameters (temperature, max_tokens, etc.)
            
        Returns:
            Dict[str, Any]: JSON response from LLM
        """
        pass
    
    @abstractmethod
    def health_check(self) -> bool:
        """
        Check if the LLM service is healthy and accessible
        
        Returns:
            bool: True if healthy, False otherwise
        """
        pass 