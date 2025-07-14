import json
import logging
from typing import Union, Dict, Any, List, Optional
from datetime import datetime
import httpx
from ports.clinical_trials import ClinicalTrialsPort
from domain.patient import Patient
from domain.parsed_transcript import ParsedTranscript
from domain.clinical_trial import ClinicalTrial, SourceRegistry, Location, Intervention, Contact, Outcome
from logging_config import get_logger

logger = get_logger(__name__)

class CTGV2_0_4Adapter(ClinicalTrialsPort):
    """
    ClinicalTrials.gov API v2.0.4 adapter
    
    This adapter implements the ClinicalTrialsPort interface to interact with
    the ClinicalTrials.gov API version 2.0.4 for finding and retrieving clinical trials.
    """
    
    VERSION = "2.0.4"
    SOURCE_REGISTRY = SourceRegistry.CLINICALTRIALS_GOV
    BASE_URL = "https://beta-ut.clinicaltrials.gov/api/v2"
    
    def __init__(self, timeout: int = 30):
        """
        Initialize CTG API adapter
        
        Args:
            timeout: HTTP request timeout in seconds
        """
        self.timeout = timeout
        self.client = httpx.AsyncClient(timeout=timeout)
        logger.info(f"🔬 Initialized CTG API v{self.VERSION} adapter with timeout: {timeout}s")
    
    async def __aenter__(self):
        """Async context manager entry"""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.client.aclose()
    
    async def find_recommended_clinical_trials(self, patient: Patient, parsed_transcript: ParsedTranscript) -> List[ClinicalTrial]:
        """
        Find recommended clinical trials using ClinicalTrials.gov v2.0.4 API
        
        Args:
            patient: Patient domain model
            parsed_transcript: Parsed transcript domain model
            
        Returns:
            List[ClinicalTrial]: List of recommended clinical trials
        """
        logger.info(f"🔍 Finding recommended clinical trials for patient {patient.first_name} {patient.last_name}")
        logger.debug(f"📋 Patient details - age: {patient.date_of_birth}, sex: {patient.sex}")
        logger.debug(f"📋 Transcript summary - conditions: {len(parsed_transcript.conditions)}, medications: {len(parsed_transcript.medications)}")
        
        try:
            # Build comprehensive OR-based search with all available filters
            logger.debug("🔧 Building search parameters...")
            search_params = self._build_search_params(patient, parsed_transcript)
            logger.debug(f"📋 Search parameters: {json.dumps(search_params, indent=2)}")
            
            logger.info("🌐 Searching ClinicalTrials.gov API...")
            trials_data = await self._search_trials(search_params)
            logger.info(f"✅ Received {len(trials_data)} trials from API")
            
            clinical_trials = []
            for i, trial_data in enumerate(trials_data):
                try:
                    logger.debug(f"🔄 Transforming trial {i+1}/{len(trials_data)}: {trial_data.get('NCTId', 'Unknown')}")
                    clinical_trial = self._transform_to_clinical_trial(trial_data)
                    clinical_trials.append(clinical_trial)
                except Exception as e:
                    logger.error(f"❌ Error transforming trial data: {e}")
                    continue
            
            logger.info(f"🎉 Successfully found {len(clinical_trials)} clinical trials")
            return clinical_trials
            
        except Exception as e:
            logger.error(f"❌ Error finding clinical trials: {e}", exc_info=True)
            return []
    
    async def get_clinical_trial(self, trial_id: str) -> ClinicalTrial:
        """
        Get a specific clinical trial by NCT ID using ClinicalTrials.gov v2.0.4 API
        
        Args:
            trial_id: The NCT ID of the clinical trial
            
        Returns:
            ClinicalTrial: The clinical trial details
            
        Raises:
            Exception: If trial is not found or API error occurs
        """
        logger.info(f"🔍 Getting clinical trial details for NCT ID: {trial_id}")
        
        try:
            # Search for specific trial by NCT ID
            search_params = {
                "filter.ids": [trial_id],
                "fields": ["NCTId", "BriefTitle", "OfficialTitle", "OverallStatus", "Condition", 
                          "LeadSponsorName", "Phase", "MinimumAge", "MaximumAge", "Location", 
                          "BriefSummary", "Intervention", "EnrollmentCount", "StartDate", 
                          "DetailedDescription", "StudyType", "CompletionDate", 
                          "PrimaryCompletionDate", "EligibilityCriteria", "Sex", "HealthyVolunteers", 
                          "ArmGroup", "CentralContact", "OverallOfficial", 
                          "LastUpdatePostDate"]
            }
            
            logger.debug("🌐 Searching ClinicalTrials.gov API for specific trial...")
            trials_data = await self._search_trials(search_params)
            
            if not trials_data:
                logger.warning(f"⚠️ Clinical trial with NCT ID {trial_id} not found")
                raise Exception(f"Clinical trial with NCT ID {trial_id} not found")
            
            logger.info(f"✅ Found clinical trial: {trial_id}")
            # Return the first (and should be only) trial
            return self._transform_to_clinical_trial(trials_data[0])
            
        except Exception as e:
            logger.error(f"❌ Error getting clinical trial {trial_id}: {e}", exc_info=True)
            raise
    
    def _build_search_params(self, patient: Patient, parsed_transcript: ParsedTranscript) -> Dict[str, Any]:
        """
        Build search parameters for CTG API based on patient and transcript data
        Uses OR-based searching to be more inclusive of relevant trials
        """
        params = {
            "format": "json",
            "pageSize": 50,  # Limit results for initial implementation
            "fields": ["NCTId", "BriefTitle", "OfficialTitle", "OverallStatus", "Condition", 
                      "LeadSponsorName", "Phase", "MinimumAge", "MaximumAge", "Location", 
                      "BriefSummary", "Intervention", "EnrollmentCount", "StartDate", 
                      "DetailedDescription", "StudyType", "CompletionDate", 
                      "PrimaryCompletionDate", "EligibilityCriteria", "Sex", "HealthyVolunteers", 
                      "ArmGroup", "CentralContact", "OverallOfficial", 
                      "LastUpdatePostDate"],
            "sort": ["@relevance"]
        }
        
        # Build OR-based search query combining conditions and interventions
        search_terms = []
        
        # Add conditions from transcript
        if parsed_transcript.conditions:
            for condition in parsed_transcript.conditions:
                search_terms.append(f'AREA[Condition]"{condition}"')
        
        # Add medications from transcript
        if parsed_transcript.medications:
            for medication in parsed_transcript.medications:
                search_terms.append(f'AREA[InterventionName]"{medication}"')
        
        # Add procedures from transcript
        if parsed_transcript.procedures:
            for procedure in parsed_transcript.procedures:
                search_terms.append(f'AREA[InterventionName]"{procedure}"')
        
        # Add symptoms from transcript (positive symptoms)
        if parsed_transcript.positive_symptoms:
            for symptom in parsed_transcript.positive_symptoms:
                search_terms.append(f'AREA[Condition]"{symptom}"')
        
        # If we have search terms, create OR query
        if search_terms:
            or_query = " OR ".join(search_terms)
            params["query.term"] = or_query
            logger.info(f"Created OR-based search query: {or_query}")
        else:
            # No search terms found - return empty results rather than making up conditions
            logger.info("No search terms found in transcript - will return empty results")
            params["query.term"] = "NONEXISTENT_CONDITION_THAT_WILL_RETURN_ZERO_RESULTS"
        
        # Filter by recruiting status - only actively recruiting trials
        params["filter.overallStatus"] = ["RECRUITING"]
        
        # Build advanced filters (these use AND logic to narrow down results)
        advanced_filters = []
        
        # Add age filter if available - find studies where patient's age falls within study's age range
        if patient.date_of_birth:
            from datetime import date
            today = date.today()
            age_years = today.year - patient.date_of_birth.year - ((today.month, today.day) < (patient.date_of_birth.month, patient.date_of_birth.day))
            if age_years and isinstance(age_years, int):
                # Find studies where: study's minimum age <= patient's age <= study's maximum age
                # This means: study's minimum age <= patient's age AND study's maximum age >= patient's age
                advanced_filters.append(f"AREA[MinimumAge]RANGE[MIN, {age_years} years] AND AREA[MaximumAge]RANGE[{age_years} years, MAX]")
        
        # Add sex filter if available
        if patient.sex:
            if patient.sex.upper() in ["MALE", "FEMALE"]:
                advanced_filters.append(f'AREA[Sex]"{patient.sex.upper()}"')
        
        # Add location filter if available
        if patient.address:
            lat = getattr(patient.address, "latitude", None)
            lon = getattr(patient.address, "longitude", None)
            
            # If lat/lon available, use geo filter with expanded range
            if lat and lon:
                params["filter.geo"] = f"distance({lat},{lon},500mi)"
            # Otherwise, use location-based search with broader scope
            else:
                location_queries = []
                if patient.address.city:
                    location_queries.append(f'AREA[LocationCity]"{patient.address.city}"')
                if patient.address.state:
                    location_queries.append(f'AREA[LocationState]"{patient.address.state}"')
                if patient.address.country:
                    location_queries.append(f'AREA[LocationCountry]"{patient.address.country}"')
                if patient.address.zip_code:
                    location_queries.append(f'AREA[LocationZip]"{patient.address.zip_code}"')
                
                # Add broader regional searches if we have state/country
                if patient.address.state:
                    # Search for neighboring states or broader regions
                    location_queries.append(f'AREA[LocationState]"{patient.address.state}"')
                if patient.address.country:
                    # Search within the same country
                    location_queries.append(f'AREA[LocationCountry]"{patient.address.country}"')
                
                if location_queries:
                    # Use OR logic for location to be more inclusive
                    location_query = f"SEARCH[Location]({' OR '.join(location_queries)})"
                    advanced_filters.append(location_query)
        
        # Combine all advanced filters with AND logic
        if advanced_filters:
            params["filter.advanced"] = " AND ".join(advanced_filters)
            logger.info(f"Advanced filters: {params['filter.advanced']}")
        
        return params

    async def _search_trials(self, search_params: Dict[str, Any], return_raw: bool = False) -> Any:
        """
        Search for clinical trials using CTG API
        If return_raw is True, return (studies, raw_response), else just studies.
        """
        try:
            url = f"{self.BASE_URL}/studies"
            processed_params = {}
            for key, value in search_params.items():
                if isinstance(value, list):
                    processed_params[key] = ",".join(value)
                else:
                    processed_params[key] = value
            logger.info(f"Searching CTG API with params: {processed_params}")
            response = await self.client.get(url, params=processed_params)
            response.raise_for_status()
            data = response.json()
            studies = data.get("studies", [])
            logger.info(f"Found {len(studies)} studies in CTG API response")
            if return_raw:
                data["_raw_params"] = processed_params
                return studies, data
            return studies
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error searching CTG API: {e.response.status_code} - {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Error searching CTG API: {e}")
            raise
    
    def _transform_to_clinical_trial(self, trial_data: Dict[str, Any]) -> ClinicalTrial:
        """
        Transform CTG API response to ClinicalTrial domain model
        
        Args:
            trial_data: Trial data from CTG API
            
        Returns:
            ClinicalTrial: Domain model instance
        """
        try:
            # Extract basic information
            protocol_section = trial_data.get("protocolSection", {})
            identification_module = protocol_section.get("identificationModule", {})
            status_module = protocol_section.get("statusModule", {})
            sponsor_module = protocol_section.get("sponsorModule", {})
            description_module = protocol_section.get("descriptionModule", {})
            conditions_module = protocol_section.get("conditionsModule", {})
            arms_interventions_module = protocol_section.get("armsInterventionsModule", {})
            eligibility_module = protocol_section.get("eligibilityModule", {})
            contacts_locations_module = protocol_section.get("contactsLocationsModule", {})
            outcomes_module = protocol_section.get("outcomesModule", {})
            
            # Core identification
            external_id = identification_module.get("nctId", "")
            brief_title = identification_module.get("briefTitle", "")
            official_title = identification_module.get("officialTitle", "")
            
            # Status and sponsor
            status = status_module.get("overallStatus", "")
            sponsor_name = sponsor_module.get("leadSponsor", {}).get("leadSponsorName", "")
            
            # Conditions
            conditions = conditions_module.get("conditions", [])
            
            # Phases
            phases = []
            phase_info = arms_interventions_module.get("phaseInfo", [])
            for phase in phase_info:
                phase_name = phase.get("phase", "")
                if phase_name:
                    phases.append(phase_name)
            
            # Age information
            minimum_age = eligibility_module.get("minimumAge", "")
            maximum_age = eligibility_module.get("maximumAge", "")
            
            # Locations
            locations = []
            location_list = contacts_locations_module.get("locations", [])
            for loc in location_list:
                facility = loc.get("facility", "")
                city = loc.get("city", "")
                state = loc.get("state", "")
                country = loc.get("country", "")
                zip_code = loc.get("zip", "")
                
                location = Location(
                    status=loc.get("status", ""),
                    facility=facility,
                    city=city,
                    state=state,
                    country=country,
                    zip_code=zip_code
                )
                locations.append(location)
            
            # Brief summary
            brief_summary = description_module.get("briefSummary", "")
            
            # Interventions
            interventions = []
            intervention_list = arms_interventions_module.get("interventions", [])
            for intervention in intervention_list:
                intervention_obj = Intervention(
                    type=intervention.get("type", ""),
                    name=intervention.get("name", ""),
                    description=intervention.get("description", "")
                )
                interventions.append(intervention_obj)
            
            # Enrollment count
            enrollment_count = eligibility_module.get("enrollmentCount")
            if enrollment_count:
                try:
                    enrollment_count = int(enrollment_count)
                except (ValueError, TypeError):
                    enrollment_count = None
            
            # Dates
            start_date = None
            start_date_str = status_module.get("startDateStruct", {}).get("date")
            if start_date_str:
                try:
                    start_date = datetime.fromisoformat(start_date_str.replace("Z", "+00:00"))
                except (ValueError, TypeError):
                    pass
            
            # Detailed information
            detailed_description = description_module.get("detailedDescription", "")
            study_type = status_module.get("studyType", "")
            primary_purpose = status_module.get("primaryPurpose", "")
            
            # Eligibility
            eligibility_criteria = eligibility_module.get("eligibilityCriteria", "")
            sex = eligibility_module.get("sex", "")
            healthy_volunteers_raw = eligibility_module.get("healthyVolunteers")
            # Convert string to boolean
            healthy_volunteers = None
            if healthy_volunteers_raw:
                if isinstance(healthy_volunteers_raw, str):
                    healthy_volunteers = healthy_volunteers_raw.lower() in ["yes", "true", "1"]
                else:
                    healthy_volunteers = bool(healthy_volunteers_raw)
            standard_ages = eligibility_module.get("standardAges", [])
            
            # Create ClinicalTrial instance
            clinical_trial = ClinicalTrial(
                external_id=external_id,
                brief_title=brief_title,
                official_title=official_title,
                status=status,
                conditions=conditions,
                sponsor_name=sponsor_name,
                phases=phases,
                minimum_age=minimum_age,
                maximum_age=maximum_age,
                locations=locations,
                brief_summary=brief_summary,
                interventions=interventions,
                enrollment_count=enrollment_count,
                start_date=start_date,
                detailed_description=detailed_description,
                study_type=study_type,
                primary_purpose=primary_purpose,
                eligibility_criteria=eligibility_criteria,
                sex=sex,
                healthy_volunteers=healthy_volunteers,
                standard_ages=standard_ages,
                source_registry=self.SOURCE_REGISTRY,
                registry_version=self.VERSION
            )
            
            return clinical_trial
            
        except Exception as e:
            logger.error(f"Error transforming trial data: {e}")
            logger.error(f"Trial data: {trial_data}")
            raise
    
    async def health_check(self) -> bool:
        """
        Check if CTG API is accessible
        
        Returns:
            bool: True if API is accessible, False otherwise
        """
        try:
            # Simple search to test API connectivity
            test_params = {
                "format": "json",
                "pageSize": 1,
                "fields": ["NCTId"]
            }
            
            await self._search_trials(test_params)
            logger.info("CTG API health check passed")
            return True
            
        except Exception as e:
            logger.error(f"CTG API health check failed: {e}")
            return False