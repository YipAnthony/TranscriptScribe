#!/usr/bin/env python3
"""
Live test script for TranscriptService
Tests the complete flow from raw transcript to parsed transcript to database storage
"""

import pytest
import os
import sys
import logging
import uuid
from datetime import datetime
from dotenv import load_dotenv

# Add the backend directory to the path so we can import our modules
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from core.services.transcript_service import TranscriptService
from adapters.db.supabase import SupabaseAdapter
from adapters.llm.gemini import GeminiAdapter
from domain.parsed_transcript import ParsedTranscript
from domain.exceptions import TranscriptNotFoundError

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@pytest.fixture(scope="module")
def transcript_service() -> TranscriptService:
    """Create a TranscriptService fixture with real adapters"""
    # Load environment variables
    load_dotenv()
    
    # Check required environment variables
    required_vars = [
        "SUPABASE_URL", 
        "SUPABASE_SERVICE_ROLE_KEY",
        "GOOGLE_AI_API_KEY"
    ]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        pytest.skip(f"Missing required environment variables: {missing_vars}")
    
    try:
        # Initialize adapters
        db_adapter = SupabaseAdapter()
        api_key = os.getenv("GOOGLE_AI_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_AI_API_KEY environment variable is required")
        llm_adapter = GeminiAdapter(api_key=api_key)
        
        # Create service
        service = TranscriptService(db_adapter=db_adapter, llm_adapter=llm_adapter)
        logger.info("✅ TranscriptService initialized successfully")
        return service
    except Exception as e:
        logger.error(f"❌ Failed to initialize TranscriptService: {e}")
        pytest.fail(f"Failed to initialize TranscriptService: {e}")

@pytest.fixture(scope="module")
def db_adapter() -> SupabaseAdapter:
    """Create a Supabase adapter fixture for cleanup operations"""
    load_dotenv()
    return SupabaseAdapter()

def test_transcript_service_initialization(transcript_service: TranscriptService) -> None:
    """Test that the transcript service is properly initialized"""
    logger.info("Testing TranscriptService initialization...")
    assert transcript_service is not None
    assert transcript_service.db_adapter is not None
    assert transcript_service.llm_adapter is not None
    logger.info("✅ TranscriptService initialization test passed")

