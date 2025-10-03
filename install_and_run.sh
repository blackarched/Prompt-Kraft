#!/bin/bash
# PromptCraft Complete Installation and Startup Script
# This script automatically installs all dependencies and starts the complete system

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Configuration
PYTHON_MIN_VERSION="3.7"
NODE_MIN_VERSION="16"
PROJECT_NAME="PromptCraft"
API_PORT=8080
WEB_PORT=8000

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}$1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to compare versions
version_compare() {
    printf '%s\n%s\n' "$2" "$1" | sort -V -C
}

# Function to get Python version
get_python_version() {
    python3 -c "import sys; print('.'.join(map(str, sys.version_info[:2])))" 2>/dev/null || echo "0.0"
}

# Function to get Node.js version
get_node_version() {
    node --version 2>/dev/null | sed 's/v//' || echo "0.0.0"
}

# Function to check system requirements
check_system_requirements() {
    print_header "🔍 Checking System Requirements..."
    
    # Check operating system
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="Linux"
        DISTRO=$(lsb_release -si 2>/dev/null || echo "Unknown")
        print_status "Operating System: $OS ($DISTRO)"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macOS"
        print_status "Operating System: $OS"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        OS="Windows"
        print_status "Operating System: $OS (Git Bash/Cygwin)"
    else
        print_warning "Unknown operating system: $OSTYPE"
        OS="Unknown"
    fi
    
    # Check Python
    if command_exists python3; then
        PYTHON_VERSION=$(get_python_version)
        if version_compare "$PYTHON_VERSION" "$PYTHON_MIN_VERSION"; then
            print_success "Python $PYTHON_VERSION found (>= $PYTHON_MIN_VERSION required)"
        else
            print_error "Python $PYTHON_VERSION found, but >= $PYTHON_MIN_VERSION required"
            install_python
        fi
    else
        print_error "Python 3 not found"
        install_python
    fi
    
    # Check pip
    if command_exists pip3; then
        print_success "pip3 found"
    else
        print_error "pip3 not found"
        install_pip
    fi
    
    # Check Node.js (optional for web interface)
    if command_exists node; then
        NODE_VERSION=$(get_node_version)
        if version_compare "$NODE_VERSION" "$NODE_MIN_VERSION"; then
            print_success "Node.js $NODE_VERSION found (>= $NODE_MIN_VERSION required)"
            NODE_AVAILABLE=true
        else
            print_warning "Node.js $NODE_VERSION found, but >= $NODE_MIN_VERSION recommended"
            NODE_AVAILABLE=false
        fi
    else
        print_warning "Node.js not found (optional for web interface)"
        NODE_AVAILABLE=false
    fi
    
    # Check curl
    if command_exists curl; then
        print_success "curl found"
    else
        print_warning "curl not found, installing..."
        install_curl
    fi
    
    # Check git
    if command_exists git; then
        print_success "git found"
    else
        print_warning "git not found, installing..."
        install_git
    fi
}

# Function to install Python (OS-specific)
install_python() {
    print_status "Installing Python 3..."
    
    if [[ "$OS" == "Linux" ]]; then
        if command_exists apt-get; then
            sudo apt-get update
            sudo apt-get install -y python3 python3-pip python3-venv
        elif command_exists yum; then
            sudo yum install -y python3 python3-pip
        elif command_exists dnf; then
            sudo dnf install -y python3 python3-pip
        elif command_exists pacman; then
            sudo pacman -S python python-pip
        else
            print_error "Cannot install Python automatically. Please install Python 3.7+ manually."
            exit 1
        fi
    elif [[ "$OS" == "macOS" ]]; then
        if command_exists brew; then
            brew install python3
        else
            print_error "Homebrew not found. Please install Python 3.7+ manually or install Homebrew first."
            exit 1
        fi
    else
        print_error "Cannot install Python automatically on $OS. Please install Python 3.7+ manually."
        exit 1
    fi
}

# Function to install pip
install_pip() {
    print_status "Installing pip..."
    
    if command_exists python3; then
        curl -sS https://bootstrap.pypa.io/get-pip.py | python3
    else
        print_error "Python 3 required to install pip"
        exit 1
    fi
}

