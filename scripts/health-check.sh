#!/bin/bash

set -e

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

echo_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check if service is running
check_service() {
    local service_name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo_info "Checking $service_name at $url..."
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_status"; then
        echo_success "$service_name is healthy ✓"
        return 0
    else
        echo_error "$service_name is not responding ✗"
        return 1
    fi
}

# Check Docker services
check_docker_services() {
    echo_info "Checking Docker services..."
    
    if ! command -v docker-compose >/dev/null 2>&1; then
        echo_error "docker-compose is not installed"
        return 1
    fi
    
    # Check if services are running
    local services=("frontend" "backend" "ai-service" "redis")
    local all_running=true
    
    for service in "${services[@]}"; do
        if docker-compose ps "$service" | grep -q "Up"; then
            echo_success "$service container is running ✓"
        else
            echo_error "$service container is not running ✗"
            all_running=false
        fi
    done
    
    if [ "$all_running" = true ]; then
        return 0
    else
        return 1
    fi
}

# Main health check function
main() {
    echo_info "Starting KMRL Document Intelligence Platform health check..."
    echo_info "=================================================="
    
    local all_healthy=true
    
    # Check Docker services first
    if ! check_docker_services; then
        echo_error "Some Docker services are not running. Run 'docker-compose up -d' to start them."
        all_healthy=false
    fi
    
    # Wait a moment for services to be ready
    echo_info "Waiting for services to be ready..."
    sleep 5
    
    # Check individual service health
    if ! check_service "Frontend" "http://localhost:3000" "200"; then
        all_healthy=false
    fi
    
    if ! check_service "Backend API" "http://localhost:3001/api/v1/health" "200"; then
        all_healthy=false
    fi
    
    if ! check_service "AI Service" "http://localhost:8000/health" "200"; then
        all_healthy=false
    fi
    
    if ! check_service "MinIO" "http://localhost:9000/minio/health/live" "200"; then
        echo_warn "MinIO health check failed (this is optional for development)"
    fi
    
    # Check Redis
    echo_info "Checking Redis..."
    if docker-compose exec -T redis redis-cli ping | grep -q "PONG"; then
        echo_success "Redis is healthy ✓"
    else
        echo_error "Redis is not responding ✗"
        all_healthy=false
    fi
    
    echo_info "=================================================="
    
    if [ "$all_healthy" = true ]; then
        echo_success "🎉 All services are healthy! Platform is ready to use."
        echo_info ""
        echo_info "Access points:"
        echo_info "• Frontend: http://localhost:3000"
        echo_info "• API Docs: http://localhost:3001/api/docs"
        echo_info "• AI Service: http://localhost:8000/docs"
        echo_info "• MinIO Console: http://localhost:9001 (minioadmin/minioadmin)"
        echo_info ""
        echo_info "Next steps:"
        echo_info "1. Open http://localhost:3000 in your browser"
        echo_info "2. Sign up/Sign in with Clerk"
        echo_info "3. Upload a test document"
        echo_info "4. Explore the role-based dashboards"
        return 0
    else
        echo_error "❌ Some services are not healthy. Please check the logs:"
        echo_info "• View all logs: docker-compose logs"
        echo_info "• View specific service: docker-compose logs [service-name]"
        echo_info "• Restart services: docker-compose restart"
        return 1
    fi
}

# Run main function
main "$@"