"""
Live test for CTG API connectivity and basic functionality

This test verifies that the CTG API adapter can successfully connect to the
ClinicalTrials.gov API and perform basic operations.
"""

import asyncio
import logging
from datetime import date
from adapters.clinical_trials.ctg_v2_0_4 import CTGV2_0_4Adapter
from domain.patient import Patient
from domain.parsed_transcript import ParsedTranscript
from domain.address import Address

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_ctg_api_connectivity():
    """Test basic CTG API connectivity"""
    logger.info("Testing CTG API connectivity...")
    
    async with CTGV2_0_4Adapter(timeout=30) as adapter:
        # Test health check
        health_status = await adapter.health_check()
        logger.info(f"CTG API health check: {'PASSED' if health_status else 'FAILED'}")
        
        if not health_status:
            logger.error("CTG API health check failed - cannot proceed with other tests")
            return False
        
        return True

async def test_basic_search():
    """Test basic search functionality with debug output"""
    print("\n==================================================")
    print("Running: Basic Search (with debug output)")
    print("==================================================")
    
    patient = Patient(
        id="test_patient_001",
        first_name="John",
        last_name="Doe",
        date_of_birth=date(1980, 1, 1),  # 43 years old
        sex="MALE",
        address=Address(
            street="123 Main St",
            city="New York",
            state="NY",
            zip_code="10001",
            country="United States"
        )
    )
    parsed_transcript = ParsedTranscript(
        conditions=["Diabetes"],
        medications=["Metformin", "Lisinopril"],
        procedures=[],
        age=43,
        sex="MALE",
        location=Address(
            street="123 Main St",
            city="New York",
            state="NY",
            zip_code="10001",
            country="United States"
        ),
        positive_symptoms=["Fatigue", "Increased thirst"],
        negative_symptoms=[],
        positive_lab_results=[],
        negative_lab_results=[],
        positive_imaging_results=[],
        negative_imaging_results=[],
        past_diagnoses=[],
        past_surgeries=[],
        family_history=[],
        positive_lifestyle_factors=[],
        negative_lifestyle_factors=[],
        extraction_notes=[]
    )
    
    async with CTGV2_0_4Adapter(timeout=30) as adapter:
        print("\n🔍 Searching with OR-based query and all filters...")
        trials, raw_response = await adapter.find_recommended_clinical_trials_async(patient, parsed_transcript, debug=True)
        print(f"Search Parameters Sent: {raw_response.get('_raw_params', {})}")
        
        if trials:
            print(f"\n✅ Found {len(trials)} trial(s):")
            for i, trial in enumerate(trials[:3], 1):
                print(f"   {i}. {trial.brief_title} ({trial.external_id}) - {trial.status}")
            return True
        else:
            print("\n❌ No results found. Raw API response:")
            print(raw_response)
            return False

async def test_specific_trial_retrieval():
    """Test retrieving a specific trial by NCT ID"""
    logger.info("Testing specific trial retrieval...")
    
    test_nct_id = "NCT06094010"
    
    async with CTGV2_0_4Adapter(timeout=30) as adapter:
        try:
            trial = await adapter.get_clinical_trial_async(test_nct_id)
            
            print(f"\n🔍 SPECIFIC TRIAL RETRIEVED:")
            print(f"   Title: {trial.brief_title}")
            print(f"   NCT ID: {trial.external_id}")
            print(f"   Status: {trial.status}")
            print(f"   Conditions: {', '.join(trial.conditions)}")
            print(f"   Sponsor: {trial.sponsor_name}")
            print(f"   Phases: {', '.join(trial.phases)}")
            print(f"   Study Type: {trial.study_type}")
            print(f"   Age Range: {trial.minimum_age} - {trial.maximum_age}")
            print(f"   Sex: {trial.sex}")
            print(f"   Enrollment: {trial.enrollment_count}")
            print(f"   Start Date: {trial.start_date}")
            print(f"   Summary: {trial.brief_summary[:300] if trial.brief_summary else 'No summary available'}...")
            
            if trial.locations:
                print(f"   Locations: {len(trial.locations)} site(s)")
                for i, loc in enumerate(trial.locations[:3], 1):
                    print(f"     {i}. {loc.facility}, {loc.city}, {loc.state}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error retrieving specific trial: {e}")
            return False

