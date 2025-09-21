#!/bin/bash

# Development helper script for KMRL Document Intelligence Platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

echo_cmd() {
    echo -e "${BLUE}[CMD]${NC} $1"
}

# Show usage
show_usage() {
    echo "KMRL Document Intelligence Platform - Development Helper"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  start           Start all services with Docker Compose"
    echo "  stop            Stop all services"
    echo "  restart         Restart all services"
    echo "  logs            Show logs for all services"
    echo "  logs [service]  Show logs for specific service"
    echo "  health          Run health check"
    echo "  frontend        Start frontend in development mode"
    echo "  backend         Start backend in development mode"
    echo "  ai-service      Start AI service in development mode"
    echo "  install         Install all dependencies"
    echo "  clean           Clean up containers and volumes"
    echo "  reset           Reset everything (clean + start)"
    echo ""
    echo "Examples:"
    echo "  $0 start                 # Start all services"
    echo "  $0 logs backend          # Show backend logs"
    echo "  $0 frontend              # Start frontend dev server"
    echo ""
}

# Start all services
start_services() {
    echo_info "Starting all services..."
    echo_cmd "docker-compose up -d"
    docker-compose up -d
    
    echo_info "Waiting for services to be ready..."
    sleep 10
    
    echo_info "Running health check..."
    ./scripts/health-check.sh
}

# Stop all services
stop_services() {
    echo_info "Stopping all services..."
    echo_cmd "docker-compose down"
    docker-compose down
}

# Restart all services
restart_services() {
    echo_info "Restarting all services..."
    echo_cmd "docker-compose restart"
    docker-compose restart
    
    echo_info "Waiting for services to be ready..."
    sleep 10
    
    echo_info "Running health check..."
    ./scripts/health-check.sh
}

# Show logs
show_logs() {
    local service=$1
    if [ -n "$service" ]; then
        echo_info "Showing logs for $service..."
        echo_cmd "docker-compose logs -f $service"
        docker-compose logs -f "$service"
    else
        echo_info "Showing logs for all services..."
        echo_cmd "docker-compose logs -f"
        docker-compose logs -f
    fi
}

# Start frontend in development mode
start_frontend() {
    echo_info "Starting frontend in development mode..."
    echo_warn "Make sure backend services are running first!"
    
    cd frontend
    echo_cmd "npm run dev"
    npm run dev
}

# Start backend in development mode
start_backend() {
    echo_info "Starting backend in development mode..."
    echo_warn "Make sure Redis and database are running first!"
    
    cd backend
    echo_cmd "npm run start:dev"
    npm run start:dev
}

# Start AI service in development mode
start_ai_service() {
    echo_info "Starting AI service in development mode..."
    echo_warn "Make sure Redis is running first!"
    
    cd ai-service
    
    # Activate virtual environment if it exists
    if [ -d "venv" ]; then
        echo_info "Activating Python virtual environment..."
        source venv/bin/activate
    fi
    
    echo_cmd "uvicorn main:app --reload --host 0.0.0.0 --port 8000"
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
}

# Install dependencies
install_deps() {
    echo_info "Installing dependencies..."
    echo_cmd "./scripts/install.sh"
    ./scripts/install.sh
}

# Clean up
clean_up() {
    echo_warn "This will remove all containers and volumes. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo_info "Cleaning up containers and volumes..."
        echo_cmd "docker-compose down -v --remove-orphans"
        docker-compose down -v --remove-orphans
        
        echo_cmd "docker system prune -f"
        docker system prune -f
        
        echo_info "Cleanup completed."
    else
        echo_info "Cleanup cancelled."
    fi
}

# Reset everything
reset_all() {
    echo_info "Resetting everything..."
    clean_up
    start_services
}

# Run health check
run_health_check() {
    echo_cmd "./scripts/health-check.sh"
    ./scripts/health-check.sh
}

# Main function
main() {
    local command=${1:-help}
    
    case $command in
        "start")
            start_services
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            restart_services
            ;;
        "logs")
            show_logs "$2"
            ;;
        "health")
            run_health_check
            ;;
        "frontend")
            start_frontend
            ;;
        "backend")
            start_backend
            ;;
        "ai-service")
            start_ai_service
            ;;
        "install")
            install_deps
            ;;
        "clean")
            clean_up
            ;;
        "reset")
            reset_all
            ;;
        "help"|*)
            show_usage
            ;;
    esac
}

# Run main function
main "$@"