# Function to install curl
install_curl() {
    if [[ "$OS" == "Linux" ]]; then
        if command_exists apt-get; then
            sudo apt-get install -y curl
        elif command_exists yum; then
            sudo yum install -y curl
        elif command_exists dnf; then
            sudo dnf install -y curl
        fi
    elif [[ "$OS" == "macOS" ]]; then
        if command_exists brew; then
            brew install curl
        fi
    fi
}

# Function to install git
install_git() {
    if [[ "$OS" == "Linux" ]]; then
        if command_exists apt-get; then
            sudo apt-get install -y git
        elif command_exists yum; then
            sudo yum install -y git
        elif command_exists dnf; then
            sudo dnf install -y git
        fi
    elif [[ "$OS" == "macOS" ]]; then
        if command_exists brew; then
            brew install git
        fi
    fi
}

# Function to create virtual environment
create_virtual_environment() {
    print_header "🐍 Setting up Python Virtual Environment..."
    
    if [ -d "venv" ]; then
        print_status "Virtual environment already exists"
    else
        print_status "Creating virtual environment..."
        python3 -m venv venv
        print_success "Virtual environment created"
    fi
    
    # Activate virtual environment
    print_status "Activating virtual environment..."
    source venv/bin/activate
    print_success "Virtual environment activated"
    
    # Upgrade pip
    print_status "Upgrading pip..."
    pip install --upgrade pip
}

# Function to install Python dependencies
install_python_dependencies() {
    print_header "📦 Installing Python Dependencies..."
    
    if [ -f "requirements.txt" ]; then
        print_status "Installing from requirements.txt..."
        pip install -r requirements.txt
        print_success "Python dependencies installed"
    else
        print_error "requirements.txt not found"
        exit 1
    fi
}

# Function to install Node.js dependencies (if needed)
install_node_dependencies() {
    if [ "$NODE_AVAILABLE" = true ] && [ -f "package.json" ]; then
        print_header "📦 Installing Node.js Dependencies..."
        npm install
        print_success "Node.js dependencies installed"
    fi
}

# Function to create configuration directories
setup_configuration() {
    print_header "⚙️ Setting up Configuration..."
    
    # Create config directory
    CONFIG_DIR="$HOME/.config/promptcraft"
    mkdir -p "$CONFIG_DIR"
    print_status "Created config directory: $CONFIG_DIR"
    
    # Copy environment template if it doesn't exist
    if [ ! -f ".env" ] && [ -f ".env.example" ]; then
        cp .env.example .env
        print_status "Created .env file from template"
        print_warning "Please edit .env file to configure your settings"
    fi
    
    # Initialize default configuration
    if [ ! -f "$CONFIG_DIR/config.json" ]; then
        print_status "Initializing default configuration..."
        python3 -c "
from prompt_craft import create_default_config
import os
os.makedirs('$CONFIG_DIR', exist_ok=True)
create_default_config()
print('Default configuration created')
" 2>/dev/null || {
            print_status "Creating configuration interactively..."
            echo -e "\n\n\ntest prompt\n\n" | python3 prompt_craft.py -i > /dev/null 2>&1 || true
        }
        print_success "Configuration initialized"
    fi
    
    # Create integrations config if it doesn't exist
    if [ ! -f "$CONFIG_DIR/integrations.json" ]; then
        print_status "Creating integrations configuration..."
        python3 integrations.py --config > /dev/null 2>&1 || true
        print_success "Integrations configuration created"
    fi
}

# Function to run tests
run_tests() {
    print_header "🧪 Running System Tests..."
    
    # Test core functionality
    print_status "Testing core prompt enhancement..."
    if python3 prompt_craft.py "test prompt" > /dev/null 2>&1; then
        print_success "Core functionality working"
    else
        print_warning "Core functionality test failed, but continuing..."
    fi
    
    # Test analytics
    print_status "Testing analytics system..."
    if python3 analytics.py --summary > /dev/null 2>&1; then
        print_success "Analytics system working"
    else
        print_warning "Analytics test failed, but continuing..."
    fi
    
    # Test integrations
    print_status "Testing integrations system..."
    if python3 integrations.py --status > /dev/null 2>&1; then
        print_success "Integrations system working"
    else
        print_warning "Integrations test failed, but continuing..."
    fi
}