async def test_search_parameters():
    """Test search parameter building"""
    logger.info("Testing search parameter building...")
    
    patient = Patient(
        id="test_patient_002",
        first_name="Jane",
        last_name="Smith",
        date_of_birth=date(1990, 5, 15),  # 33 years old
        sex="FEMALE",
        address=Address(
            street="456 Oak Ave",
            city="Los Angeles",
            state="CA",
            zip_code="90210",
            country="United States"
        )
    )
    
    parsed_transcript = ParsedTranscript(
        conditions=["Breast Cancer"],
        medications=["Tamoxifen"],
        procedures=[],
        age=33,
        sex="FEMALE",
        location=None,
        positive_symptoms=[],
        negative_symptoms=[],
        positive_lab_results=[],
        negative_lab_results=[],
        positive_imaging_results=[],
        negative_imaging_results=[],
        past_diagnoses=[],
        past_surgeries=[],
        family_history=[],
        positive_lifestyle_factors=[],
        negative_lifestyle_factors=[],
        extraction_notes=[]
    )
    
    async with CTGV2_0_4Adapter(timeout=30) as adapter:
        # Test parameter building
        params = adapter._build_search_params(patient, parsed_transcript)
        
        print(f"\n🔧 SEARCH PARAMETERS BUILT:")
        print(f"   Format: {params['format']}")
        print(f"   Page Size: {params['pageSize']}")
        print(f"   OR Query Term: {params.get('query.term', 'None')}")
        print(f"   Status Filter: {params.get('filter.overallStatus', 'None')}")
        print(f"   Advanced Filter: {params.get('filter.advanced', 'None')}")
        print(f"   Fields Count: {len(params['fields'])}")
        
        # Verify key parameters
        assert params["format"] == "json"
        assert params["pageSize"] == 50
        assert "NCTId" in params["fields"]
        # Check that OR query includes both condition and intervention
        assert "AREA[Condition]\"Breast Cancer\"" in params["query.term"]
        assert "AREA[InterventionName]\"Tamoxifen\"" in params["query.term"]
        assert "RECRUITING" in params["filter.overallStatus"]
        # Check that location filter is included
        assert "SEARCH[Location]" in params.get("filter.advanced", "")
        assert "AREA[LocationCity]\"Los Angeles\"" in params.get("filter.advanced", "")
        assert "AREA[LocationState]\"CA\"" in params.get("filter.advanced", "")
        
        print("✅ Search parameter building test PASSED")
        return True

async def test_location_based_search():
    """Test location-based search functionality"""
    logger.info("Testing location-based search...")
    
    # Create patient with specific location
    patient = Patient(
        id="test_patient_003",
        first_name="Bob",
        last_name="Johnson",
        date_of_birth=date(1975, 8, 20),  # 48 years old
        sex="MALE",
        address=Address(
            street="789 Pine St",
            city="Boston",
            state="MA",
            zip_code="02108",
            country="United States"
        )
    )
    
    parsed_transcript = ParsedTranscript(
        conditions=["Hypertension"],
        medications=["Amlodipine"],
        procedures=[],
        age=48,
        sex="MALE",
        location=None,
        positive_symptoms=["High blood pressure"],
        negative_symptoms=[],
        positive_lab_results=[],
        negative_lab_results=[],
        positive_imaging_results=[],
        negative_imaging_results=[],
        past_diagnoses=[],
        past_surgeries=[],
        family_history=[],
        positive_lifestyle_factors=[],
        negative_lifestyle_factors=[],
        extraction_notes=[]
    )
    
    async with CTGV2_0_4Adapter(timeout=30) as adapter:
        try:
            # Search for clinical trials with location filter
            trials = await adapter.find_recommended_clinical_trials_async(patient, parsed_transcript)
            
            print(f"\n📍 LOCATION-BASED SEARCH RESULTS:")
            if patient.address:
                print(f"   Patient Location: {patient.address.city}, {patient.address.state}")
            else:
                print(f"   Patient Location: No address provided")
            print(f"   Search Conditions: {', '.join(parsed_transcript.conditions)}")
            print(f"   Trials Found: {len(trials)}")
            
            if trials:
                print(f"\n🎯 LOCATION-SPECIFIC TRIALS:")
                for i, trial in enumerate(trials[:3], 1):  # Show first 3 trials
                    print(f"   {i}. {trial.brief_title}")
                    print(f"      NCT ID: {trial.external_id}")
                    print(f"      Status: {trial.status}")
                    print(f"      Conditions: {', '.join(trial.conditions)}")
                    
                    # Show location information if available
                    if trial.locations:
                        print(f"      Locations: {len(trial.locations)} site(s)")
                        for j, loc in enumerate(trial.locations[:2], 1):
                            print(f"        {j}. {loc.facility}, {loc.city}, {loc.state}")
                    else:
                        print(f"      Locations: No location data available")
                    print()
                
                return True
            else:
                print("   ❌ No location-specific trials found")
                return True
                
        except Exception as e:
            logger.error(f"Error during location-based search: {e}")
            return False

