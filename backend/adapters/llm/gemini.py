from ...ports.llm import LLMPort

class GeminiAdapter(LLMPort):
    def __init__(self):
        pass
    
    # TODO: implement this
    def call_llm(self, prompt: str) -> str:
        """
        Call Gemini 2.0 Flash with prompt
        """
        return "implement me"