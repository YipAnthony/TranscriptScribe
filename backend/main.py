from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import logging
from contextlib import asynccontextmanager

# Import logging configuration
from logging_config import setup_logging, get_logger

# Import dependencies module
from dependencies import set_dependencies

# Import router
from routes.api_router import api_router

# Setup logging
setup_logging()
logger = get_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("🚀 Starting TranscriptScribe API...")
    
    try:
        # Import classes (done here to avoid circular imports)
        logger.info("📦 Importing application modules...")
        from adapters.llm.gemini import GeminiAdapter
        from adapters.db.supabase import SupabaseAdapter
        from adapters.clinical_trials.ctg_v2_0_4 import CTGV2_0_4Adapter
        from core.services.transcript_service import TranscriptService
        from core.services.clinical_trial_service import ClinicalTrialService
        from handlers.transcript import TranscriptHandler
        from handlers.clinical_trial import ClinicalTrialHandler
        
        # Initialize adapters
        logger.info("🔧 Initializing adapters...")
        import os
        
        # Initialize LLM adapter
        llm_api_key = os.getenv("GOOGLE_AI_API_KEY")
        if not llm_api_key:
            logger.error("❌ GOOGLE_AI_API_KEY is not set")
            raise ValueError("GOOGLE_AI_API_KEY is not set")
        logger.info("✅ LLM API key found")
        llm_adapter = GeminiAdapter(api_key=llm_api_key)
        logger.info("✅ LLM adapter initialized")
        
        # Initialize and test database connection
        logger.info("🗄️ Initializing database adapter...")
        db_adapter = SupabaseAdapter()
        
        # Test database connectivity
        try:
            logger.info("🔍 Testing database connectivity...")
            # Test a simple operation - try to get a non-existent transcript with proper UUID
            import uuid
            test_uuid = str(uuid.uuid4())
            db_adapter.get_transcript(test_uuid)
            logger.info("✅ Database connection successful")
        except Exception as e:
            # If it's a "not found" error, that's expected and means connection works
            if "not found" in str(e).lower() or "does not exist" in str(e).lower():
                logger.info("✅ Database connection successful (expected 'not found' error)")
            else:
                logger.error(f"❌ Database connection failed: {e}")
                raise RuntimeError(f"Failed to connect to database: {e}")
        
        # Initialize clinical trials adapter
        logger.info("🔬 Initializing clinical trials adapter...")
        clinical_trials_adapter = CTGV2_0_4Adapter()
        logger.info("✅ Clinical trials adapter initialized")
        
        # Initialize services with dependencies
        logger.info("⚙️ Initializing services...")
        transcript_service = TranscriptService(
            db_adapter=db_adapter,
            llm_adapter=llm_adapter
        )
        logger.info("✅ Transcript service initialized")
        
        clinical_trial_service = ClinicalTrialService(
            db_adapter=db_adapter,
            clinical_trials_adapter=clinical_trials_adapter,
            llm_adapter=llm_adapter
        )
        logger.info("✅ Clinical trial service initialized")
        
        # Initialize handlers with services
        logger.info("🎯 Initializing handlers...")
        transcript_handler = TranscriptHandler(transcript_service)
        clinical_trial_handler = ClinicalTrialHandler(clinical_trial_service)
        logger.info("✅ Handlers initialized")
        
        # Set dependencies for injection
        set_dependencies(
            transcript_handler=transcript_handler,
            clinical_trial_handler=clinical_trial_handler
        )
        
        logger.info("🎉 All dependencies initialized successfully")
        
    except Exception as e:
        logger.error(f"💥 Failed to initialize dependencies: {e}", exc_info=True)
        raise
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down TranscriptScribe API...")

# Create FastAPI app
app = FastAPI(
    title="TranscriptScribe API",
    description="AI-powered transcript processing and clinical trial matching platform",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    # TODO: Update this later once i finish the frontend
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router with dependencies
app.include_router(api_router)

# Health check endpoint (root level)
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    logger.info("🏥 Health check requested")
    return {
        "status": "healthy",
        "service": "TranscriptScribe API",
        "version": "1.0.0"
    }

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    logger.info("🏠 Root endpoint accessed")
    return {
        "message": "Welcome to TranscriptScribe API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "redoc": "/redoc",
            "api": "/api/v1"
        }
    }

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for unhandled errors"""
    logger.error(f"💥 Unhandled exception in {request.url.path}: {exc}", exc_info=True)
    return HTTPException(
        status_code=500,
        detail="Internal server error"
    )

if __name__ == "__main__":
    import uvicorn
    logger.info("🚀 Starting development server...")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 