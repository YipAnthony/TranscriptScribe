"""
Live test for CTG API connectivity and basic functionality

This test verifies that the CTG API adapter can successfully connect to the
ClinicalTrials.gov API and perform basic operations.
"""

import pytest
import asyncio
import logging
from datetime import date
from adapters.clinical_trials.ctg_v2_0_4 import CTGV2_0_4Adapter
from domain.patient import Patient
from domain.parsed_transcript import ParsedTranscript
from domain.address import Address

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@pytest.fixture(scope="module")
def ctg_adapter():
    return CTGV2_0_4Adapter()

@pytest.fixture(scope="module")
def sample_patient():
    return Patient(
        id="test-patient-123",
        first_name="John",
        last_name="Doe",
        date_of_birth=None,
        sex="MALE",
        address=None
    )

@pytest.fixture(scope="module")
def sample_parsed_transcript():
    return ParsedTranscript(
        conditions=["Type 2 Diabetes", "Hypertension"],
        medications=["Metformin", "Lisinopril"],
        age=45,
        sex="MALE"
    )

@pytest.mark.asyncio
async def test_ctg_api_connectivity(ctg_adapter):
    """Test basic CTG API connectivity"""
    logger.info("Testing CTG API connectivity...")
    
    health_status = await ctg_adapter.health_check()
    logger.info(f"CTG API health check: {'PASSED' if health_status else 'FAILED'}")
    
    if not health_status:
        logger.error("CTG API health check failed - cannot proceed with other tests")
        return False
    
    return True

@pytest.mark.asyncio
async def test_basic_search(ctg_adapter, sample_patient, sample_parsed_transcript):
    """Test basic search functionality"""
    print("\n==================================================")
    print("Running: Basic Search")
    print("==================================================")
    
    trials = await ctg_adapter.find_recommended_clinical_trials(sample_patient, sample_parsed_transcript)
    
    if trials:
        print(f"\n✅ Found {len(trials)} trial(s):")
        for i, trial in enumerate(trials[:3], 1):
            print(f"   {i}. {trial.brief_title} ({trial.external_id}) - {trial.status}")
        return True
    else:
        print("\n❌ No results found")
        return False

@pytest.mark.asyncio
async def test_specific_trial_retrieval(ctg_adapter):
    """Test retrieving a specific trial by NCT ID"""
    logger.info("Testing specific trial retrieval...")
    
    test_nct_id = "NCT06094010"
    
    try:
        trial = await ctg_adapter.get_clinical_trial(test_nct_id)
        
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

@pytest.mark.asyncio
async def test_search_parameters(ctg_adapter, sample_patient, sample_parsed_transcript):
    """Test search parameter building"""
    logger.info("Testing search parameter building...")
    
    params = ctg_adapter._build_search_params(sample_patient, sample_parsed_transcript)
    
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
    assert "AREA[Condition]\"Type 2 Diabetes\"" in params["query.term"]
    assert "AREA[InterventionName]\"Metformin\"" in params["query.term"]
    assert "RECRUITING" in params["filter.overallStatus"]
    # Check that sex filter is included (since patient has sex="MALE")
    assert "AREA[Sex]\"MALE\"" in params.get("filter.advanced", "")
    
    print("✅ Search parameter building test PASSED")
    return True

@pytest.mark.asyncio
async def test_location_based_search(ctg_adapter, sample_patient, sample_parsed_transcript):
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
    
    trials = await ctg_adapter.find_recommended_clinical_trials(patient, parsed_transcript)
    
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

@pytest.mark.asyncio
async def test_or_based_search(ctg_adapter):
    """Test the new OR-based search functionality"""
    print("\n" + "="*60)
    print("TESTING OR-BASED SEARCH FUNCTIONALITY")
    print("="*60)
    
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
    
    print("\n🔍 Searching with OR-based query and all filters...")
    trials = await ctg_adapter.find_recommended_clinical_trials(patient, parsed_transcript)
    
    if trials:
        print(f"\n✅ Found {len(trials)} trial(s):")
        for i, trial in enumerate(trials[:3], 1):
            print(f"   {i}. {trial.brief_title} ({trial.external_id}) - {trial.status}")
        return True
    else:
        print("\n❌ No results found")
        return False

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