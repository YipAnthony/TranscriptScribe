import json
import logging
from typing import Union, Dict, Any, List, Optional
from datetime import datetime
import httpx
from ports.clinical_trials import ClinicalTrialsPort
from domain.patient import Patient
from domain.parsed_transcript import ParsedTranscript
from domain.clinical_trial import ClinicalTrial, SourceRegistry, Location, Intervention, Contact, Outcome

logger = logging.getLogger(__name__)

class CTGV2_0_4Adapter(ClinicalTrialsPort):
    """
    ClinicalTrials.gov API v2.0.4 adapter
    
    This adapter implements the ClinicalTrialsPort interface to interact with
    the ClinicalTrials.gov API version 2.0.4 for finding and retrieving clinical trials.
    """
    
    VERSION = "2.0.4"
    SOURCE_REGISTRY = SourceRegistry.CLINICALTRIALS_GOV
    BASE_URL = "https://clinicaltrials.gov/api/v2"  # Use legacy API which is more permissive
    
    def __init__(self, timeout: int = 30):
        """
        Initialize CTG API adapter
        
        Args:
            timeout: HTTP request timeout in seconds
        """
        self.timeout = timeout
        self.client = httpx.AsyncClient(timeout=timeout)
        logger.info(f"Initialized CTG API v{self.VERSION} adapter")
    
    def _convert_state_abbreviation_to_full_name(self, state_abbr: str) -> str:
        """
        Convert state abbreviation to full name for ClinicalTrials.gov API
        
        Args:
            state_abbr: State abbreviation (e.g., "TX", "CA")
            
        Returns:
            str: Full state name (e.g., "Texas", "California")
        """
        state_mapping = {
            "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California",
            "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "FL": "Florida", "GA": "Georgia",
            "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa",
            "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
            "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri",
            "MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey",
            "NM": "New Mexico", "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio",
            "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
            "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont",
            "VA": "Virginia", "WA": "Washington", "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming"
        }
        
        # Convert to uppercase and look up
        state_abbr_upper = state_abbr.upper().strip()
        return state_mapping.get(state_abbr_upper, state_abbr)  # Return original if not found
    
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
        try:
            # Build comprehensive OR-based search with all available filters
            search_params = self._build_search_params(patient, parsed_transcript)
            
            trials_data = await self._search_trials(search_params)
            
            clinical_trials = []
            for trial_data in trials_data:
                try:
                    clinical_trial = self._transform_to_clinical_trial(trial_data)
                    clinical_trials.append(clinical_trial)
                except Exception as e:
                    logger.error(f"Error transforming trial data: {e}")
                    continue
            
            logger.info(f"Found {len(clinical_trials)} clinical trials")
            return clinical_trials
            
        except Exception as e:
            logger.error(f"Error finding clinical trials: {e}")
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
        try:
            # Search for specific trial by NCT ID
            search_params = {
                "filter.ids": [trial_id],
                "fields": [
                    "NCTId", "BriefTitle", "OfficialTitle", "OverallStatus", "Condition", 
                    "LeadSponsorName", "Phase", "MinimumAge", "MaximumAge", "Location", 
                    "BriefSummary", "Intervention", "EnrollmentCount", "StartDate", 
                    "DetailedDescription", "StudyType", "CompletionDate", 
                    "PrimaryCompletionDate", "EligibilityCriteria", "Sex", "HealthyVolunteers", 
                    "CentralContact", "OverallOfficial", "LastUpdatePostDate"
                ]
            }
            
            trials_data = await self._search_trials(search_params)
            
            if not trials_data:
                raise Exception(f"Clinical trial with NCT ID {trial_id} not found")
            
            # Return the first (and should be only) trial
            return self._transform_to_clinical_trial(trials_data[0])
            
        except Exception as e:
            logger.error(f"Error getting clinical trial {trial_id}: {e}")
            raise
    

    
    def _build_search_params(self, patient: Patient, parsed_transcript: ParsedTranscript) -> Dict[str, Any]:
        """
        Build search parameters for CTG API based on patient and transcript data
        Uses OR-based searching to be more inclusive of relevant trials
        """
        params = {
            "format": "json",
            "pageSize": 50,  # Limit results for initial implementation
            "fields": [
                "NCTId", "BriefTitle", "OfficialTitle", "OverallStatus", "Condition", 
                "LeadSponsorName", "Phase", "MinimumAge", "MaximumAge", "Location", 
                "BriefSummary", "Intervention", "EnrollmentCount", "StartDate", 
                "DetailedDescription", "StudyType", "CompletionDate", 
                "PrimaryCompletionDate", "EligibilityCriteria", "Sex", "HealthyVolunteers", 
                "ArmGroup", "CentralContact", "OverallOfficial", "LastUpdatePostDate"
            ],
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
                # Include both the specific sex and "All" to be more inclusive
                advanced_filters.append(f'(AREA[Sex]"{patient.sex.upper()}" OR AREA[Sex]"All")')
        
        # Add location filter - hardcode USA as the country
        location_queries = []
        
        # Always include USA in the search
        location_queries.append('AREA[LocationCountry]"United States"')
        
        # If patient has specific location data, add state to the search (but not city for flexibility)
        if patient.address and patient.address.state:
            # Convert state abbreviation to full name for ClinicalTrials.gov API
            full_state_name = self._convert_state_abbreviation_to_full_name(patient.address.state)
            location_queries.append(f'AREA[LocationState]"{full_state_name}"')
        
        # Always add location filter for USA
        if location_queries:
            # Use SEARCH[Location] to ensure both country and state criteria are applied within the same location record
            location_query = f"SEARCH[Location]({' AND '.join(location_queries)})"
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
            sponsor_collaborators_module = protocol_section.get("sponsorCollaboratorsModule", {})
            description_module = protocol_section.get("descriptionModule", {})
            conditions_module = protocol_section.get("conditionsModule", {})
            design_module = protocol_section.get("designModule", {})
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
            
            # Sponsor information - try multiple sources
            sponsor_name = ""
            # First, try sponsorModule.leadSponsor.leadSponsorName (test data and some API responses)
            sponsor_module = protocol_section.get("sponsorModule", {})
            lead_sponsor_mod = sponsor_module.get("leadSponsor", {})
            if lead_sponsor_mod:
                sponsor_name = lead_sponsor_mod.get("leadSponsorName", "")
            # If not found, try sponsorCollaboratorsModule.leadSponsor.name (some API responses)
            if not sponsor_name:
                sponsor_collaborators_module = protocol_section.get("sponsorCollaboratorsModule", {})
                lead_sponsor = sponsor_collaborators_module.get("leadSponsor", {})
                if lead_sponsor:
                    sponsor_name = lead_sponsor.get("name", "")
            
            # Conditions
            conditions = conditions_module.get("conditions", [])
            
            # Phases from design module and armsInterventionsModule
            phases = []
            # 1. designModule.phases (API response)
            phases_data = design_module.get("phases", [])
            for phase in phases_data:
                if phase and phase != "NA":
                    phases.append(phase)
            # 2. armsInterventionsModule.phaseInfo (test data and some API responses)
            phase_info_data = arms_interventions_module.get("phaseInfo", [])
            for phase_info in phase_info_data:
                phase_val = phase_info.get("phase")
                if phase_val and phase_val != "NA":
                    phases.append(phase_val)
            # Deduplicate
            phases = list(dict.fromkeys(phases))
            
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
            
            # Enrollment count from design module
            enrollment_count = None
            enrollment_info = design_module.get("enrollmentInfo", {})
            if enrollment_info:
                enrollment_count = enrollment_info.get("count")
                if enrollment_count:
                    try:
                        enrollment_count = int(enrollment_count)
                    except (ValueError, TypeError):
                        enrollment_count = None
            
            # Dates with proper structure handling
            start_date = None
            start_date_struct = status_module.get("startDateStruct", {})
            if start_date_struct:
                start_date_str = start_date_struct.get("date")
                if start_date_str:
                    try:
                        # Handle different date formats (YYYY-MM or YYYY-MM-DD)
                        if len(start_date_str) == 7:  # YYYY-MM format
                            start_date_str += "-01"  # Add day
                        start_date = datetime.fromisoformat(start_date_str.replace("Z", "+00:00"))
                    except (ValueError, TypeError):
                        pass
            
            completion_date = None
            completion_date_struct = status_module.get("completionDateStruct", {})
            if completion_date_struct:
                completion_date_str = completion_date_struct.get("date")
                if completion_date_str:
                    try:
                        if len(completion_date_str) == 7:  # YYYY-MM format
                            completion_date_str += "-01"  # Add day
                        completion_date = datetime.fromisoformat(completion_date_str.replace("Z", "+00:00"))
                    except (ValueError, TypeError):
                        pass
            
            primary_completion_date = None
            primary_completion_date_struct = status_module.get("primaryCompletionDateStruct", {})
            if primary_completion_date_struct:
                primary_completion_date_str = primary_completion_date_struct.get("date")
                if primary_completion_date_str:
                    try:
                        if len(primary_completion_date_str) == 7:  # YYYY-MM format
                            primary_completion_date_str += "-01"  # Add day
                        primary_completion_date = datetime.fromisoformat(primary_completion_date_str.replace("Z", "+00:00"))
                    except (ValueError, TypeError):
                        pass
            
            # Last updated date
            last_updated = None
            last_update_post_date_struct = status_module.get("lastUpdatePostDateStruct", {})
            if last_update_post_date_struct:
                last_update_date_str = last_update_post_date_struct.get("date")
                if last_update_date_str:
                    try:
                        if len(last_update_date_str) == 7:  # YYYY-MM format
                            last_update_date_str += "-01"  # Add day
                        last_updated = datetime.fromisoformat(last_update_date_str.replace("Z", "+00:00"))
                    except (ValueError, TypeError):
                        pass
            
            # Detailed information
            detailed_description = description_module.get("detailedDescription", "")
            study_type = design_module.get("studyType", "")
            if not study_type:
                study_type = status_module.get("studyType", "")
            primary_purpose = design_module.get("primaryPurpose", "")
            if not primary_purpose:
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
            standard_ages = eligibility_module.get("stdAges", [])
            if not standard_ages:
                standard_ages = eligibility_module.get("standardAges", [])
            
            # Outcomes
            primary_outcomes = []
            primary_outcomes_data = outcomes_module.get("primaryOutcomes", [])
            for outcome in primary_outcomes_data:
                outcome_obj = Outcome(
                    measure=outcome.get("measure", ""),
                    description=outcome.get("description", ""),
                    time_frame=outcome.get("timeFrame", ""),
                    outcome_type="PRIMARY"
                )
                primary_outcomes.append(outcome_obj)
            
            secondary_outcomes = []
            secondary_outcomes_data = outcomes_module.get("secondaryOutcomes", [])
            for outcome in secondary_outcomes_data:
                outcome_obj = Outcome(
                    measure=outcome.get("measure", ""),
                    description=outcome.get("description", ""),
                    time_frame=outcome.get("timeFrame", ""),
                    outcome_type="SECONDARY"
                )
                secondary_outcomes.append(outcome_obj)
            
            # Contacts
            central_contacts = []
            overall_officials = []
            
            # Overall officials
            overall_officials_data = contacts_locations_module.get("overallOfficials", [])
            for official in overall_officials_data:
                contact_obj = Contact(
                    name=official.get("name", ""),
                    role=official.get("role", ""),
                    affiliation=official.get("affiliation", ""),
                    phone=official.get("phone", ""),
                    email=official.get("email", "")
                )
                overall_officials.append(contact_obj)
            
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
                completion_date=completion_date,
                primary_completion_date=primary_completion_date,
                eligibility_criteria=eligibility_criteria,
                sex=sex,
                healthy_volunteers=healthy_volunteers,
                standard_ages=standard_ages,
                primary_outcomes=primary_outcomes,
                secondary_outcomes=secondary_outcomes,
                central_contacts=central_contacts,
                overall_officials=overall_officials,
                source_registry=self.SOURCE_REGISTRY,
                registry_version=self.VERSION,
                last_updated=last_updated
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