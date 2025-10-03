#!/bin/bash
# PromptCraft API Server Startup Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting PromptCraft API Server${NC}"

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed${NC}"
    exit 1
fi

# Check if required files exist
if [ ! -f "api_server.py" ]; then
    echo -e "${RED}❌ api_server.py not found${NC}"
    exit 1
fi

if [ ! -f "prompt_craft.py" ]; then
    echo -e "${RED}❌ prompt_craft.py not found${NC}"
    exit 1
fi

# Set default environment variables
export PROMPTCRAFT_ENV=${PROMPTCRAFT_ENV:-"development"}
export PROMPTCRAFT_API_HOST=${PROMPTCRAFT_API_HOST:-"0.0.0.0"}
export PROMPTCRAFT_API_PORT=${PROMPTCRAFT_API_PORT:-"8080"}
export PROMPTCRAFT_DEBUG=${PROMPTCRAFT_DEBUG:-"false"}
export PROMPTCRAFT_LOG_LEVEL=${PROMPTCRAFT_LOG_LEVEL:-"info"}

# Load environment file if it exists
if [ -f ".env" ]; then
    echo -e "${YELLOW}📄 Loading environment from .env file${NC}"
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check if dependencies are installed
echo -e "${YELLOW}🔍 Checking dependencies...${NC}"
python3 -c "import fastapi, uvicorn, pydantic, requests" 2>/dev/null || {
    echo -e "${RED}❌ Missing dependencies. Installing...${NC}"
    pip3 install -r requirements.txt
}

# Create config directory if it doesn't exist
CONFIG_DIR=${PROMPTCRAFT_CONFIG_DIR:-"$HOME/.config/promptcraft"}
mkdir -p "$CONFIG_DIR"

# Initialize configuration if it doesn't exist
if [ ! -f "$CONFIG_DIR/config.json" ]; then
    echo -e "${YELLOW}⚙️ Creating default configuration...${NC}"
    python3 prompt_craft.py -i <<< $'\n\n\n\ntest prompt\n\n' > /dev/null 2>&1 || true
fi

# Start the API server
echo -e "${GREEN}✅ Starting API server on ${PROMPTCRAFT_API_HOST}:${PROMPTCRAFT_API_PORT}${NC}"
echo -e "${BLUE}📖 API Documentation: http://${PROMPTCRAFT_API_HOST}:${PROMPTCRAFT_API_PORT}/docs${NC}"
echo -e "${BLUE}🔧 Health Check: http://${PROMPTCRAFT_API_HOST}:${PROMPTCRAFT_API_PORT}/health${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo ""

# Start the server
python3 api_server.py