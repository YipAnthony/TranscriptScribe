from typing import Optional

class Address:
    def __init__(self,
                 street: Optional[str] = None,
                 city: Optional[str] = None,
                 state: Optional[str] = None,
                 zip_code: Optional[str] = None,
                 country: Optional[str] = None):
        self.street = street
        self.city = city
        self.state = state
        self.zip_code = zip_code
        self.country = country
    
    def __str__(self) -> str:
        return f"Address(city={self.city}, state={self.state}, country={self.country})"
    
    def __repr__(self) -> str:
        return self.__str__() 