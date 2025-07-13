from abc import ABC, abstractmethod

class LLMPort(ABC):
    @abstractmethod
    def call_llm(self, prompt: str) -> str:
        """
        Call LLM with prompt and return response
        
        Args:
            prompt: The prompt to send to the LLM
            
        Returns:
            str: The LLM response
        """
        pass 