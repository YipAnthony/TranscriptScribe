
## Backend Directory Overview

### Core: business logic
- #### Services
    - Transcript Processor
    - Trial Matcher
- ### Domain Models
    - patient
    - parsed_transcript
    - clinical_trial
### Ports
- LLM
- Agents/Workflow
- DB
- EventQueue
- ClinicalTrials

### Adapter
- LLM: Gemini 2.0 flash
- Agents/Workflow: CrewAI
- DB: Supabase (postgres)
- EventQueue: event queue service
- Clinical Trails: clinicaltrails.gov api

## Directory Overview
```
deepscribe-app/
│
├── core/
│   ├── services/
│   │   ├── transcript_processor.py         # Parses transcript via LLM & stores to our db
│   │   ├── trial_matcher.py                # Finds matching trials based on patient profile
│   │   
│   │
│   ├── domain_models/
│   │   ├── patient.py
│   │   ├── parsed_transcript.py
│   │   ├── clinical_trial.py
│
├── ports/
│   ├── llm.py                  # call_llm(prompt: str) -> str
│   ├── agents.py               # create_agent(config: dict) -> Agent / run_agent(agent, input)
│   ├── db.py                   # create_parsed_transcript(data), get_parsed_transcript(id)
│   ├── event_queue.py          # add_event(event: Event)
│   ├── clinical_trials.py      # find_trials(patient_profile: PatientProfile) -> list[ClinicalTrial]
│
├── adapters/
│   ├── llm/
│   │   └── gemini.py              # Implemented via gemini 2.0 flash (bc cheap)
│   ├── agents/
│   │   └── crewai.py              # Implemented via crewai module
│   ├── db/
│   │   └── supabase.py            # Implemented via supabase
│   ├── event_queue/
│   │   └── event_queue.py         # Implemented by calling our own eventqueue service
│   ├── clinical_trials/
│   │   └── ctg_v2_0_4.py          # Implements find_trials() using v2.0.4 of CTG api
│
├── handlers/
│   ├── transcript.py
│   ├── trial.py
│
├── routes/
│   └── api_router.py
│
├── main.py
│
├── tests/
│   ├── core/
│   ├── adapters/
│   ├── handlers/

