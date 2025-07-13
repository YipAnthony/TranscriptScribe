#!/usr/bin/env python3
"""
Test runner for TranscriptService live tests
"""

import os
import sys
import subprocess
from pathlib import Path

def main():
    """Run the transcript service live tests"""
    
    # Get the backend directory
    backend_dir = Path(__file__).parent
    
    # Check if we're in the right directory
    if not (backend_dir / "live_tests" / "test_transcript_service_live.py").exists():
        print("❌ Error: test_transcript_service_live.py not found")
        print("Make sure you're running this from the backend directory")
        sys.exit(1)
    
    # Check environment variables
    required_vars = [
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY", 
        "GOOGLE_AI_API_KEY"
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print("❌ Missing required environment variables:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\nPlease set these environment variables and try again.")
        sys.exit(1)
    
    print("✅ Environment variables check passed")
    print("🚀 Running TranscriptService live tests...")
    print("=" * 50)
    
    # Run the test
    test_file = backend_dir / "live_tests" / "test_transcript_service_live.py"
    result = subprocess.run([
        sys.executable, "-m", "pytest", 
        str(test_file), 
        "-v", "-s", "--tb=short"
    ], cwd=backend_dir)
    
    if result.returncode == 0:
        print("=" * 50)
        print("✅ All TranscriptService live tests passed!")
    else:
        print("=" * 50)
        print("❌ Some TranscriptService live tests failed!")
        sys.exit(result.returncode)

if __name__ == "__main__":
    main() 