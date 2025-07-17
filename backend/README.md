
## API Documentation**: [https://transcriptscribe-production.up.railway.app/docs](https://transcriptscribe-production.up.railway.app/docs)

## Backend Directory Overview

### Core: business logic
- #### Services
    - Transcript Service
    - Clinical Trial Service
    - Chat Service

### Development

- **Run tests**:
```bash
# Run all unit tests
poetry run pytest tests/ -v

# Run all live tests (requires API keys, from .env file)
poetry run pytest live_tests/ -v -s
```

### Future Nice To Haves
- Event queue integration
- Break down current LLM calls into more fine tuned agents (maybe consider crewai)
- Emit new_recommended_trails event, have some event handler forwarding to a messaging service for patients.