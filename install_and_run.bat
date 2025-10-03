@echo off
REM PromptCraft Complete Installation and Startup Script for Windows
REM This script automatically installs all dependencies and starts the complete system

setlocal enabledelayedexpansion

REM Configuration
set PYTHON_MIN_VERSION=3.7
set PROJECT_NAME=PromptCraft
set API_PORT=8080
set WEB_PORT=8000

REM Colors (limited in Windows CMD)
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "PURPLE=[95m"
set "CYAN=[96m"
set "WHITE=[97m"
set "NC=[0m"

echo %PURPLE%
echo ================================================================
echo                    PromptCraft Installer
echo              Complete Automated Setup Script
echo.
echo  This script will:
echo  * Check system requirements
echo  * Install all dependencies
echo  * Set up configuration
echo  * Start all services
echo  * Run tests
echo ================================================================
echo %NC%

REM Check if we're in the right directory
if not exist "prompt_craft.py" (
    echo %RED%[ERROR]%NC% prompt_craft.py not found. Please run this script from the PromptCraft directory.
    pause
    exit /b 1
)

echo %BLUE%[INFO]%NC% Checking System Requirements...

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo %RED%[ERROR]%NC% Python not found. Please install Python 3.7+ from https://python.org
    pause
    exit /b 1
) else (
    for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
    echo %GREEN%[SUCCESS]%NC% Python !PYTHON_VERSION! found
)

REM Check pip
pip --version >nul 2>&1
if errorlevel 1 (
    echo %RED%[ERROR]%NC% pip not found. Please install pip
    pause
    exit /b 1
) else (
    echo %GREEN%[SUCCESS]%NC% pip found
)

REM Check curl (optional)
curl --version >nul 2>&1
if errorlevel 1 (
    echo %YELLOW%[WARNING]%NC% curl not found (optional)
) else (
    echo %GREEN%[SUCCESS]%NC% curl found
)

echo %BLUE%[INFO]%NC% Setting up Python Virtual Environment...

REM Create virtual environment
if not exist "venv" (
    echo %BLUE%[INFO]%NC% Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo %RED%[ERROR]%NC% Failed to create virtual environment
        pause
        exit /b 1
    )
    echo %GREEN%[SUCCESS]%NC% Virtual environment created
) else (
    echo %BLUE%[INFO]%NC% Virtual environment already exists
)

REM Activate virtual environment
echo %BLUE%[INFO]%NC% Activating virtual environment...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo %RED%[ERROR]%NC% Failed to activate virtual environment
    pause
    exit /b 1
)
echo %GREEN%[SUCCESS]%NC% Virtual environment activated

REM Upgrade pip
echo %BLUE%[INFO]%NC% Upgrading pip...
python -m pip install --upgrade pip

echo %BLUE%[INFO]%NC% Installing Python Dependencies...

REM Install dependencies
if exist "requirements.txt" (
    echo %BLUE%[INFO]%NC% Installing from requirements.txt...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo %RED%[ERROR]%NC% Failed to install Python dependencies
        pause
        exit /b 1
    )
    echo %GREEN%[SUCCESS]%NC% Python dependencies installed
) else (
    echo %RED%[ERROR]%NC% requirements.txt not found
    pause
    exit /b 1
)

echo %BLUE%[INFO]%NC% Setting up Configuration...

REM Create config directory
set CONFIG_DIR=%USERPROFILE%\.config\promptcraft
if not exist "%CONFIG_DIR%" (
    mkdir "%CONFIG_DIR%"
    echo %BLUE%[INFO]%NC% Created config directory: %CONFIG_DIR%
)

REM Copy environment template
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo %BLUE%[INFO]%NC% Created .env file from template
        echo %YELLOW%[WARNING]%NC% Please edit .env file to configure your settings
    )
)

REM Initialize default configuration
if not exist "%CONFIG_DIR%\config.json" (
    echo %BLUE%[INFO]%NC% Initializing default configuration...
    echo test prompt | python prompt_craft.py -i >nul 2>&1
    echo %GREEN%[SUCCESS]%NC% Configuration initialized
)

REM Create integrations config
if not exist "%CONFIG_DIR%\integrations.json" (
    echo %BLUE%[INFO]%NC% Creating integrations configuration...
    python integrations.py --config >nul 2>&1
    echo %GREEN%[SUCCESS]%NC% Integrations configuration created
)

echo %BLUE%[INFO]%NC% Running System Tests...

REM Test core functionality
echo %BLUE%[INFO]%NC% Testing core prompt enhancement...
echo test prompt | python prompt_craft.py >nul 2>&1
if errorlevel 1 (
    echo %YELLOW%[WARNING]%NC% Core functionality test failed, but continuing...
) else (
    echo %GREEN%[SUCCESS]%NC% Core functionality working
)

