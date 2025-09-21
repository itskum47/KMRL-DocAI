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

# Check if Node.js is installed
check_node() {
    if command -v node >/dev/null 2>&1; then
        NODE_VERSION=$(node --version)
        echo_info "Node.js is installed: $NODE_VERSION"
        
        # Check if version is 18 or higher
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$MAJOR_VERSION" -lt 18 ]; then
            echo_warn "Node.js version 18 or higher is recommended. Current: $NODE_VERSION"
        fi
    else
        echo_error "Node.js is not installed. Please install Node.js 18 or higher."
        exit 1
    fi
}

# Check if Python is installed
check_python() {
    if command -v python3 >/dev/null 2>&1; then
        PYTHON_VERSION=$(python3 --version)
        echo_info "Python is installed: $PYTHON_VERSION"
    else
        echo_error "Python 3 is not installed. Please install Python 3.11 or higher."
        exit 1
    fi
}

# Install frontend dependencies
install_frontend() {
    echo_info "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    echo_info "Frontend dependencies installed successfully."
}

# Install backend dependencies
install_backend() {
    echo_info "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    echo_info "Backend dependencies installed successfully."
}

# Install AI service dependencies
install_ai_service() {
    echo_info "Installing AI service dependencies..."
    cd ai-service
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        echo_info "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Upgrade pip
    pip install --upgrade pip
    
    # Install dependencies
    pip install -r requirements.txt
    
    # Download spaCy model
    python -m spacy download en_core_web_sm
    
    deactivate
    cd ..
    echo_info "AI service dependencies installed successfully."
}

# Create environment file
create_env_file() {
    if [ ! -f ".env" ]; then
        echo_info "Creating .env file from template..."
        cp .env.example .env
        echo_warn "Please edit .env file with your actual configuration values."
    else
        echo_info ".env file already exists."
    fi
}

# Main installation function
main() {
    echo_info "Starting KMRL Document Intelligence Platform installation..."
    
    check_node
    check_python
    
    install_frontend
    install_backend
    install_ai_service
    
    create_env_file
    
    echo_info "Installation completed successfully!"
    echo_info ""
    echo_info "Next steps:"
    echo_info "1. Edit .env file with your configuration"
    echo_info "2. Set up your Clerk, Supabase, and AWS accounts"
    echo_info "3. Run 'docker-compose up' to start the development environment"
    echo_info "4. Access the application at http://localhost:3000"
}

# Run main function
main "$@"