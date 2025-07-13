
## Backend Directory Overview

### Core: business logic
- #### Services
    - Transcript Service
    - Clinical Trial Service
### Domain: business entities
- patient
- parsed_transcript
- clinical_trial
### Ports
- LLM
- Transcript Analyzer
- DB
- ClinicalTrials

### Adapter
- LLM: Gemini 2.0 flash
- Transcript Analyzer: CrewAI
- DB: Supabase (postgres)
- Clinical Trails: clinicaltrails.gov api

## Directory Overview
```
backend/
│
├── domain/                  # Business entities
│   ├── patient.py
│   ├── parsed_transcript.py
│   └── clinical_trial.py
│
├── core/                    # Business logic
│   └── services/
│       ├── transcript_service.py           # Handles transcript processing and storage
│       └── clinical_trial_service.py       # Finds recommended trials based on patient profile
│
├── ports/                   # Interface definitions
│   ├── llm.py                  # Interface for all LLM integration
│   ├── transcript_analyzer.py  # Interface for analyzing raw appointment transcripts
│   ├── db.py                   # Interface for db operations
│   ├── clinical_trials.py      # Interface for accessing clinical trails info
├── adapters/                # External service implementations
│   ├── llm/
│   │   └── gemini.py              # Implemented via gemini 2.0 flash (bc cheap)
│   ├── transcript_analyzer/
│   │   └── crewai.py              # Implemented via crewai module
│   ├── db/
│   │   └── supabase.py            # Implemented via supabase
│   ├── clinical_trials/
│   │   └── ctg_v2_0_4.py          # Implemented via v2.0.4 of CTG api
│
├── schemas/                 # API request/response models (Pydantic)
│   ├── transcript.py
│   └── clinical_trial.py
│
├── handlers/                # HTTP request handlers
│   ├── transcript.py
│   └── clinical_trial.py
│
├── routes/                  # API routes
│   └── api_router.py
│
├── main.py
├── pyproject.toml              # Poetry configuration
├── poetry.lock                 # Poetry lock file
├── env.example                 # Environment variables template
│
├── tests/                     # Unit tests (fast, mocked)
│   ├── core/
│   ├── adapters/
│   └── handlers/
│
├── live_tests/                # Live tests (require external services)
│   ├── test_llm_gemini_live.py    # Live Gemini API tests
│   └── test_supabase_live.py      # Live Supabase tests
```

## Setup Instructions

### Prerequisites
- Python 3.10+
- Poetry (for dependency management)
- Supabase account and project

### Installation

1. **Install Poetry** (if not already installed):
   ```bash
   curl -sSL https://install.python-poetry.org | python3 -
   ```

2. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

3. **Install dependencies**:
   ```bash
   poetry install
   ```

4. **Set up environment variables**:
   ```bash
   cp env.example .env
   # Edit .env with your actual values
   ```

5. **Run the application**:
   ```bash
   poetry run python main.py
   ```

### Development

- **Run tests**: `poetry run pytest`
- **Format code**: `poetry run black .`
- **Sort imports**: `poetry run isort .`
- **Type checking**: `poetry run mypy .`
- **Lint code**: `poetry run flake8 .`

## Testing Strategy

This project uses a two-tier testing approach to balance speed and reliability:

### Unit Tests (`tests/`)
- **Purpose**: Fast, isolated tests that verify individual components
- **External Dependencies**: Mocked using `unittest.mock`
- **Use Case**: Daily development, CI/CD, regression testing

**Running Unit Tests:**
```bash
# Run all unit tests
poetry run pytest tests/ -v

# Run specific test file
poetry run pytest tests/adapters/test_llm_gemini.py -v

# Run tests with coverage
poetry run pytest tests/ --cov=. --cov-report=html
```

### Live Tests (`live_tests/`)
- **Purpose**: Integration tests that verify real external service interactions
- **External Dependencies**: Real APIs (Gemini, Supabase, etc.)
- **Use Case**: Pre-deployment verification + initial adapter setup testing

**Running Live Tests:**
```bash
# Run all live tests (requires API keys, from .env file)
poetry run pytest live_tests/ -v

# Run specific live test
poetry run pytest live_tests/test_llm_gemini_live.py -v
```

### Environment Variables for Live Tests
```bash
# Required for live tests
GOOGLE_AI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_key
```

### Test Structure
```
tests/
├── adapters/              # Adapter unit tests
│   └── test_llm_gemini.py # LLM adapter tests (mocked)
├── core/                  # Core service tests
├── handlers/              # HTTP handler tests
└── ...

live_tests/
├── test_llm_gemini_live.py  # Real Gemini API tests
└── test_supabase_live.py    # Real Supabase tests
```

### Testing Best Practices
- **Unit tests first**: Write unit tests for all new functionality
- **Mock external services**: Use `unittest.mock` to isolate components
- **Live tests sparingly**: Use live tests for integration verification
- **Environment isolation**: Unit tests should never require real API keys
- **Fast feedback**: Unit tests should run in < 1 second for quick development cycles

### Architecture

This backend follows a clean architecture pattern with clear separation of concerns:

- **Domain**: Contains business entities and domain models
- **Core**: Contains business logic and use cases
- **Ports**: Define interfaces for external dependencies
- **Adapters**: Implement external service integrations
- **Schemas**: API request/response models (Pydantic)
- **Handlers**: Handle HTTP requests and coordinate between layers

### Future Nice To Haves
- Event queue integration.
- Emit new_recommended_trails event, have some event handler forwarding to a messaging service for patients.