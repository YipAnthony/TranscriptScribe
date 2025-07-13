import os
import json
import logging
from typing import Dict, Any, Optional
from google.generativeai import GenerativeModel, configure, GenerationConfig
from google.generativeai.types import HarmCategory, HarmBlockThreshold
from ports.llm import LLMPort, LLMResponse

logger = logging.getLogger(__name__)

class GeminiAdapter(LLMPort):
    def __init__(self, api_key: str, model_name: str = "gemini-2.0-flash-exp"):
        """
        Initialize Gemini adapter
        
        Args:
            api_key: Google AI API key (must be provided explicitly)
            model_name: Gemini model to use (defaults to gemini-2.0-flash-exp)
        """
        if not api_key:
            raise ValueError("Google AI API key is required. Pass api_key explicitly.")
        self.api_key = api_key
        self.model_name = model_name
        configure(api_key=self.api_key)
        
        # Initialize the model with safety settings
        self.model = GenerativeModel(
            model_name=self.model_name,
            safety_settings={
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            }
        )
        
        logger.info(f"Initialized Gemini adapter with model: {self.model_name}")
    
    def call_llm(self, prompt: str, **kwargs) -> LLMResponse:
        """
        Call Gemini 2.0 Flash with prompt and return structured response
        
        Args:
            prompt: The prompt to send to the LLM
            **kwargs: Additional parameters (temperature, max_tokens, etc.)
            
        Returns:
            LLMResponse: Structured response with content and metadata
        """
        try:
            # Create generation config
            generation_config = GenerationConfig(
                temperature=kwargs.get("temperature", 0.7),
                top_p=kwargs.get("top_p", 0.9),
                top_k=kwargs.get("top_k", 40),
                max_output_tokens=kwargs.get("max_tokens", 2048),
            )
            
            # Generate response
            response = self.model.generate_content(
                prompt,
                generation_config=generation_config
            )
            
            # Extract usage information if available
            usage = None
            if hasattr(response, 'candidates') and response.candidates:
                candidate = response.candidates[0]
                if hasattr(candidate, 'token_count'):
                    usage = {
                        "prompt_token_count": getattr(candidate.token_count, 'prompt_token_count', 0),
                        "candidates_token_count": getattr(candidate.token_count, 'candidates_token_count', 0),
                        "total_token_count": getattr(candidate.token_count, 'total_token_count', 0),
                    }
            
            # Extract metadata
            metadata = {
                "model": self.model_name,
                "finish_reason": getattr(response, 'finish_reason', None),
            }
            
            # Add safety ratings if available
            if hasattr(response, 'candidates') and response.candidates:
                candidate = response.candidates[0]
                if hasattr(candidate, 'safety_ratings'):
                    metadata["safety_ratings"] = candidate.safety_ratings
            
            return LLMResponse(
                content=response.text,
                metadata=metadata,
                usage=usage
            )
            
        except Exception as e:
            logger.error(f"Error calling Gemini LLM: {str(e)}")
            raise RuntimeError(f"Failed to call Gemini LLM: {str(e)}")
    
    def call_llm_json(self, prompt: str, **kwargs) -> Dict[str, Any]:
        """
        Call Gemini 2.0 Flash with prompt and return JSON response
        
        Args:
            prompt: The prompt to send to the LLM
            **kwargs: Additional parameters (temperature, max_tokens, etc.)
            
        Returns:
            Dict[str, Any]: JSON response from LLM
        """
        try:
            # Add JSON formatting instruction to prompt
            json_prompt = f"{prompt}\n\nPlease respond with valid JSON only."
            
            # Create generation config
            generation_config = GenerationConfig(
                temperature=kwargs.get("temperature", 0.1),  # Lower temperature for more consistent JSON
                top_p=kwargs.get("top_p", 0.9),
                top_k=kwargs.get("top_k", 40),
                max_output_tokens=kwargs.get("max_tokens", 2048),
            )
            
            # Generate response
            response = self.model.generate_content(
                json_prompt,
                generation_config=generation_config
            )
            
            # Try to parse JSON from response
            try:
                # Clean the response text to extract JSON
                text = response.text.strip()
                # Remove markdown code blocks if present
                if text.startswith("```json"):
                    text = text[7:]
                if text.endswith("```"):
                    text = text[:-3]
                text = text.strip()
                
                return json.loads(text)
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON response: {str(e)}")
                logger.error(f"Raw response: {response.text}")
                raise RuntimeError(f"LLM response is not valid JSON: {str(e)}")
                
        except Exception as e:
            logger.error(f"Error calling Gemini LLM for JSON: {str(e)}")
            raise RuntimeError(f"Failed to call Gemini LLM for JSON: {str(e)}")
    
    def health_check(self) -> bool:
        """
        Check if the Gemini service is healthy and accessible
        
        Returns:
            bool: True if healthy, False otherwise
        """
        try:
            # Simple health check with a minimal prompt
            generation_config = GenerationConfig(max_output_tokens=10)
            response = self.model.generate_content(
                "Hello",
                generation_config=generation_config
            )
            return response.text is not None and len(response.text) > 0
        except Exception as e:
            logger.error(f"Health check failed: {str(e)}")
            return False