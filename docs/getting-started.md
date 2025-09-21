# Getting Started with KMRL Document Intelligence Platform

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for AI service development)
- Clerk account for authentication
- Supabase account for database
- AWS account for S3 storage (or use MinIO for local development)

## Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd kmrl-document-intelligence
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` file with your credentials:

```bash
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AWS (or use MinIO for local development)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=kmrl-documents-dev
```

### 3. Setup Database

1. Create a new Supabase project
2. Run the database schema:
   ```sql
   -- Copy and paste contents of database/schema.sql
   ```
3. Run the seed data:
   ```sql
   -- Copy and paste contents of database/seed.sql
   ```

### 4. Start Development Environment

```bash
docker-compose up
```

This will start:
- Frontend at http://localhost:3000
- Backend API at http://localhost:3001
- AI Service at http://localhost:8000
- Redis at localhost:6379
- MinIO at http://localhost:9000 (admin/admin)

### 5. Access the Application

1. Open http://localhost:3000
2. Sign up/Sign in using Clerk
3. You'll be redirected to the dashboard

## Development Workflow

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

### Backend Development

```bash
cd backend
npm install
npm run start:dev
```

### AI Service Development

```bash
cd ai-service
pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn main:app --reload
```

## API Documentation

Once the backend is running, visit:
- API Docs: http://localhost:3001/api/docs
- Health Check: http://localhost:3001/api/v1/health

## Testing Document Upload

1. Login to the application
2. Click "Upload Document" 
3. Select a PDF, image, or text file
4. The document will be processed by the AI pipeline
5. View results in the Documents section

## Troubleshooting

### Common Issues

1. **Clerk Authentication Issues**
   - Verify your Clerk keys are correct
   - Check that your domain is configured in Clerk dashboard

2. **Supabase Connection Issues**
   - Verify your Supabase URL and keys
   - Check that RLS policies are properly configured

3. **S3/MinIO Issues**
   - For local development, ensure MinIO is running
   - Check AWS credentials and bucket permissions

4. **AI Service Issues**
   - Ensure all Python dependencies are installed
   - Check that Tesseract is properly installed
   - Verify spaCy models are downloaded

### Logs

View service logs:
```bash
docker-compose logs -f [service-name]
```

## Next Steps

1. Configure your Clerk application with proper roles and metadata
2. Set up your Supabase project with the provided schema
3. Configure AWS S3 bucket for production file storage
4. Customize the AI pipeline for your specific document types
5. Set up monitoring and alerting

For detailed configuration and deployment instructions, see the other documentation files in this directory.