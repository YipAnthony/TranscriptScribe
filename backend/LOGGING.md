# Logging Configuration

This document describes the logging setup for the TranscriptScribe backend application.

## Overview

The application uses a centralized logging configuration that provides structured, emoji-enhanced logs suitable for Railway deployment and debugging.

## Configuration

### Log Levels

- **DEBUG**: Detailed information for debugging
- **INFO**: General information about application flow
- **WARNING**: Warning messages for potential issues
- **ERROR**: Error messages for failed operations
- **CRITICAL**: Critical errors that may cause application failure

### Environment Variables

- `LOG_LEVEL`: Set the logging level (default: INFO)
  - Options: DEBUG, INFO, WARNING, ERROR, CRITICAL

## Usage

### In Railway

The logs will automatically appear in Railway's log viewer. The structured format makes it easy to track:

- Application startup and initialization
- API requests and responses
- Database operations
- LLM calls and responses
- Clinical trial searches
- Error conditions

### Local Development

Logs are output to stdout with timestamps and module names:

```
2025-07-13 22:11:17 - main - INFO - 🚀 Starting TranscriptScribe API...
2025-07-13 22:11:17 - main - INFO - 🔧 Initializing adapters...
2025-07-13 22:11:17 - main - INFO - ✅ LLM adapter initialized
```

## Log Categories

### Application Lifecycle
- 🚀 Startup messages
- 🔧 Initialization steps
- ✅ Success confirmations
- 🛑 Shutdown messages

### API Operations
- 📝 Transcript processing
- 🔬 Clinical trial operations
- 🏥 Health checks
- 💥 Error handling

### Database Operations
- 💾 Data storage
- 📋 Data retrieval
- ⚠️ Not found conditions
- ❌ Database errors

### External Services
- 🤖 LLM API calls
- 🌐 ClinicalTrials.gov API calls
- 📊 Response parsing
- 🔍 Search operations

### Error Tracking
- ❌ Error conditions
- ⚠️ Warning conditions
- 🚨 Critical issues

## Debugging Tips

1. **Set LOG_LEVEL=DEBUG** for maximum detail
2. **Look for emoji patterns** to quickly identify log types
3. **Check timestamps** to track operation timing
4. **Follow request IDs** through the log flow
5. **Monitor error patterns** with ❌ emoji

## Example Debug Flow

When a transcript is processed, you'll see logs like:

```
📝 API: Processing transcript for patient: patient-123
🔄 Processing transcript for patient patient-123
🧠 Starting transcript analysis with LLM adapter...
🤖 Calling Gemini LLM (JSON mode) - prompt length: 2048
✅ LLM response received successfully
✅ LLM response parsed successfully
💾 Creating transcript for patient patient-123
✅ Created transcript with ID: transcript-456
🔬 API: Creating clinical trial recommendations for patient: patient-123
🔍 Finding recommended clinical trials for patient John Doe
🌐 Searching ClinicalTrials.gov API...
✅ Received 15 trials from API
🎉 Successfully found 15 clinical trials
```

This makes it easy to track where issues occur in the processing pipeline. 