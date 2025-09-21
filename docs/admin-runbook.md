# Admin Runbook

This runbook provides step-by-step procedures for common administrative tasks in the KMRL Document Intelligence Platform.

## Table of Contents

1. [User Management](#user-management)
2. [Document Management](#document-management)
3. [System Monitoring](#system-monitoring)
4. [Troubleshooting](#troubleshooting)
5. [Backup and Recovery](#backup-and-recovery)
6. [Security Procedures](#security-procedures)
7. [Performance Optimization](#performance-optimization)

## User Management

### Adding New Users

1. **Via Clerk Dashboard**:
   - Login to Clerk dashboard
   - Navigate to Users section
   - Click "Create User"
   - Fill in user details
   - Set public metadata:
     ```json
     {
       "role": "staff|engineer|hr|director|admin",
       "department": "engineering|hr|finance|operations"
     }
     ```

2. **Via API** (Admin only):
   ```bash
   curl -X POST http://localhost:3001/api/v1/users \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "user@kmrl.com",
       "name": "New User",
       "role": "staff",
       "department": "engineering"
     }'
   ```

### Changing User Roles

1. **Via Admin Panel**:
   - Login as admin
   - Navigate to Admin → Users
   - Select user and change role in dropdown
   - Changes are applied immediately

2. **Via Clerk Dashboard**:
   - Update user's public metadata
   - Changes sync automatically via webhook

### Deactivating Users

1. **Soft Deactivation** (Recommended):
   - Change role to "inactive" in Clerk
   - User loses access but data is preserved

2. **Hard Deletion**:
   - Delete user from Clerk dashboard
   - User data is automatically cleaned up via webhook

## Document Management

### Reprocessing Documents

**When to Reprocess**:
- AI model updates
- Processing failures
- Incorrect metadata extraction
- Department misclassification

**Steps**:
1. Login as admin
2. Navigate to Documents
3. Find the document
4. Click "Reprocess" button
5. Monitor processing status

**Bulk Reprocessing**:
```bash
# Via API
curl -X POST http://localhost:3001/api/v1/admin/reprocess-batch \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {
      "status": "failed",
      "doc_type": "invoice"
    }
  }'
```

### Managing Failed Documents

1. **Identify Failed Documents**:
   - Admin Panel → Overview → Failed Documents
   - Or filter documents by status: "failed"

2. **Common Failure Reasons**:
   - Unsupported file format
   - Corrupted files
   - OCR processing errors
   - Network timeouts

3. **Resolution Steps**:
   - Check error logs in processing_metadata
   - Verify file integrity
   - Reprocess if transient error
   - Manual intervention if needed

### Document Routing Rules

**View Current Rules**:
```sql
SELECT * FROM routing_rules WHERE active = true ORDER BY priority DESC;
```

**Add New Rule**:
```sql
INSERT INTO routing_rules (name, rule_json, priority, active) VALUES (
  'Purchase Orders to Procurement',
  '{"keywords": ["purchase order", "PO"], "target_department": "procurement"}',
  5,
  true
);
```

**Update Rule Priority**:
```sql
UPDATE routing_rules SET priority = 10 WHERE name = 'Invoice to Finance';
```

## System Monitoring

### Key Metrics Dashboard

Access monitoring at: `http://your-domain:3000` (Grafana)

**Critical Metrics**:
- API response time < 2s
- Document processing success rate > 95%
- Queue length < 50 jobs
- Storage usage < 80%
- Error rate < 5%

### Health Checks

**Manual Health Checks**:
```bash
# Backend health
curl http://localhost:3001/api/v1/health

# AI service health
curl http://localhost:8000/health

# Database connectivity
curl http://localhost:3001/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN"
```

**Automated Monitoring**:
- Prometheus scrapes metrics every 30s
- Grafana dashboards update in real-time
- Alerts configured for critical thresholds

### Log Analysis

**Log Locations**:
- Backend: `docker-compose logs backend`
- AI Service: `docker-compose logs ai-service`
- Database: Supabase dashboard
- System: CloudWatch (if using AWS)

**Common Log Patterns**:
```bash
# Find errors in last hour
docker-compose logs --since 1h backend | grep ERROR

# Monitor processing queue
docker-compose logs -f ai-service | grep "Processing job"

# Check authentication issues
docker-compose logs backend | grep "Unauthorized"
```

## Troubleshooting

### Common Issues and Solutions

#### 1. High Queue Backlog

**Symptoms**: Processing queue > 100 jobs, slow document processing

**Diagnosis**:
```bash
# Check queue length
redis-cli -h localhost -p 6379 llen document_processing_jobs

# Check AI service status
curl http://localhost:8000/health
```

**Solutions**:
- Scale AI service workers
- Check for stuck jobs
- Restart AI service if needed
- Increase processing timeout

#### 2. Authentication Failures

**Symptoms**: Users can't login, API returns 401 errors

**Diagnosis**:
- Check Clerk service status
- Verify JWT token validity
- Check network connectivity

**Solutions**:
```bash
# Restart backend service
docker-compose restart backend

# Check Clerk configuration
curl https://api.clerk.dev/v1/jwks \
  -H "Authorization: Bearer $CLERK_SECRET_KEY"
```

#### 3. Database Connection Issues

**Symptoms**: API errors, data not saving

**Diagnosis**:
- Check Supabase dashboard
- Verify connection strings
- Check RLS policies

**Solutions**:
- Restart backend service
- Check environment variables
- Verify Supabase service status

#### 4. File Upload Issues

**Symptoms**: Upload failures, S3 errors

**Diagnosis**:
```bash
# Test S3 connectivity
aws s3 ls s3://your-bucket-name

# Check presigned URL generation
curl -X POST http://localhost:3001/api/v1/documents/presign \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"fileName": "test.pdf", "contentType": "application/pdf"}'
```

**Solutions**:
- Verify AWS credentials
- Check S3 bucket permissions
- Verify CORS configuration

### Emergency Procedures

#### Service Outage Response

1. **Immediate Actions**:
   - Check service status dashboard
   - Identify affected components
   - Notify stakeholders

2. **Diagnosis**:
   - Check logs for errors
   - Verify external service status
   - Test connectivity

3. **Recovery**:
   - Restart affected services
   - Scale resources if needed
   - Monitor recovery

#### Data Corruption Response

1. **Stop Processing**:
   ```bash
   docker-compose stop ai-service
   ```

2. **Assess Damage**:
   - Identify affected records
   - Check backup integrity
   - Estimate recovery time

3. **Recovery**:
   - Restore from backup
   - Reprocess affected documents
   - Verify data integrity

## Backup and Recovery

### Database Backups

**Automated Backups**:
- Supabase provides daily backups
- Retention: 7 days (free tier), 30 days (pro)

**Manual Backup**:
```bash
# Export specific tables
pg_dump -h your-supabase-host -U postgres -t documents > documents_backup.sql
```

**Restore Procedure**:
1. Create new Supabase project (if needed)
2. Run schema.sql
3. Import backup data
4. Update connection strings
5. Test functionality

### File Storage Backups

**S3 Versioning**: Enabled by default
**Cross-Region Replication**: Configure for critical data

**Manual Backup**:
```bash
# Sync to backup bucket
aws s3 sync s3://primary-bucket s3://backup-bucket
```

### Application Backups

**Configuration Backup**:
```bash
# Backup environment variables
cp .env .env.backup.$(date +%Y%m%d)

# Backup docker-compose files
tar -czf config-backup-$(date +%Y%m%d).tar.gz docker-compose.yml infrastructure/
```

## Security Procedures

### Security Incident Response

1. **Detection**:
   - Monitor security alerts
   - Check access logs
   - Review user activity

2. **Containment**:
   - Disable affected accounts
   - Block suspicious IPs
   - Isolate affected systems

3. **Investigation**:
   - Collect evidence
   - Analyze attack vectors
   - Document findings

4. **Recovery**:
   - Patch vulnerabilities
   - Restore services
   - Update security measures

### Access Control Audit

**Monthly Review**:
```sql
-- Review user roles
SELECT role, department, COUNT(*) 
FROM users 
GROUP BY role, department;

-- Check admin users
SELECT name, email, created_at 
FROM users 
WHERE role = 'admin';

-- Review recent logins
SELECT actor_id, action_type, created_at 
FROM audit_logs 
WHERE action_type = 'user_login' 
AND created_at > NOW() - INTERVAL '30 days';
```

### Security Updates

**Regular Tasks**:
- Update Docker images monthly
- Apply security patches
- Review access permissions
- Rotate API keys quarterly

## Performance Optimization

### Database Optimization

**Query Performance**:
```sql
-- Find slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, attname, n_distinct, correlation 
FROM pg_stats 
WHERE tablename = 'documents';
```

**Maintenance Tasks**:
```sql
-- Update table statistics
ANALYZE documents;

-- Rebuild indexes if needed
REINDEX TABLE documents;
```

### Application Performance

**Monitoring**:
- API response times
- Memory usage
- CPU utilization
- Queue processing rates

**Optimization**:
- Scale services based on load
- Optimize database queries
- Implement caching
- Use CDN for static assets

### Storage Optimization

**S3 Lifecycle Policies**:
- Move to IA after 30 days
- Archive to Glacier after 90 days
- Delete old versions after 1 year

**Database Cleanup**:
```sql
-- Clean old audit logs
DELETE FROM audit_logs 
WHERE created_at < NOW() - INTERVAL '90 days';

-- Archive processed documents
-- (Move to separate archive table)
```

## Maintenance Schedule

### Daily Tasks
- [ ] Check system health dashboard
- [ ] Review error logs
- [ ] Monitor queue length
- [ ] Verify backup completion

### Weekly Tasks
- [ ] Review user activity
- [ ] Check storage usage
- [ ] Update security patches
- [ ] Performance review

### Monthly Tasks
- [ ] User access audit
- [ ] Database maintenance
- [ ] Security review
- [ ] Capacity planning

### Quarterly Tasks
- [ ] Full security audit
- [ ] Disaster recovery test
- [ ] Performance optimization
- [ ] Documentation updates

## Contact Information

**Emergency Contacts**:
- System Administrator: admin@kmrl.com
- Database Administrator: dba@kmrl.com
- Security Team: security@kmrl.com

**Service Providers**:
- Clerk Support: support@clerk.dev
- Supabase Support: support@supabase.io
- AWS Support: (via AWS Console)

**Escalation Procedures**:
1. Level 1: System Administrator
2. Level 2: Technical Lead
3. Level 3: External Support

Remember to keep this runbook updated as the system evolves and new procedures are established.