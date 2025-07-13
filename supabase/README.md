# Supabase Database Setup

This directory contains the Supabase configuration and database migrations for TranscriptScribe.

## Directory Structure

```
supabase/
├── config.toml          # Supabase configuration
├── migrations/          # Database migration files
├── seed/                # Seed data files
```

## Database Schema

### Tables

1. **transcripts** - Transcript records
   - `id` (UUID, Primary Key)
   - `patient_id` (VARCHAR) - External patient ID reference
   - `parsed_transcript` (JSONB) - Parsed transcript data as JSON
   - `recorded_at` (TIMESTAMP)
   - `status` (VARCHAR) - 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'
   - `processing_metadata` (JSONB)
   - `created_at`, `updated_at` (TIMESTAMP)

## Setup Instructions

### 1. Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Or download from https://supabase.com/docs/guides/cli
```

### 2. Initialize Supabase Project

```bash
# Navigate to project root
cd /path/to/TranscriptScribe
```

### 3. Start Local Development

```bash
# Open Docker
# Start local Supabase instance
supabase start

# This will start:
# - PostgreSQL database on port 54322
# - Supabase API on port 54321
# - Supabase Studio on port 54323
# - Inbucket (email testing) on port 54324
```

### 4. Apply Migrations

```bash
# Apply all migrations
supabase db reset

# Or apply specific migration
supabase db push
```

### 5. View Database

```bash
# Open Supabase Studio
open http://localhost:54323

# Or connect directly to database
psql postgresql://postgres:postgres@localhost:54322/postgres
```

## Environment Variables

After running `supabase start`, the terminal will display your local Supabase credentials. Copy these to your `.env` file in the `backend/` directory:

```env
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Important**: The anon key and service role key are displayed in the terminal output when you run `supabase start`. Copy these exact values to your `.env` file.

Example terminal output:
```
API URL: http://localhost:54321
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
...
JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Testing Database Connectivity

### Unit Tests
Create proper unit tests in `backend/tests/adapters/test_supabase.py` that mock the Supabase client.

### Integration Tests
For CI/CD, create integration tests that run against a test database instance.

## Migration Workflow

### Creating New Migrations

```bash
# Create a new migration
supabase migration new migration_name

# This creates a new file in migrations/ with timestamp
```

### Applying Migrations

```bash
# Apply migrations to local development
supabase db push

# Apply migrations to production (after linking project)
supabase db push --db-url your_production_db_url
```

### Resetting Database

```bash
# Reset local database (applies all migrations + seed data)
supabase db reset
```

## Production Deployment

### Automated Deployment (Recommended)

This project includes a GitHub Actions workflow that automatically deploys migrations when changes are pushed to the `main` branch.

**Required GitHub Secrets:**
- `SUPABASE_ACCESS_TOKEN` - Your Supabase access token
- `SUPABASE_DB_PASSWORD` - Your Supabase database password  
- `SUPABASE_PROJECT_REF` - Your Supabase project reference ID

**How it works:**
1. Push changes to `supabase/migrations/` files
2. Workflow automatically triggers on `main` branch
3. Migrations are deployed to your production Supabase instance

### Manual Deployment

If you need to deploy manually:

#### 1. Link to Supabase Project

```bash
# Link to your Supabase project
supabase link --project-ref your_project_ref
```

#### 2. Deploy Schema

```bash
# Deploy migrations to production
supabase db push
```

#### 3. Update Environment Variables

Update your production environment variables with the production Supabase URL and keys.

## Useful Commands

```bash
# View local database status
supabase status

# Stop local Supabase
supabase stop

# View logs
supabase logs

# Generate types for TypeScript (if using frontend)
supabase gen types typescript --local > types/supabase.ts
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: If ports are already in use, modify `config.toml`
2. **Migration errors**: Check PostgreSQL logs with `supabase logs`
3. **Connection issues**: Verify environment variables and network connectivity

### Reset Everything

```bash
# Stop and remove all local data
supabase stop --no-backup

# Start fresh
supabase start
``` 