# Function to check if port is available
check_port() {
    local port=$1
    if command_exists netstat; then
        if netstat -tuln | grep -q ":$port "; then
            return 1
        fi
    elif command_exists ss; then
        if ss -tuln | grep -q ":$port "; then
            return 1
        fi
    elif command_exists lsof; then
        if lsof -i :$port > /dev/null 2>&1; then
            return 1
        fi
    fi
    return 0
}

# Function to find available port
find_available_port() {
    local start_port=$1
    local port=$start_port
    
    while ! check_port $port; do
        port=$((port + 1))
        if [ $port -gt $((start_port + 100)) ]; then
            print_error "Could not find available port starting from $start_port"
            exit 1
        fi
    done
    
    echo $port
}

# Function to start API server
start_api_server() {
    print_header "🚀 Starting API Server..."
    
    # Check if API server port is available
    if ! check_port $API_PORT; then
        print_warning "Port $API_PORT is in use, finding alternative..."
        API_PORT=$(find_available_port $API_PORT)
        print_status "Using port $API_PORT for API server"
    fi
    
    # Set environment variables
    export PROMPTCRAFT_API_PORT=$API_PORT
    export PROMPTCRAFT_ENV=development
    export PROMPTCRAFT_DEBUG=true
    
    # Start API server in background
    print_status "Starting API server on port $API_PORT..."
    python3 api_server.py &
    API_PID=$!
    
    # Wait for server to start
    print_status "Waiting for API server to start..."
    for i in {1..30}; do
        if curl -s "http://localhost:$API_PORT/health" > /dev/null 2>&1; then
            print_success "API server started successfully"
            print_status "API Documentation: http://localhost:$API_PORT/docs"
            print_status "Health Check: http://localhost:$API_PORT/health"
            return 0
        fi
        sleep 1
    done
    
    print_error "API server failed to start"
    return 1
}

# Function to start web server
start_web_server() {
    if [ -f "prompt_craft.html" ]; then
        print_header "🌐 Starting Web Server..."
        
        # Check if web server port is available
        if ! check_port $WEB_PORT; then
            print_warning "Port $WEB_PORT is in use, finding alternative..."
            WEB_PORT=$(find_available_port $WEB_PORT)
            print_status "Using port $WEB_PORT for web server"
        fi
        
        # Start web server in background
        print_status "Starting web server on port $WEB_PORT..."
        python3 -m http.server $WEB_PORT &
        WEB_PID=$!
        
        # Wait for server to start
        sleep 2
        if curl -s "http://localhost:$WEB_PORT/prompt_craft.html" > /dev/null 2>&1; then
            print_success "Web server started successfully"
            print_status "Web Interface: http://localhost:$WEB_PORT/prompt_craft.html"
        else
            print_warning "Web server may not have started properly"
        fi
    fi
}

# Function to show usage examples
show_usage_examples() {
    print_header "📖 Usage Examples"
    
    echo -e "${WHITE}Command Line Interface:${NC}"
    echo "  python3 prompt_craft.py -i                    # Interactive mode"
    echo "  python3 prompt_craft.py 'write a function'    # Direct usage"
    echo "  python3 prompt_craft.py -m gpt4 'explain AI'  # Model-specific"
    echo ""
    
    echo -e "${WHITE}API Endpoints:${NC}"
    echo "  curl -X POST http://localhost:$API_PORT/enhance \\"
    echo "    -H 'Content-Type: application/json' \\"
    echo "    -d '{\"prompt\": \"write a function\", \"model\": \"gpt4\"}'"
    echo ""
    
    echo -e "${WHITE}Batch Processing:${NC}"
    echo "  python3 batch_processor.py --csv input.csv --output results.csv"
    echo "  python3 batch_processor.py --json input.json --output results.json"
    echo ""
    
    echo -e "${WHITE}Analytics:${NC}"
    echo "  python3 analytics.py --summary               # View analytics"
    echo "  python3 analytics.py --export report.json    # Export data"
    echo ""
    
    echo -e "${WHITE}Integrations:${NC}"
    echo "  python3 integrations.py --status             # Check integrations"
    echo "  python3 integrations.py --list               # List enabled"
    echo ""
}