async def test_or_based_search():
    """Test the new OR-based search functionality"""
    print("\n" + "="*60)
    print("TESTING OR-BASED SEARCH FUNCTIONALITY")
    print("="*60)
    
    async with CTGV2_0_4Adapter() as adapter:
        # Create a patient with diabetes and hypertension
        patient = Patient(
            id="test-patient-001",
            first_name="John",
            last_name="Doe",
            date_of_birth=date(1980, 5, 15),
            sex="MALE",
            address=Address(
                city="New York",
                state="NY",
                country="USA",
                zip_code="10001"
            )
        )
        
        # Create a parsed transcript with multiple conditions and medications
        parsed_transcript = ParsedTranscript(
            conditions=["diabetes", "hypertension", "obesity"],
            medications=["metformin", "lisinopril", "aspirin"],
            procedures=["blood pressure monitoring"],
            positive_symptoms=["fatigue", "frequent urination"],
            age=44,
            sex="MALE"
        )
        
        # Calculate age from date of birth
        today = date.today()
        age = "Unknown"
        if patient.date_of_birth:
            age = today.year - patient.date_of_birth.year - ((today.month, today.day) < (patient.date_of_birth.month, patient.date_of_birth.day))
        print(f"Patient: {patient.first_name} {patient.last_name}, Age: {age}")
        print(f"Conditions: {parsed_transcript.conditions}")
        print(f"Medications: {parsed_transcript.medications}")
        print(f"Procedures: {parsed_transcript.procedures}")
        print(f"Symptoms: {parsed_transcript.positive_symptoms}")
        
        # Test the OR-based search
        print("\nSearching for clinical trials with OR-based query...")
        clinical_trials, raw_response = await adapter.find_recommended_clinical_trials_async(
            patient, parsed_transcript, debug=True
        )
        
        print(f"\nFound {len(clinical_trials)} clinical trials")
        
        # Print search parameters used
        if raw_response and "_raw_params" in raw_response:
            print(f"\nSearch parameters used:")
            for key, value in raw_response["_raw_params"].items():
                print(f"  {key}: {value}")
        
        # Print first few trials
        for i, trial in enumerate(clinical_trials[:5]):
            print(f"\nTrial {i+1}: {trial.brief_title}")
            print(f"  NCT ID: {trial.external_id}")
            print(f"  Status: {trial.status}")
            print(f"  Conditions: {trial.conditions}")
            print(f"  Interventions: {[intervention.name for intervention in trial.interventions]}")
            print(f"  Locations: {len(trial.locations)} locations")
            if trial.locations:
                first_location = trial.locations[0]
                print(f"    First location: {first_location.city}, {first_location.state}, {first_location.country}")
        
        return len(clinical_trials) > 0

async def test_single_condition_search():
    """Test search with a single condition to verify basic functionality"""
    print("\n" + "="*60)
    print("TESTING SINGLE CONDITION SEARCH")
    print("="*60)
    
    async with CTGV2_0_4Adapter() as adapter:
        # Create a patient with minimal information
        patient = Patient(
            id="test-patient-002",
            first_name="Jane",
            last_name="Smith",
            date_of_birth=date(1990, 8, 20),
            sex="FEMALE"
        )
        
        # Create a transcript with just one condition
        parsed_transcript = ParsedTranscript(
            conditions=["diabetes"],
            medications=[],
            procedures=[],
            positive_symptoms=[],
            age=34,
            sex="FEMALE"
        )
        
        # Calculate age from date of birth
        today = date.today()
        age = "Unknown"
        if patient.date_of_birth:
            age = today.year - patient.date_of_birth.year - ((today.month, today.day) < (patient.date_of_birth.month, patient.date_of_birth.day))
        print(f"Patient: {patient.first_name} {patient.last_name}, Age: {age}")
        print(f"Single condition: {parsed_transcript.conditions}")
        
        # Test the search
        print("\nSearching for diabetes trials...")
        clinical_trials, raw_response = await adapter.find_recommended_clinical_trials_async(
            patient, parsed_transcript, debug=True
        )
        
        print(f"\nFound {len(clinical_trials)} clinical trials")
        
        # Print search parameters
        if raw_response and "_raw_params" in raw_response:
            print(f"\nSearch parameters used:")
            for key, value in raw_response["_raw_params"].items():
                print(f"  {key}: {value}")
        
        # Print first few trials
        for i, trial in enumerate(clinical_trials[:3]):
            print(f"\nTrial {i+1}: {trial.brief_title}")
            print(f"  NCT ID: {trial.external_id}")
            print(f"  Status: {trial.status}")
            print(f"  Conditions: {trial.conditions}")
        
        return len(clinical_trials) > 0

