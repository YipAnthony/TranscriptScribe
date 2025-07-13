# TranscriptScribe

AI-powered transcript processing and clinical trial matching platform.

## Overview

### Architecture
1. **Backend**: Ports/Adapter Architecture with Python, Gemini Flash, CrewAI, CTG API
2. **Frontend**: To be implemented (will use ShadCN + Supabase for quick setup)

## Project Structure

```
TranscriptScribe/
├── backend/                  # Python FastAPI backend
│   ├── domain/              # Business entities
│   │   ├── patient.py
│   │   ├── parsed_transcript.py
│   │   └── clinical_trial.py
│   ├── core/                # Business logic
│   │   └── services/        # Core services
│   │       ├── transcript_service.py
│   │       └── clinical_trial_service.py
│   ├── ports/               # Interface definitions
│   │   ├── llm.py
│   │   ├── transcript_analyzer.py
│   │   ├── db.py
│   │   └── clinical_trials.py
│   ├── adapters/            # External service implementations
│   │   ├── llm/
│   │   │   └── gemini.py
│   │   ├── transcript_analyzer/
│   │   │   └── crewai.py
│   │   ├── db/
│   │   │   └── supabase.py
│   │   └── clinical_trials/
│   │       └── ctg_v2_0_4.py
│   ├── handlers/            # Request handlers
│   │   ├── transcript.py
│   │   └── clinical_trial.py
│   ├── routes/              # API routes
│   │   └── api_router.py
│   ├── tests/               # Test files
│   │   ├── core/
│   │   ├── adapters/
│   │   └── handlers/
│   ├── main.py              # Application entry point
│   ├── pyproject.toml       # Poetry configuration
│   ├── poetry.lock          # Poetry lock file
│   ├── env.example          # Environment variables template
│   └── README.md            # Backend documentation
│
└── README.md                # This file
```

## Technology Stack

### Backend
- **Framework**: FastAPI (Python)
- **Architecture**: Ports/Adapter (Hexagonal Architecture)
- **Dependency Management**: Poetry
- **LLM**: Google Gemini 2.0 Flash
- **Transcript Analysis**: CrewAI
- **Database**: Supabase (PostgreSQL)
- **Clinical Trials**: ClinicalTrials.gov API v2.0.4
- **Code Quality**: Black, isort, mypy, flake8

### Frontend (To be implemented)
- Will use ShadCN or Supabase for quick setup
- React/TypeScript with Next.js
- Supabase Auth integration

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │
│   (ShadCN +     │◄──►│   (Python/      │
│   Supabase)     │    │   FastAPI)      │
└─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   External      │
                       │   Services      │
                       │   (Gemini,      │
                       │   CTG API, etc) │
                       └─────────────────┘
```

## Getting Started

### Prerequisites
- Python 3.10+
- Poetry (for dependency management)
- Supabase CLI

### Backend Setup
```bash
cd backend
poetry install
cp env.example .env
# Edit .env with your actual values
poetry run python main.py
```

### Run Unit Tests
```bash
poetry run pytest
```