# Function to show running services
show_running_services() {
    print_header "🔧 Running Services"
    
    echo -e "${WHITE}Active Services:${NC}"
    if [ ! -z "$API_PID" ]; then
        echo "  • API Server (PID: $API_PID) - http://localhost:$API_PORT"
        echo "    └── Documentation: http://localhost:$API_PORT/docs"
        echo "    └── Health Check: http://localhost:$API_PORT/health"
    fi
    
    if [ ! -z "$WEB_PID" ]; then
        echo "  • Web Server (PID: $WEB_PID) - http://localhost:$WEB_PORT"
        echo "    └── Interface: http://localhost:$WEB_PORT/prompt_craft.html"
    fi
    
    echo ""
    echo -e "${WHITE}Stop Services:${NC}"
    if [ ! -z "$API_PID" ] || [ ! -z "$WEB_PID" ]; then
        echo "  kill $API_PID $WEB_PID 2>/dev/null || true"
    fi
    echo "  # Or press Ctrl+C to stop this script and all services"
}

# Function to cleanup on exit
cleanup() {
    print_header "🧹 Cleaning up..."
    
    if [ ! -z "$API_PID" ]; then
        print_status "Stopping API server (PID: $API_PID)..."
        kill $API_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$WEB_PID" ]; then
        print_status "Stopping web server (PID: $WEB_PID)..."
        kill $WEB_PID 2>/dev/null || true
    fi
    
    print_success "Cleanup completed"
}

# Function to wait for user input
wait_for_user() {
    echo ""
    print_status "Press Ctrl+C to stop all services, or Enter to run tests..."
    read -r
    
    # Run comprehensive tests
    if [ -f "test_new_features.py" ]; then
        print_header "🧪 Running Comprehensive Tests..."
        python3 test_new_features.py
    fi
}

# Main installation and startup function
main() {
    # Set trap for cleanup
    trap cleanup EXIT INT TERM
    
    # Print banner
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    PromptCraft Installer                     ║"
    echo "║              Complete Automated Setup Script                ║"
    echo "║                                                              ║"
    echo "║  This script will:                                          ║"
    echo "║  • Check system requirements                                 ║"
    echo "║  • Install all dependencies                                  ║"
    echo "║  • Set up configuration                                      ║"
    echo "║  • Start all services                                        ║"
    echo "║  • Run tests                                                 ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    # Check if we're in the right directory
    if [ ! -f "prompt_craft.py" ]; then
        print_error "prompt_craft.py not found. Please run this script from the PromptCraft directory."
        exit 1
    fi
    
    # Step 1: Check system requirements
    check_system_requirements
    
    # Step 2: Create virtual environment
    create_virtual_environment
    
    # Step 3: Install Python dependencies
    install_python_dependencies
    
    # Step 4: Install Node.js dependencies (if available)
    install_node_dependencies
    
    # Step 5: Setup configuration
    setup_configuration
    
    # Step 6: Run basic tests
    run_tests
    
    # Step 7: Start API server
    if start_api_server; then
        API_STARTED=true
    else
        API_STARTED=false
        print_warning "API server failed to start, but continuing..."
    fi
    
    # Step 8: Start web server
    start_web_server
    
    # Step 9: Show usage examples
    show_usage_examples
    
    # Step 10: Show running services
    show_running_services
    
    # Final success message
    echo ""
    print_header "🎉 Installation and Setup Complete!"
    
    if [ "$API_STARTED" = true ]; then
        echo -e "${GREEN}✅ PromptCraft is now running and ready to use!${NC}"
        echo ""
        echo -e "${WHITE}Quick Start:${NC}"
        echo "  1. Visit http://localhost:$API_PORT/docs for API documentation"
        echo "  2. Visit http://localhost:$WEB_PORT/prompt_craft.html for web interface"
        echo "  3. Try: python3 prompt_craft.py -i for interactive mode"
        echo ""
    else
        echo -e "${YELLOW}⚠️ PromptCraft installed but API server failed to start${NC}"
        echo "  Try running: python3 api_server.py manually"
        echo ""
    fi
    
    # Wait for user input or run tests
    wait_for_user
}

# Run main function
main "$@"