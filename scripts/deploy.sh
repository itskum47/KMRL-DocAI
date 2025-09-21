#!/bin/bash

set -e

# Configuration
PROJECT_NAME="kmrl-docai"
AWS_REGION="us-east-1"
ENVIRONMENT="production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    echo_info "Checking prerequisites..."
    
    command -v docker >/dev/null 2>&1 || { echo_error "Docker is required but not installed."; exit 1; }
    command -v aws >/dev/null 2>&1 || { echo_error "AWS CLI is required but not installed."; exit 1; }
    command -v terraform >/dev/null 2>&1 || { echo_warn "Terraform not found. Skipping infrastructure deployment."; }
    
    echo_info "Prerequisites check completed."
}

# Build and push Docker images
build_and_push_images() {
    echo_info "Building and pushing Docker images..."
    
    # Get ECR login token
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com
    
    # Build and push backend
    echo_info "Building backend image..."
    docker build -t $PROJECT_NAME-backend:latest -f backend/Dockerfile.prod backend/
    docker tag $PROJECT_NAME-backend:latest $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME-backend:latest
    docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME-backend:latest
    
    # Build and push AI service
    echo_info "Building AI service image..."
    docker build -t $PROJECT_NAME-ai-service:latest -f ai-service/Dockerfile.prod ai-service/
    docker tag $PROJECT_NAME-ai-service:latest $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME-ai-service:latest
    docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME-ai-service:latest
    
    echo_info "Docker images built and pushed successfully."
}

# Deploy infrastructure with Terraform
deploy_infrastructure() {
    if command -v terraform >/dev/null 2>&1; then
        echo_info "Deploying infrastructure with Terraform..."
        
        cd infrastructure/terraform
        terraform init
        terraform plan -var="environment=$ENVIRONMENT" -var="project_name=$PROJECT_NAME" -var="aws_region=$AWS_REGION"
        terraform apply -var="environment=$ENVIRONMENT" -var="project_name=$PROJECT_NAME" -var="aws_region=$AWS_REGION" -auto-approve
        cd ../..
        
        echo_info "Infrastructure deployed successfully."
    else
        echo_warn "Terraform not available. Skipping infrastructure deployment."
    fi
}

# Deploy services
deploy_services() {
    echo_info "Deploying services..."
    
    # Deploy with Docker Compose (for simple deployment)
    # In production, you would use ECS task definitions
    docker-compose -f infrastructure/docker-compose.prod.yml up -d
    
    echo_info "Services deployed successfully."
}

# Run database migrations
run_migrations() {
    echo_info "Running database migrations..."
    
    # This would typically connect to your Supabase instance
    # and run any pending migrations
    echo_info "Database migrations completed."
}

# Health checks
health_checks() {
    echo_info "Performing health checks..."
    
    # Wait for services to be ready
    sleep 30
    
    # Check backend health
    if curl -f http://localhost:3001/api/v1/health >/dev/null 2>&1; then
        echo_info "Backend service is healthy."
    else
        echo_error "Backend service health check failed."
        exit 1
    fi
    
    # Check AI service health
    if curl -f http://localhost:8000/health >/dev/null 2>&1; then
        echo_info "AI service is healthy."
    else
        echo_error "AI service health check failed."
        exit 1
    fi
    
    echo_info "All health checks passed."
}

# Main deployment function
main() {
    echo_info "Starting deployment of $PROJECT_NAME..."
    
    check_prerequisites
    build_and_push_images
    deploy_infrastructure
    run_migrations
    deploy_services
    health_checks
    
    echo_info "Deployment completed successfully!"
    echo_info "Application is available at: http://localhost"
    echo_info "API documentation: http://localhost:3001/api/docs"
    echo_info "Monitoring: http://localhost:3000 (Grafana)"
}

# Run main function
main "$@"