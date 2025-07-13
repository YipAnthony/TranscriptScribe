import os
import logging
import pytest
from adapters.llm.gemini import GeminiAdapter
from adapters.transcript_analyzer.gemini import GeminiTranscriptAnalyzer
from domain.parsed_transcript import ParsedTranscript

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_gemini_transcript_analyzer_live():
    """Live test of GeminiTranscriptAnalyzer with real LLM calls"""
    
    # Check for API key
    api_key = os.getenv("GOOGLE_AI_API_KEY")
    if not api_key:
        pytest.skip("GOOGLE_AI_API_KEY environment variable not set")
    
    try:
        # Initialize adapters
        print("🔧 Initializing Gemini LLM adapter...")
        llm_adapter = GeminiAdapter(api_key=api_key)
        
        print("🔧 Initializing Gemini transcript analyzer...")
        transcript_analyzer = GeminiTranscriptAnalyzer(llm_adapter=llm_adapter)
        
        # Test cases with realistic medical transcripts
        test_cases = [
            {
                "name": "Patient Provider Conversation #1",
                "transcript": """
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
                """,
               "expected_conditions": [
                    "type 2 diabetes",
                    "hypertension",
                    "sleep apnea",
                    "heart failure"
                ],
                "expected_medications": [
                    "metformin",
                    "lisinopril"
                ],
                "expected_procedures": [
                    "echocardiogram",
                    "sleep study"
                ],
                "expected_age": 62,
                "expected_sex": "MALE",
                "expected_location": "San Francisco"
            }
        ]
        
        # Run tests
        results = []
        for i, test_case in enumerate(test_cases, 1):
            print(f"\n{'='*50}")
            print(f"🧪 Test {i}: {test_case['name']}")
            print(f"{'='*50}")
            
            try:
                # Analyze transcript
                result = transcript_analyzer.analyze_transcript(test_case["transcript"])
                
                # Print results
                print(f"✅ Analysis completed successfully")
                print(f"📋 Conditions: {result.conditions}")
                print(f"💊 Medications: {result.medications}")
                print(f"🔬 Procedures: {result.procedures}")
                print(f"👤 Age: {result.age}")
                print(f"👤 Sex: {result.sex}")
                if result.location:
                    print(f"📍 Location: {result.location.city}, {result.location.state}")
                else:
                    print(f"📍 Location: None")
                
                # Print comprehensive medical record
                print(f"😷 Positive Symptoms: {result.positive_symptoms}")
                print(f"✅ Negative Symptoms: {result.negative_symptoms}")
                print(f"🔬 Positive Lab Results: {result.positive_lab_results}")
                print(f"✅ Negative Lab Results: {result.negative_lab_results}")
                print(f"📷 Positive Imaging: {result.positive_imaging_results}")
                print(f"✅ Negative Imaging: {result.negative_imaging_results}")
                print(f"📋 Past Diagnoses: {result.past_diagnoses}")
                print(f"🔪 Past Surgeries: {result.past_surgeries}")
                print(f"👨‍👩‍👧‍👦 Family History: {result.family_history}")
                print(f"💪 Positive Lifestyle: {result.positive_lifestyle_factors}")
                print(f"🚭 Negative Lifestyle: {result.negative_lifestyle_factors}")
                print(f"📝 Extraction Notes: {result.extraction_notes}")
                print()
                
                # Basic validation
                success = True
                if not result.conditions:
                    print("⚠️  Warning: No conditions extracted")
                    success = False
                if not result.medications and not result.procedures:
                    print("⚠️  Warning: No medications or procedures extracted")
                    success = False
                
                results.append({
                    "test_case": test_case["name"],
                    "success": success,
                    "result": result
                })
                
            except Exception as e:
                print(f"❌ Error analyzing transcript: {e}")
                results.append({
                    "test_case": test_case["name"],
                    "success": False,
                    "error": str(e)
                })
        
        # Summary
        print(f"\n{'='*50}")
        print(f"📊 TEST SUMMARY")
        print(f"{'='*50}")
        successful_tests = sum(1 for r in results if r["success"])
        total_tests = len(results)
        print(f"✅ Successful tests: {successful_tests}/{total_tests}")
        
        for result in results:
            status = "✅ PASS" if result["success"] else "❌ FAIL"
            print(f"{status}: {result['test_case']}")
            if not result["success"] and "error" in result:
                print(f"  ❌ Error: {result['error']}")
        print(f"{'='*50}")
        
        # Assert that all tests passed
        assert successful_tests == total_tests, f"Only {successful_tests}/{total_tests} tests passed"
        
    except Exception as e:
        print(f"❌ Test setup failed: {e}")
        raise 