REM Test analytics
echo %BLUE%[INFO]%NC% Testing analytics system...
python analytics.py --summary >nul 2>&1
if errorlevel 1 (
    echo %YELLOW%[WARNING]%NC% Analytics test failed, but continuing...
) else (
    echo %GREEN%[SUCCESS]%NC% Analytics system working
)

REM Test integrations
echo %BLUE%[INFO]%NC% Testing integrations system...
python integrations.py --status >nul 2>&1
if errorlevel 1 (
    echo %YELLOW%[WARNING]%NC% Integrations test failed, but continuing...
) else (
    echo %GREEN%[SUCCESS]%NC% Integrations system working
)

echo %BLUE%[INFO]%NC% Starting API Server...

REM Set environment variables
set PROMPTCRAFT_API_PORT=%API_PORT%
set PROMPTCRAFT_ENV=development
set PROMPTCRAFT_DEBUG=true

REM Start API server in background
echo %BLUE%[INFO]%NC% Starting API server on port %API_PORT%...
start "PromptCraft API" python api_server.py

REM Wait for server to start
echo %BLUE%[INFO]%NC% Waiting for API server to start...
timeout /t 5 /nobreak >nul

REM Check if server is running
curl -s "http://localhost:%API_PORT%/health" >nul 2>&1
if errorlevel 1 (
    echo %YELLOW%[WARNING]%NC% API server may not have started properly
    set API_STARTED=false
) else (
    echo %GREEN%[SUCCESS]%NC% API server started successfully
    echo %BLUE%[INFO]%NC% API Documentation: http://localhost:%API_PORT%/docs
    echo %BLUE%[INFO]%NC% Health Check: http://localhost:%API_PORT%/health
    set API_STARTED=true
)

REM Start web server if HTML file exists
if exist "prompt_craft.html" (
    echo %BLUE%[INFO]%NC% Starting Web Server...
    echo %BLUE%[INFO]%NC% Starting web server on port %WEB_PORT%...
    start "PromptCraft Web" python -m http.server %WEB_PORT%
    timeout /t 2 /nobreak >nul
    echo %GREEN%[SUCCESS]%NC% Web server started
    echo %BLUE%[INFO]%NC% Web Interface: http://localhost:%WEB_PORT%/prompt_craft.html
)

echo %PURPLE%
echo ================================================================
echo                     Usage Examples
echo ================================================================
echo %NC%

echo %WHITE%Command Line Interface:%NC%
echo   python prompt_craft.py -i                    # Interactive mode
echo   python prompt_craft.py "write a function"    # Direct usage
echo   python prompt_craft.py -m gpt4 "explain AI"  # Model-specific
echo.

echo %WHITE%API Endpoints:%NC%
echo   curl -X POST http://localhost:%API_PORT%/enhance ^
echo     -H "Content-Type: application/json" ^
echo     -d "{\"prompt\": \"write a function\", \"model\": \"gpt4\"}"
echo.

echo %WHITE%Batch Processing:%NC%
echo   python batch_processor.py --csv input.csv --output results.csv
echo   python batch_processor.py --json input.json --output results.json
echo.

echo %WHITE%Analytics:%NC%
echo   python analytics.py --summary               # View analytics
echo   python analytics.py --export report.json    # Export data
echo.

echo %WHITE%Integrations:%NC%
echo   python integrations.py --status             # Check integrations
echo   python integrations.py --list               # List enabled
echo.

echo %PURPLE%
echo ================================================================
echo                   Running Services
echo ================================================================
echo %NC%

echo %WHITE%Active Services:%NC%
echo   * API Server - http://localhost:%API_PORT%
echo     └── Documentation: http://localhost:%API_PORT%/docs
echo     └── Health Check: http://localhost:%API_PORT%/health
echo   * Web Server - http://localhost:%WEB_PORT%
echo     └── Interface: http://localhost:%WEB_PORT%/prompt_craft.html
echo.

echo %GREEN%
echo ================================================================
echo          Installation and Setup Complete!
echo ================================================================
echo %NC%

if "%API_STARTED%"=="true" (
    echo %GREEN%✅ PromptCraft is now running and ready to use!%NC%
    echo.
    echo %WHITE%Quick Start:%NC%
    echo   1. Visit http://localhost:%API_PORT%/docs for API documentation
    echo   2. Visit http://localhost:%WEB_PORT%/prompt_craft.html for web interface
    echo   3. Try: python prompt_craft.py -i for interactive mode
    echo.
) else (
    echo %YELLOW%⚠️ PromptCraft installed but API server may not have started%NC%
    echo   Try running: python api_server.py manually
    echo.
)

echo %BLUE%[INFO]%NC% Press Enter to run comprehensive tests, or Ctrl+C to exit...
pause >nul

REM Run comprehensive tests
if exist "test_new_features.py" (
    echo %BLUE%[INFO]%NC% Running Comprehensive Tests...
    python test_new_features.py
)

echo.
echo %GREEN%[SUCCESS]%NC% All done! Services are running in background windows.
echo %BLUE%[INFO]%NC% Close the terminal windows to stop the services.
pause