from typing import Optional
from datetime import date
from domain.address import Address

class Patient:
    def __init__(self,
                 id: Optional[str] = None,
                 first_name: str = "",
                 last_name: str = "",
                 date_of_birth: Optional[date] = None,
                 sex: Optional[str] = None,
                 email: Optional[str] = None,
                 phone: Optional[str] = None,
                 address: Optional[Address] = None,
                 city: Optional[str] = None,
                 state: Optional[str] = None,
                 zip_code: Optional[str] = None,
                 country: str = "USA"):
        self.id = id
        self.first_name = first_name
        self.last_name = last_name
        self.date_of_birth = date_of_birth
        self.sex = sex
        self.email = email
        self.phone = phone
        self.address = address
        self.city = city
        self.state = state
        self.zip_code = zip_code
        self.country = country
    
    def __str__(self) -> str:
        return f"Patient(id={self.id}, name={self.first_name} {self.last_name})"
    
    def __repr__(self) -> str:
        return self.__str__() 