def test_raw_transcript_processing_and_storage(transcript_service: TranscriptService, db_adapter: SupabaseAdapter) -> None:
    """Test the complete flow: raw transcript -> LLM parsing -> database storage -> retrieval -> cleanup"""
    logger.info("Testing complete transcript processing flow...")
    
    # Generate test IDs
    test_patient_id = str(uuid.uuid4())
    transcript_id = None
    
    # Sample raw medical transcript
    raw_transcript = """
    Dr. Reynolds: Good morning, Mr. Alvarez. How are you feeling today?

    Patient (Mr. Alvarez): Morning, doctor. I've been feeling really fatigued lately. I get short of breath even when walking to the mailbox.

    Dr. Reynolds: I see. And when did this fatigue start?

    Mr. Alvarez: Around 3 months ago. I thought it was just getting older, but it's been getting worse. Some days I can't get out of bed without feeling lightheaded.

    Dr. Reynolds: Any chest pain or palpitations?

    Mr. Alvarez: No chest pain, but sometimes I feel my heart racing, especially at night.

    Dr. Reynolds: Do you have a history of heart disease or any chronic conditions?

    Mr. Alvarez: I was diagnosed with Type 2 diabetes about five years ago. I also have high blood pressure. No history of heart disease that I know of.

    Dr. Reynolds: Are you currently taking any medications?

    Mr. Alvarez: Yes, metformin 1000mg twice daily for diabetes, and lisinopril 10mg daily for blood pressure.

    Dr. Reynolds: Any recent weight loss or appetite changes?

    Mr. Alvarez: I've actually lost about 10 pounds over the past two months, but I haven't been trying.

    Dr. Reynolds: And how's your sleep?

    Mr. Alvarez: Not great. I wake up frequently. Sometimes I wake up gasping for air.

    Dr. Reynolds: That might suggest sleep apnea. Have you ever had a sleep study done?

    Mr. Alvarez: No, never.

    Dr. Reynolds: Alright. I'd like to get some labs and refer you for an echocardiogram and a sleep study. Based on what you're telling me, we might be looking at early heart failure or sleep apnea exacerbated by your diabetes and hypertension.

    Mr. Alvarez: That sounds serious...

    Dr. Reynolds: We'll take it step by step. Also, I'm going to look into any ongoing clinical trials for patients with your conditions—especially those addressing fatigue in patients with diabetes and hypertension.

    Mr. Alvarez: That would be great. I'm open to anything that might help.
    """
    
    try:
        # Step 0: Create a test patient first
        logger.info("Step 0: Creating test patient...")
        test_patient_data = {
            "id": test_patient_id,
            "external_id": f"TEST_PATIENT_{test_patient_id[:8]}",
            "first_name": "Test",
            "last_name": "Patient",
            "date_of_birth": "1978-01-01",
            "sex": "MALE",
            "email": "test.patient@example.com",
            "phone": "555-123-4567"
        }
        
        patient_result = db_adapter.client.table("patients").insert(test_patient_data).execute()
        if not patient_result.data:
            raise Exception("Failed to create test patient")
        logger.info(f"✅ Created test patient with ID: {test_patient_id}")
        
        # Step 1: Process raw transcript through the service
        logger.info("Step 1: Processing raw transcript...")
        transcript_id = transcript_service.process_raw_transcript(
            patient_id=test_patient_id,
            raw_transcript=raw_transcript,
            recorded_at=datetime.now().isoformat()
        )
        logger.info(f"✅ Transcript processed successfully with ID: {transcript_id}")
        
        # Step 2: Retrieve the transcript from database
        logger.info("Step 2: Retrieving transcript from database...")
        retrieved_transcript = transcript_service.get_transcript(transcript_id)
        logger.info(f"✅ Retrieved transcript: {retrieved_transcript}")
        
        # Step 3: Verify the parsed transcript structure
        logger.info("Step 3: Verifying parsed transcript structure...")
        assert isinstance(retrieved_transcript, ParsedTranscript)
        assert retrieved_transcript.conditions is not None
        assert retrieved_transcript.medications is not None
        assert retrieved_transcript.procedures is not None
        assert retrieved_transcript.positive_symptoms is not None
        assert retrieved_transcript.negative_symptoms is not None
        logger.info("✅ Parsed transcript structure is valid")
        
        # Step 4: Verify specific extracted data
        logger.info("Step 4: Verifying extracted medical data...")
        
        # Check that diabetes was extracted as a condition (flexible matching)
        assert any("diabetes" in condition.lower() for condition in retrieved_transcript.conditions), \
            f"Expected condition containing 'diabetes', got: {retrieved_transcript.conditions}"
        
        # Check that hypertension was extracted as a condition (flexible matching)
        assert any("hypertension" in condition.lower() or "blood pressure" in condition.lower() for condition in retrieved_transcript.conditions), \
            f"Expected condition containing 'hypertension' or 'blood pressure', got: {retrieved_transcript.conditions}"
        
        # Check that metformin was extracted as a medication (flexible matching)
        assert any("metformin" in med.lower() for med in retrieved_transcript.medications), \
            f"Expected medication containing 'metformin', got: {retrieved_transcript.medications}"
        
        # Check that lisinopril was extracted as a medication (flexible matching)
        assert any("lisinopril" in med.lower() for med in retrieved_transcript.medications), \
            f"Expected medication containing 'lisinopril', got: {retrieved_transcript.medications}"
        
        # Check that fatigue was extracted as a symptom (flexible matching)
        assert any("fatigue" in symptom.lower() for symptom in retrieved_transcript.positive_symptoms), \
            f"Expected symptom containing 'fatigue', got: {retrieved_transcript.positive_symptoms}"
        
        # Check that shortness of breath was extracted as a symptom (flexible matching)
        assert any("breath" in symptom.lower() or "shortness" in symptom.lower() for symptom in retrieved_transcript.positive_symptoms), \
            f"Expected symptom containing 'breath' or 'shortness', got: {retrieved_transcript.positive_symptoms}"
        
        # Check that symptoms were extracted
        assert len(retrieved_transcript.positive_symptoms) > 0, \
            "Expected positive symptoms to be extracted"
        
        # Check that procedures were mentioned (echocardiogram, sleep study)
        assert len(retrieved_transcript.procedures) > 0, \
            "Expected procedures to be extracted"
        
        # Note: No lab results are explicitly mentioned in this transcript
        # The doctor mentions wanting to "get some labs" but doesn't specify results
        
        logger.info("✅ Medical data extraction verified")
        
        # Step 5: Test the medical profile method
        logger.info("Step 5: Testing medical profile generation...")
        medical_profile = retrieved_transcript.get_medical_profile()
        assert isinstance(medical_profile, dict)
        assert "core_medical" in medical_profile
        assert "demographics" in medical_profile
        assert "symptoms" in medical_profile
        logger.info("✅ Medical profile generation works correctly")
        
        # Step 6: Verify database persistence by retrieving directly from adapter
        logger.info("Step 6: Verifying database persistence...")
        direct_retrieved = db_adapter.get_transcript(transcript_id)
        assert direct_retrieved.conditions == retrieved_transcript.conditions
        assert direct_retrieved.medications == retrieved_transcript.medications
        assert direct_retrieved.age == retrieved_transcript.age
        assert direct_retrieved.sex == retrieved_transcript.sex
        logger.info("✅ Database persistence verified")
        
        logger.info("✅ Complete transcript processing flow test passed")
        
    except Exception as e:
        logger.error(f"❌ Error in transcript processing flow: {e}")
        raise
    
    finally:
        # Step 7: Cleanup - delete the test transcript and patient
        if transcript_id:
            try:
                logger.info(f"Step 7: Cleaning up test transcript {transcript_id}...")
                db_adapter.delete_transcript(transcript_id)
                logger.info(f"✅ Successfully deleted test transcript {transcript_id}")
                
                # Verify deletion
                with pytest.raises(TranscriptNotFoundError):
                    db_adapter.get_transcript(transcript_id)
                logger.info("✅ Transcript deletion verified")
                
            except Exception as e:
                logger.warning(f"⚠️  Could not delete test transcript: {e}")
        
        # Clean up test patient
        try:
            db_adapter.client.table("patients").delete().eq("id", test_patient_id).execute()
            logger.info(f"✅ Successfully deleted test patient {test_patient_id}")
        except Exception as e:
            logger.warning(f"⚠️  Could not delete test patient: {e}")

