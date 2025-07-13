
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
├── tests/
│   ├── core/
│   ├── adapters/
│   ├── handlers/

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