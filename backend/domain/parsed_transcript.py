from typing import List, Optional
from domain.address import Address

class ParsedTranscript:
    def __init__(self,
                 conditions: Optional[List[str]] = None,
                 interventions: Optional[List[str]] = None,
                 location: Optional[Address] = None,
                 sex: Optional[str] = None,  # 'MALE', 'FEMALE'
                 age: Optional[int] = None):
        self.conditions = conditions or []
        self.interventions = interventions or []
        self.location = location
        self.sex = sex
        self.age = age
    
    def __str__(self) -> str:
        return f"ParsedTranscript(conditions={len(self.conditions)}, interventions={len(self.interventions)}, age={self.age}, sex={self.sex})"
    
    def __repr__(self) -> str:
        return self.__str__() 