def test_transcript_processing_with_json_input(transcript_service: TranscriptService, db_adapter: SupabaseAdapter) -> None:
    """Test processing a transcript that's already in JSON format"""
    logger.info("Testing transcript processing with JSON input...")
    
    # Generate test ID
    test_patient_id = str(uuid.uuid4())
    transcript_id = None
    
    # Sample transcript in JSON format
    json_transcript = {
        "conversation": [
            {
                "speaker": "Dr. Chen",
                "text": "Good afternoon, Mrs. Rodriguez. I see you're here for a follow-up on your asthma. How have you been feeling?"
            },
            {
                "speaker": "Patient", 
                "text": "Not great, doctor. My asthma has been acting up more than usual. I've been using my rescue inhaler almost daily."
            },
            {
                "speaker": "Dr. Chen",
                "text": "That's concerning. Are you taking your daily controller medication as prescribed?"
            },
            {
                "speaker": "Patient",
                "text": "Yes, I take my Advair twice daily, but it doesn't seem to be working as well as before."
            },
            {
                "speaker": "Dr. Chen", 
                "text": "Let me check your lung function. Your peak flow is 65% of your personal best, which indicates moderate asthma exacerbation. I'm going to increase your Advair dosage and add a short course of prednisone."
            }
        ],
        "patient_info": {
            "name": "Maria Rodriguez",
            "age": 42,
            "sex": "FEMALE",
            "diagnoses": ["asthma", "seasonal allergies"]
        }
    }
    
    try:
        # Create a test patient first
        test_patient_data = {
            "id": test_patient_id,
            "external_id": f"TEST_PATIENT_{test_patient_id[:8]}",
            "first_name": "Test",
            "last_name": "Patient",
            "date_of_birth": "1980-01-01",
            "sex": "FEMALE",
            "email": "test.patient2@example.com",
            "phone": "555-987-6543"
        }
        
        patient_result = db_adapter.client.table("patients").insert(test_patient_data).execute()
        if not patient_result.data:
            raise Exception("Failed to create test patient")
        logger.info(f"✅ Created test patient with ID: {test_patient_id}")
        
        # Process JSON transcript
        transcript_id = transcript_service.process_raw_transcript(
            patient_id=test_patient_id,
            raw_transcript=json_transcript,
            recorded_at=datetime.now().isoformat()
        )
        logger.info(f"✅ JSON transcript processed successfully with ID: {transcript_id}")
        
        # Retrieve and verify
        retrieved_transcript = transcript_service.get_transcript(transcript_id)
        assert isinstance(retrieved_transcript, ParsedTranscript)
        assert retrieved_transcript.age == 42
        assert retrieved_transcript.sex == "FEMALE"
        assert len(retrieved_transcript.positive_symptoms) > 0
        
        # Check that asthma was extracted as a condition (flexible matching)
        assert any("asthma" in condition.lower() for condition in retrieved_transcript.conditions), \
            f"Expected condition containing 'asthma', got: {retrieved_transcript.conditions}"
        
        # Check that Advair was extracted as a medication (flexible matching)
        assert any("advair" in med.lower() for med in retrieved_transcript.medications), \
            f"Expected medication containing 'advair', got: {retrieved_transcript.medications}"
        
        logger.info("✅ JSON transcript processing verified")
        
    except Exception as e:
        logger.error(f"❌ Error in JSON transcript processing: {e}")
        raise
    
    finally:
        # Cleanup
        if transcript_id:
            try:
                db_adapter.delete_transcript(transcript_id)
                logger.info(f"✅ Cleaned up JSON test transcript {transcript_id}")
            except Exception as e:
                logger.warning(f"⚠️  Could not delete JSON test transcript: {e}")
        
        # Clean up test patient
        try:
            db_adapter.client.table("patients").delete().eq("id", test_patient_id).execute()
            logger.info(f"✅ Cleaned up JSON test patient {test_patient_id}")
        except Exception as e:
            logger.warning(f"⚠️  Could not delete JSON test patient: {e}")

def test_transcript_service_error_handling(transcript_service: TranscriptService) -> None:
    """Test error handling with invalid input"""
    logger.info("Testing error handling...")
    
    # Test with empty transcript
    with pytest.raises(Exception):
        transcript_service.process_raw_transcript(
            patient_id=str(uuid.uuid4()),
            raw_transcript=""
        )
    logger.info("✅ Empty transcript error handling works")
    
    # Test with invalid patient ID format
    with pytest.raises(Exception):
        transcript_service.process_raw_transcript(
            patient_id="invalid-id",
            raw_transcript="Some text"
        )
    logger.info("✅ Invalid patient ID error handling works")

if __name__ == "__main__":
    # Run the tests
    pytest.main([__file__, "-v", "-s"]) 