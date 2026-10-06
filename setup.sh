#!/bin/bash

# EHR NLP System Setup Script
# This script helps set up the complete EHR NLP System

set -e

echo "🏥 EHR NLP System Setup Script"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if required tools are installed
check_requirements() {
    print_info "Checking system requirements..."
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed. Please install Python 3.8+ first."
        exit 1
    fi
    print_status "Python 3 found: $(python3 --version)"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 16+ first."
        exit 1
    fi
    print_status "Node.js found: $(node --version)"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    print_status "npm found: $(npm --version)"
    
    # Check MongoDB (optional)
    if ! command -v mongod &> /dev/null; then
        print_warning "MongoDB not found locally. You can use MongoDB Atlas or install MongoDB locally."
    else
        print_status "MongoDB found: $(mongod --version | head -n1)"
    fi
}

# Setup backend
setup_backend() {
    print_info "Setting up backend..."
    
    cd backend
    
    # Create virtual environment
    print_info "Creating Python virtual environment..."
    python3 -m venv venv
    
    # Activate virtual environment
    print_info "Activating virtual environment..."
    source venv/bin/activate
    
    # Install dependencies
    print_info "Installing Python dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        print_info "Creating .env file..."
        cp env_template.txt .env
        print_warning "Please edit backend/.env file with your MongoDB connection string and JWT secret key"
    fi
    
    cd ..
    print_status "Backend setup completed!"
}

# Setup frontend
setup_frontend() {
    print_info "Setting up frontend..."
    
    cd frontend
    
    # Install dependencies
    print_info "Installing Node.js dependencies..."
    npm install
    
    cd ..
    print_status "Frontend setup completed!"
}

# Create startup scripts
create_startup_scripts() {
    print_info "Creating startup scripts..."
    
    # Backend startup script
    cat > start_backend.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting EHR NLP Backend..."
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
EOF
    
    # Frontend startup script
    cat > start_frontend.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting EHR NLP Frontend..."
cd frontend
npm start
EOF
    
    # Full system startup script
    cat > start_system.sh << 'EOF'
#!/bin/bash
echo "🏥 Starting EHR NLP System..."

# Start backend in background
echo "Starting backend..."
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 5

# Start frontend
echo "Starting frontend..."
cd ../frontend
npm start &
FRONTEND_PID=$!

echo "✅ System started!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for user interrupt
trap "echo '🛑 Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
EOF
    
    # Make scripts executable
    chmod +x start_backend.sh start_frontend.sh start_system.sh
    
    print_status "Startup scripts created!"
}

# Main setup function
main() {
    echo ""
    print_info "Starting EHR NLP System setup..."
    echo ""
    
    check_requirements
    echo ""
    
    setup_backend
    echo ""
    
    setup_frontend
    echo ""
    
    create_startup_scripts
    echo ""
    
    print_status "Setup completed successfully!"
    echo ""
    print_info "Next steps:"
    echo "1. Edit backend/.env file with your MongoDB connection string"
    echo "2. Start MongoDB (if using local instance)"
    echo "3. Run './start_system.sh' to start both backend and frontend"
    echo "   Or run './start_backend.sh' and './start_frontend.sh' separately"
    echo ""
    print_info "Access points:"
    echo "• Frontend: http://localhost:3000"
    echo "• Backend API: http://localhost:8000"
    echo "• API Documentation: http://localhost:8000/docs"
    echo ""
    print_warning "Remember to:"
    echo "• Change the JWT secret key in backend/.env"
    echo "• Set up MongoDB connection string"
    echo "• Create your first user account through the signup page"
    echo ""
}

# Run main function
main
