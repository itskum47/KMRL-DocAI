# 🚀 Quick Start Guide

Get the KMRL Document Intelligence Platform running in 5 minutes!

## Prerequisites

- Node.js 18+ 
- Python 3.11+
- Docker & Docker Compose
- Git

## 1. Install Dependencies

```bash
# Run the installation script
./scripts/install.sh
```

This will:
- Check system requirements
- Install frontend dependencies (React/TypeScript)
- Install backend dependencies (NestJS)
- Install AI service dependencies (Python/FastAPI)
- Create `.env` file from template

## 2. Configure Environment

Edit the `.env` file with your service credentials:

```bash
# Minimum required for local development
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key
CLERK_SECRET_KEY=sk_test_your_clerk_key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key

# For local development with MinIO (optional)
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET_NAME=documents
```

## 3. Set Up Database

1. Create a [Supabase](https://supabase.com) project
2. Go to SQL Editor and run:
   ```sql
   -- Copy and paste the contents of database/schema.sql
   ```
3. Optionally run seed data:
   ```sql
   -- Copy and paste the contents of database/seed.sql
   ```

## 4. Set Up Authentication

1. Create a [Clerk](https://clerk.com) application
2. Configure allowed origins: `http://localhost:3000`
3. Set up user metadata fields:
   - `role`: string (admin, hr, engineer, director, staff)
   - `department`: string (engineering, hr, finance, operations)

## 5. Start the Platform

```bash
# Start all services
docker-compose up
```

This starts:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **AI Service**: http://localhost:8000
- **Redis**: localhost:6379
- **MinIO** (S3 emulation): http://localhost:9000

## 6. Access the Application

1. Open http://localhost:3000
2. Sign up/Sign in with Clerk
3. Upload a document to test the AI pipeline
4. Check the different role-based dashboards

## 🎯 Test the Platform

### Upload a Test Document
1. Click "Upload Document"
2. Select a PDF, image, or text file
3. Watch it process through the AI pipeline
4. View the extracted summary and metadata

### Try Different Roles
1. Go to Clerk dashboard
2. Update user metadata to test different roles:
   - `admin`: Full system access
   - `hr`: HR documents and compliance
   - `engineer`: Maintenance reports and technical docs
   - `director`: Executive dashboard
   - `staff`: Basic document access

## 🔧 Development Commands

```bash
# Frontend development
cd frontend && npm run dev

# Backend development  
cd backend && npm run start:dev

# AI service development
cd ai-service && source venv/bin/activate && uvicorn main:app --reload

# View logs
docker-compose logs -f [service-name]

# Restart a service
docker-compose restart [service-name]
```

## 📊 Monitoring

- **API Documentation**: http://localhost:3001/api/docs
- **Health Check**: http://localhost:3001/api/v1/health
- **AI Service Health**: http://localhost:8000/health
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**: Change ports in docker-compose.yml
2. **Permission errors**: Run `chmod +x scripts/*.sh`
3. **Database connection**: Check Supabase credentials
4. **Auth issues**: Verify Clerk configuration

### Reset Everything
```bash
# Stop all services
docker-compose down

# Remove volumes (careful - this deletes data!)
docker-compose down -v

# Restart fresh
docker-compose up
```

## 🚀 Production Deployment

When ready for production:

```bash
# Deploy to production
./scripts/deploy.sh
```

See [docs/deployment.md](docs/deployment.md) for detailed production setup.

## 📚 Documentation

- [Getting Started](docs/getting-started.md) - Detailed setup guide
- [API Documentation](docs/api.md) - Complete API reference
- [Deployment Guide](docs/deployment.md) - Production deployment
- [Admin Runbook](docs/admin-runbook.md) - Operations guide

## 🆘 Need Help?

1. Check the logs: `docker-compose logs -f`
2. Review the documentation in `/docs`
3. Verify your environment variables
4. Test individual services

**You're all set! The platform is ready to intelligently process your documents! 🎉**