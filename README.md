# TranscriptScribe

AI-powered transcript processing and clinical trial matching platform.

## Key Functions
1. **Upload and process medical transcripts** - Healthcare providers can upload patient consultation transcripts and have them automatically analyzed by AI
2. **Generate clinical trial recommendations** - The system should match patients to relevant clinical trials based on their medical profile extracted from transcripts + an external api (CTG)
3. **Chat with AI about trials** - Patients should be able to ask questions about clinical trials and get intelligent responses
4. **Manage patient data** - Store and retrieve patient information, appointments, and trial recommendations

## Core Entities

**Core entities for this mvp:**
- **Patient** - Medical patient with demographics
- **Transcript** -  Structure data parsed from a patient/provider transcript
- **ClinicalTrial** - Clinical Trial data
- **ChatSession/ChatMessage** - Conversation history between users and AI chatbot about trials

## API Interface
- REST endpoints documented here:  [https://transcriptscribe-production.up.railway.app/docs](https://transcriptscribe-production.up.railway.app/docs)

## Architecture Overview
![high level design](https://github.com/YipAnthony/TranscriptScribe/blob/main/design.png)

### Architecture
- **Frontend Layer:** Next.js with TypeScript, ShadCN UI, Supabase Client + Auth
- **Backend Layer:** FastAPI (Python), Hexagonal architecture (Ports/Adapters)
    - **Service Layer:** Core business logic services
        - **TranscriptService** - Handles transcript generation & processing
        - **ClinicalTrialService** - Manages trial matching, recommendations, and ranking
        - **ChatService** - Handles patient to AI conversations about trials
    - **Ports:**
        - **DB Port** (interface for database operations)
        - **LLM Port** (interface for language model/AI operations)
        - **Clinical Trials API Port** (interface for external clinical trial data)
    - **Adapters:**
        - **Supabase Adapter** (implements DB Port)
        - **Gemini Adapter** (implements LLM Port)
        - **CTG API Adapter** (implements Clinical Trials API Port)
    
    - This structure allows the backend to remain decoupled from specific infrastructure, making it easy to swap out adapters or add new integrations in the future. Also easier to mock/test individual layers.
        - E.g Adding another clinical trials adapter (non CTG) or another LLM model 
    - The service layer contains the core business logic and orchestrates the interactions between ports and adapters.

## Project Structure

```
TranscriptScribe/
├── backend/                  # Python FastAPI backend
│   ├── domain/              # Business entities
│   │   ├── patient.py
│   │   ├── parsed_transcript.py
│   │   ├── clinical_trial.py
│   │   ├── chat_message.py
│   │   ├── chat_session.py
│   │   └── address.py
│   ├── core/                # Business logic
│   │   └── services/        # Core services
│   │       ├── transcript_service.py
│   │       ├── clinical_trial_service.py
│   │       └── chat_service.py
│   ├── ports/               # Interface definitions
│   │   ├── llm.py
│   │   ├── db.py
│   │   └── clinical_trials.py
│   ├── adapters/            # External service implementations
│   │   ├── llm/
│   │   │   └── gemini.py
│   │   ├── db/
│   │   │   └── supabase.py
│   │   └── clinical_trials/
│   │       └── ctg_v2_0_4.py
│   ├── handlers/            # Request handlers
│   │   ├── transcript.py
│   │   ├── clinical_trial.py
│   │   └── chat.py
│   ├── routes/              # API routes
│   │   └── api_router.py
│   ├── schemas/             # API request/response models
│   │   ├── transcript.py
│   │   ├── clinical_trial.py
│   │   └── chat.py
│   ├── tests/               # Unit tests (fast, mocked)
│   │   ├── core/
│   │   │   └── services/
│   │   ├── adapters/
│   │   │   ├── clinical_trials/
│   │   │   └── llm/
│   │   └── handlers/
│   ├── live_tests/          # Live tests (require external services)
│   ├── auth.py              # Authentication middleware
│   ├── dependencies.py      # Dependency injection setup
│   ├── main.py              # Application entry point
│   ├── pyproject.toml       # Poetry configuration
│   ├── poetry.lock          # Poetry lock file
│   ├── env.example          # Environment variables template
│   └── README.md            # Backend documentation
├── frontend/                # Next.js frontend application
│   ├── app/                 # Next.js app directory
│   ├── components/          # React components
│   ├── lib/                 # Utility libraries
│   ├── hooks/               # Custom React hooks
│   ├── types/               # TypeScript type definitions
│   ├── middleware.ts        # Next.js middleware
│   ├── package.json         # Node.js dependencies
│   └── README.md            # Frontend documentation
├── supabase/                # Database migrations and configuration
│   ├── config.toml          # Supabase configuration
│   ├── migrations/          # Database migration files
│   └── README.md            # Database setup documentation
├── .github/                 # GitHub workflows config
│   └── workflows/           # CI/CD workflows
│       ├── unit-tests.yml   # Backend unit test automation
│       └── deploy-migrations.yml  # Supabase migration deployment
└── README.md                # This file
```



## Getting Started Locally

### Prerequisites
- Python 3.10
- Poetry (for dependency management)
- Supabase CLI
- Google AI Key

### Supabase Setup
```bash
# Start local Supabase database
cd ../supabase
supabase start
# Apply migration files to local supabase instance
supabase migration up
# Make sure to keep this terminal open, supabase url, anon key, and private key are displayed there
```

### Stepup env files
#### Frontend env (create .env in frontend directory)
```
<!-- Values can be found in the terminal you started supabse in -->
NEXT_PUBLIC_SUPABASE_URL=updateMe
NEXT_PUBLIC_SUPABASE_ANON_KEY=updateMe
```
#### Backend env (create .env in backend directory)
```
# Supabase Configuration
<!-- Values found in terminal you ran supabase in -->
SUPABASE_URL=temp
SUPABASE_ANON_KEY=temp
SUPABASE_SERVICE_ROLE_KEY=temp
SUPABASE_JWT_SECRET=your_supabase_jwt_secret_here

# CTG Proxy
CTG_PROXY_URL=http://localhost:3000/api/proxy/clinical-trials

# Google Gemini Configuration
GOOGLE_AI_API_KEY=temp

# Application Configuration
DEBUG=True
LOG_LEVEL=INFO
API_HOST=0.0.0.0
API_PORT=8000
```

### Run Backend Locally
```bash
cd backend
poetry install
cp env.example .env
# Start the API server
poetry run python main.py
```

### Run Frontend Locally

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`

### General Application Instructions
> **Note:** The combination of both the admin and patient portals within the same frontend application was done purely for ease of development and to showcase the different functionalities side by side. In a real-world production application, I would 100% not do this. Or I would at least have clear isolated & auth protected routesfor each user type. 

### Creating an admin user locally:
- Go to `http://localhost:3000/signup` and enter any email/pass
- Go back to sign in, and enter that email/pass

### Go To Admin Portal
- Click add new patient, enter some data (make sure city/state are valid)
- Click Create Appointment. Either paste in the transcript you want to use or click generate conversation.
- Appointment/transcript should be loaded in. Click ... (actions) to view the transcript details (parsed by backend transcript service)
    - Note: if no trials were suggested, then the generated transcript might've been too specific :/ Try creating a new appointment or pasting in your own.
- Click view recommended trials to see what trials were recommened for this patient. 
    - As an admin user, if you feel the trial is valid, click "Recommend to patient" and enter in whatever note you want to send to the patient.

### Go to Patient Portal
- Click the Home button on the top left
- Proxy in as the patient you just created
- In the appointment row, click on view recommended trials
- Open up the trial from this list, and click "Chat with AI Bot" on the top right of the details panel. Ask the AI bot any questions about the trial.
- Go back to the main patient dashboard and click the Clinical Trials tab.
- This view shows any trials recommened by the provider or that you have personally saved.