async def test_empty_search():
    """Test search behavior when no medical terms are provided"""
    print("\n" + "="*60)
    print("TESTING EMPTY SEARCH (NO MEDICAL TERMS)")
    print("="*60)
    
    async with CTGV2_0_4Adapter() as adapter:
        # Create a patient with no specific medical information
        patient = Patient(
            id="test-patient-003",
            first_name="Bob",
            last_name="Johnson",
            date_of_birth=date(1975, 3, 10),
            sex="MALE"
        )
        
        # Create an empty transcript
        parsed_transcript = ParsedTranscript(
            conditions=[],
            medications=[],
            procedures=[],
            positive_symptoms=[],
            age=49,
            sex="MALE"
        )
        
        # Calculate age from date of birth
        today = date.today()
        age = "Unknown"
        if patient.date_of_birth:
            age = today.year - patient.date_of_birth.year - ((today.month, today.day) < (patient.date_of_birth.month, patient.date_of_birth.day))
        print(f"Patient: {patient.first_name} {patient.last_name}, Age: {age}")
        print("No specific medical conditions or medications")
        
        # Test the search with no medical terms
        print("\nSearching with no medical terms...")
        clinical_trials, raw_response = await adapter.find_recommended_clinical_trials_async(
            patient, parsed_transcript, debug=True
        )
        
        print(f"\nFound {len(clinical_trials)} clinical trials")
        
        # Print search parameters
        if raw_response and "_raw_params" in raw_response:
            print(f"\nSearch parameters used:")
            for key, value in raw_response["_raw_params"].items():
                print(f"  {key}: {value}")
        
        # This should return 0 results since we don't make up conditions anymore
        print(f"\nExpected: 0 results (no fallback conditions)")
        print(f"Actual: {len(clinical_trials)} results")
        
        return len(clinical_trials) == 0  # Test passes if we get 0 results

async def main():
    """Run all live tests"""
    logger.info("Starting CTG API live tests...")
    
    tests = [
        ("API Connectivity", test_ctg_api_connectivity),
        ("Search Parameters", test_search_parameters),
        ("Basic Search", test_basic_search),
        ("Location-Based Search", test_location_based_search),
        ("Specific Trial Retrieval", test_specific_trial_retrieval),
        ("OR-Based Search", test_or_based_search),
        ("Single Condition Search", test_single_condition_search),
        ("Empty Search", test_empty_search),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        logger.info(f"\n{'='*50}")
        logger.info(f"Running test: {test_name}")
        logger.info(f"{'='*50}")
        
        try:
            result = await test_func()
            results.append((test_name, result))
            logger.info(f"Test {test_name}: {'PASSED' if result else 'FAILED'}")
        except Exception as e:
            logger.error(f"Test {test_name} failed with exception: {e}")
            results.append((test_name, False))
    
    # Summary
    logger.info(f"\n{'='*50}")
    logger.info("TEST SUMMARY")
    logger.info(f"{'='*50}")
    
    passed = 0
    for test_name, result in results:
        status = "PASSED" if result else "FAILED"
        logger.info(f"{test_name}: {status}")
        if result:
            passed += 1
    
    logger.info(f"\nOverall: {passed}/{len(results)} tests passed")
    
    if passed == len(results):
        logger.info("🎉 All tests passed! CTG API integration is working correctly.")
    else:
        logger.warning("⚠️  Some tests failed. Check the logs above for details.")

if __name__ == "__main__":
    asyncio.run(main()) 