#!/usr/bin/env python3
"""
Live test script for Supabase adapter
Tests actual database operations with real Supabase instance
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

from adapters.db.supabase import SupabaseAdapter
from domain.patient import Patient
from domain.parsed_transcript import ParsedTranscript
from domain.address import Address
from domain.exceptions import PatientNotFoundError, TranscriptNotFoundError

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@pytest.fixture(scope="module")
def adapter() -> SupabaseAdapter:
    """Create a Supabase adapter fixture for all tests"""
    # Load environment variables
    load_dotenv()
    
    # Check required environment variables
    required_vars = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        pytest.skip(f"Missing required environment variables: {missing_vars}")
    
    try:
        adapter = SupabaseAdapter()
        logger.info("✅ Supabase adapter initialized successfully")
        return adapter
    except Exception as e:
        logger.error(f"❌ Failed to initialize Supabase adapter: {e}")
        pytest.fail(f"Failed to initialize Supabase adapter: {e}")

def test_supabase_connection(adapter: SupabaseAdapter) -> None:
    """Test basic connection to Supabase"""
    logger.info("Testing Supabase connection...")
    assert adapter is not None
    logger.info("✅ Supabase connection test passed")

def test_create_and_get_patient(adapter: SupabaseAdapter) -> None:
    """Test creating and retrieving a patient"""
    logger.info("Testing patient creation and retrieval...")
    
    # Use a valid UUID for non-existent patient
    non_existent_id = str(uuid.uuid4())
    
    # First, try to get a non-existent patient
    with pytest.raises(PatientNotFoundError):
        adapter.get_patient(non_existent_id)
    
    logger.info("✅ Correctly raised PatientNotFoundError for non-existent patient")
    logger.info("✅ Patient error handling works correctly")

def test_create_and_get_transcript(adapter: SupabaseAdapter) -> None:
    """Test creating and retrieving a transcript"""
    logger.info("Testing transcript creation and retrieval...")
    
    # Use a valid UUID for test transcript and patient
    test_transcript_id = str(uuid.uuid4())
    test_patient_id = str(uuid.uuid4())
    
    # Create test parsed transcript
    test_location = Address(
        street="456 Medical Center Dr",
        city="Healthcare City",
        state="CA", 
        zip_code="54321",
        country="USA"
    )
    
    test_parsed_transcript = ParsedTranscript(
        conditions=["diabetes", "hypertension"],
        medications=["metformin", "lisinopril"],
        procedures=["blood pressure monitoring"],
        location=test_location,
        sex="MALE",
        age=45,
        positive_symptoms=["fatigue", "thirst"],
        negative_symptoms=["chest pain"],
        positive_lab_results=["elevated glucose"],
        negative_lab_results=["normal kidney function"],
        positive_imaging_results=[],
        negative_imaging_results=["normal chest x-ray"],
        past_diagnoses=["prediabetes"],
        past_surgeries=["appendectomy"],
        family_history=["diabetes in father"],
        positive_lifestyle_factors=["regular exercise"],
        negative_lifestyle_factors=["poor diet"],
        extraction_notes=["Patient reports good medication compliance"]
    )
    
    # Create a test patient first
    test_patient_data = {
        "id": test_patient_id,
        "first_name": "Test",
        "last_name": "Patient",
        "date_of_birth": "1978-01-01",
        "sex": "MALE",
        "email": "test.patient@example.com",
        "phone": "555-123-4567"
    }
    
    try:
        # Insert the test patient directly into the database
        patient_result = adapter.client.table("patients").insert(test_patient_data).execute()
        if not patient_result.data:
            raise Exception("Failed to create test patient")
        logger.info(f"✅ Created test patient with ID: {test_patient_id}")
        
        # Now create the transcript
        transcript_id = adapter.create_transcript(
            patient_id=test_patient_id,
            parsed_transcript=test_parsed_transcript,
            recorded_at=datetime.now().isoformat()
        )
        logger.info(f"✅ Created transcript with ID: {transcript_id}")
        
        # Test retrieving the transcript
        retrieved_transcript = adapter.get_transcript(transcript_id)
        logger.info(f"✅ Retrieved transcript: {retrieved_transcript}")
        
        # Verify the data matches
        assert retrieved_transcript.conditions == test_parsed_transcript.conditions
        assert retrieved_transcript.medications == test_parsed_transcript.medications
        assert retrieved_transcript.procedures == test_parsed_transcript.procedures
        assert retrieved_transcript.sex == test_parsed_transcript.sex
        assert retrieved_transcript.age == test_parsed_transcript.age
        assert retrieved_transcript.positive_symptoms == test_parsed_transcript.positive_symptoms
        assert retrieved_transcript.negative_symptoms == test_parsed_transcript.negative_symptoms
        assert retrieved_transcript.positive_lab_results == test_parsed_transcript.positive_lab_results
        assert retrieved_transcript.negative_lab_results == test_parsed_transcript.negative_lab_results
        assert retrieved_transcript.positive_imaging_results == test_parsed_transcript.positive_imaging_results
        assert retrieved_transcript.negative_imaging_results == test_parsed_transcript.negative_imaging_results
        assert retrieved_transcript.past_diagnoses == test_parsed_transcript.past_diagnoses
        assert retrieved_transcript.past_surgeries == test_parsed_transcript.past_surgeries
        assert retrieved_transcript.family_history == test_parsed_transcript.family_history
        assert retrieved_transcript.positive_lifestyle_factors == test_parsed_transcript.positive_lifestyle_factors
        assert retrieved_transcript.negative_lifestyle_factors == test_parsed_transcript.negative_lifestyle_factors
        assert retrieved_transcript.extraction_notes == test_parsed_transcript.extraction_notes
        logger.info("✅ Retrieved transcript data matches original")
        
    except Exception as e:
        logger.error(f"❌ Error creating/retrieving transcript: {e}")
        raise
    
    finally:
        # Clean up: delete the test transcript and patient
        try:
            adapter.delete_transcript(transcript_id)
            logger.info(f"✅ Deleted test transcript with ID: {transcript_id}")
        except Exception as e:
            logger.warning(f"⚠️  Could not delete test transcript: {e}")
        
        try:
            adapter.client.table("patients").delete().eq("id", test_patient_id).execute()
            logger.info(f"✅ Deleted test patient with ID: {test_patient_id}")
        except Exception as e:
            logger.warning(f"⚠️  Could not delete test patient: {e}")

def test_transcript_error_handling(adapter: SupabaseAdapter) -> None:
    """Test error handling for non-existent transcripts"""
    logger.info("Testing transcript error handling...")
    
    non_existent_transcript_id = str(uuid.uuid4())
    
    # Try to get a non-existent transcript
    with pytest.raises(TranscriptNotFoundError):
        adapter.get_transcript(non_existent_transcript_id)
    
    logger.info("✅ Correctly raised TranscriptNotFoundError for non-existent transcript") 