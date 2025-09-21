# Deployment Guide

This guide covers deploying the KMRL Document Intelligence Platform to production.

## Prerequisites

### Required Tools
- Docker & Docker Compose
- AWS CLI configured with appropriate permissions
- Terraform (optional, for infrastructure as code)
- Node.js 18+ (for local development)
- Python 3.11+ (for AI service development)

### Required Services
- **Clerk Account**: For authentication
- **Supabase Project**: For database and realtime features
- **AWS Account**: For S3 storage and optional cloud services

## Environment Setup

### 1. Clone and Configure

```bash
git clone <repository-url>
cd kmrl-document-intelligence
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` with your production values:

```bash
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_live_your_production_key
CLERK_SECRET_KEY=sk_live_your_production_key

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_production_service_key

# AWS
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=kmrl-documents-prod

# API URLs
VITE_API_BASE_URL=https://api.yourdomain.com
BACKEND_WEBHOOK_URL=https://api.yourdomain.com/api/v1/webhooks/ai-service

# Monitoring
GRAFANA_ADMIN_PASSWORD=your_secure_password
```

## Deployment Options

### Option 1: Automated Deployment (Recommended)

```bash
./scripts/deploy.sh
```

This script will:
1. Check prerequisites
2. Build and push Docker images to ECR
3. Deploy infrastructure with Terraform
4. Run database migrations
5. Deploy services
6. Perform health checks

### Option 2: Manual Deployment

#### Step 1: Infrastructure Setup

```bash
cd infrastructure/terraform
terraform init
terraform plan -var="environment=production"
terraform apply -var="environment=production"
```

#### Step 2: Database Setup

1. Create Supabase project
2. Run the schema:
   ```sql
   -- Copy contents of database/schema.sql
   ```
3. Run seed data (optional):
   ```sql
   -- Copy contents of database/seed.sql
   ```

#### Step 3: Build and Deploy Services

```bash
# Build images
docker build -t kmrl-backend -f backend/Dockerfile.prod backend/
docker build -t kmrl-ai-service -f ai-service/Dockerfile.prod ai-service/
docker build -t kmrl-frontend -f frontend/Dockerfile.prod frontend/

# Deploy with Docker Compose
docker-compose -f infrastructure/docker-compose.prod.yml up -d
```

## Production Configuration

### SSL/TLS Setup

1. Obtain SSL certificates (Let's Encrypt recommended)
2. Update nginx configuration in `frontend/nginx.conf`
3. Configure certificate paths in docker-compose

### Domain Configuration

1. Point your domain to the load balancer
2. Update CORS settings in backend
3. Configure Clerk allowed origins
4. Update Supabase site URL

### Monitoring Setup

The deployment includes:
- **Prometheus**: Metrics collection
- **Grafana**: Dashboards and alerting
- **Health checks**: Automated service monitoring

Access monitoring at:
- Grafana: `http://your-domain:3000`
- Prometheus: `http://your-domain:9090`

### Security Considerations

1. **Network Security**:
   - Use VPC with private subnets
   - Configure security groups properly
   - Enable AWS WAF for additional protection

2. **Data Security**:
   - Enable S3 encryption at rest
   - Use HTTPS everywhere
   - Implement proper RBAC in Supabase

3. **Secrets Management**:
   - Use AWS Secrets Manager or similar
   - Never commit secrets to version control
   - Rotate keys regularly

## Scaling Considerations

### Horizontal Scaling

1. **Backend**: Scale ECS tasks based on CPU/memory
2. **AI Service**: Use multiple workers, consider GPU instances
3. **Database**: Use Supabase read replicas
4. **Storage**: S3 scales automatically

### Performance Optimization

1. **CDN**: Use CloudFront for static assets
2. **Caching**: Implement Redis caching layer
3. **Database**: Optimize queries and indexes
4. **AI Processing**: Consider batch processing for high volume

## Backup and Recovery

### Database Backups
- Supabase provides automated backups
- Configure additional backup retention as needed

### File Storage Backups
- S3 versioning is enabled
- Configure lifecycle policies for cost optimization

### Disaster Recovery
- Multi-AZ deployment for high availability
- Regular backup testing
- Documented recovery procedures

## Monitoring and Alerting

### Key Metrics to Monitor

1. **Application Metrics**:
   - API response times
   - Error rates
   - Document processing success rate
   - Queue length

2. **Infrastructure Metrics**:
   - CPU and memory usage
   - Disk space
   - Network throughput
   - Database connections

3. **Business Metrics**:
   - Documents processed per day
   - User activity
   - Task completion rates

### Alerting Rules

Configure alerts for:
- High error rates (>5%)
- Long processing times (>60s)
- Queue backlog (>100 jobs)
- Storage usage (>80%)
- Service downtime

## Troubleshooting

### Common Issues

1. **Service Won't Start**:
   - Check environment variables
   - Verify network connectivity
   - Review logs: `docker-compose logs service-name`

2. **Database Connection Issues**:
   - Verify Supabase credentials
   - Check network security groups
   - Confirm RLS policies

3. **File Upload Issues**:
   - Check S3 permissions
   - Verify CORS configuration
   - Test presigned URL generation

4. **AI Processing Failures**:
   - Check model dependencies
   - Verify file format support
   - Monitor memory usage

### Log Locations

- Backend: `/var/log/backend/`
- AI Service: `/var/log/ai-service/`
- Nginx: `/var/log/nginx/`
- Application logs: CloudWatch (if using ECS)

## Maintenance

### Regular Tasks

1. **Weekly**:
   - Review monitoring dashboards
   - Check error logs
   - Verify backup integrity

2. **Monthly**:
   - Update dependencies
   - Review security patches
   - Optimize database performance

3. **Quarterly**:
   - Security audit
   - Performance review
   - Capacity planning

### Updates and Rollbacks

1. **Blue-Green Deployment**:
   - Deploy to staging environment
   - Run integration tests
   - Switch traffic gradually

2. **Rollback Procedure**:
   - Keep previous Docker images
   - Database migration rollback scripts
   - Quick rollback via load balancer

## Support and Maintenance

For ongoing support:
1. Monitor application logs and metrics
2. Set up proper alerting
3. Maintain documentation
4. Regular security updates
5. Performance optimization

## Cost Optimization

1. **AWS Resources**:
   - Use spot instances for non-critical workloads
   - Implement S3 lifecycle policies
   - Monitor and optimize data transfer costs

2. **Supabase**:
   - Monitor database usage
   - Optimize queries for performance
   - Use appropriate pricing tier

3. **Monitoring**:
   - Set up cost alerts
   - Regular cost reviews
   - Resource utilization optimization