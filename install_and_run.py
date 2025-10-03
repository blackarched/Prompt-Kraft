#!/usr/bin/env python3
"""
PromptCraft Complete Installation and Startup Script (Python Version)
Cross-platform installer that works on Windows, macOS, and Linux
"""

import os
import sys
import subprocess
import platform
import time
import json
import urllib.request
import shutil
from pathlib import Path
from typing import Optional, List, Tuple

# Configuration
PYTHON_MIN_VERSION = (3, 7)
NODE_MIN_VERSION = (16, 0)
API_PORT = 8080
WEB_PORT = 8000

# Colors for cross-platform output
class Colors:
    if platform.system() == "Windows":
        # Windows doesn't support ANSI colors in older versions
        RED = YELLOW = GREEN = BLUE = PURPLE = CYAN = WHITE = NC = ""
    else:
        RED = '\033[0;31m'
        YELLOW = '\033[1;33m'
        GREEN = '\033[0;32m'
        BLUE = '\033[0;34m'
        PURPLE = '\033[0;35m'
        CYAN = '\033[0;36m'
        WHITE = '\033[1;37m'
        NC = '\033[0m'

def print_colored(message: str, color: str = ""):
    """Print colored message"""
    print(f"{color}{message}{Colors.NC}")

def print_status(message: str):
    print_colored(f"[INFO] {message}", Colors.BLUE)

def print_success(message: str):
    print_colored(f"[SUCCESS] {message}", Colors.GREEN)

def print_warning(message: str):
    print_colored(f"[WARNING] {message}", Colors.YELLOW)

def print_error(message: str):
    print_colored(f"[ERROR] {message}", Colors.RED)

def print_header(message: str):
    print_colored(message, Colors.PURPLE)

def run_command(command: List[str], capture_output: bool = True, timeout: int = 300) -> Tuple[bool, str, str]:
    """Run a command and return success status, stdout, stderr"""
    try:
        if capture_output:
            result = subprocess.run(
                command, 
                capture_output=True, 
                text=True, 
                timeout=timeout,
                check=False
            )
            return result.returncode == 0, result.stdout.strip(), result.stderr.strip()
        else:
            result = subprocess.run(command, timeout=timeout, check=False)
            return result.returncode == 0, "", ""
    except subprocess.TimeoutExpired:
        return False, "", "Command timed out"
    except Exception as e:
        return False, "", str(e)

def command_exists(command: str) -> bool:
    """Check if a command exists"""
    return shutil.which(command) is not None

def get_python_version() -> Tuple[int, int]:
    """Get current Python version"""
    return sys.version_info[:2]

def get_node_version() -> Optional[Tuple[int, int]]:
    """Get Node.js version if available"""
    if not command_exists("node"):
        return None
    
    success, stdout, _ = run_command(["node", "--version"])
    if success:
        try:
            version_str = stdout.strip().lstrip('v')
            major, minor = version_str.split('.')[:2]
            return (int(major), int(minor))
        except:
            return None
    return None

def check_system_requirements() -> dict:
    """Check system requirements and return status"""
    print_header("🔍 Checking System Requirements...")
    
    status = {
        'os': platform.system(),
        'python_ok': False,
        'pip_ok': False,
        'node_ok': False,
        'curl_ok': False,
        'git_ok': False
    }
    
    # Check OS
    print_status(f"Operating System: {status['os']}")
    
    # Check Python
    python_version = get_python_version()
    if python_version >= PYTHON_MIN_VERSION:
        print_success(f"Python {python_version[0]}.{python_version[1]} found (>= {PYTHON_MIN_VERSION[0]}.{PYTHON_MIN_VERSION[1]} required)")
        status['python_ok'] = True
    else:
        print_error(f"Python {python_version[0]}.{python_version[1]} found, but >= {PYTHON_MIN_VERSION[0]}.{PYTHON_MIN_VERSION[1]} required")
    
    # Check pip
    if command_exists("pip") or command_exists("pip3"):
        print_success("pip found")
        status['pip_ok'] = True
    else:
        print_error("pip not found")
    
    # Check Node.js (optional)
    node_version = get_node_version()
    if node_version and node_version >= NODE_MIN_VERSION:
        print_success(f"Node.js {node_version[0]}.{node_version[1]} found (>= {NODE_MIN_VERSION[0]}.{NODE_MIN_VERSION[1]} required)")
        status['node_ok'] = True
    elif node_version:
        print_warning(f"Node.js {node_version[0]}.{node_version[1]} found, but >= {NODE_MIN_VERSION[0]}.{NODE_MIN_VERSION[1]} recommended")
    else:
        print_warning("Node.js not found (optional for web interface)")
    
    # Check curl
    if command_exists("curl"):
        print_success("curl found")
        status['curl_ok'] = True
    else:
        print_warning("curl not found (optional)")
    
    # Check git
    if command_exists("git"):
        print_success("git found")
        status['git_ok'] = True
    else:
        print_warning("git not found (optional)")
    
    return status

def create_virtual_environment() -> bool:
    """Create and activate virtual environment"""
    print_header("🐍 Setting up Python Virtual Environment...")
    
    venv_path = Path("venv")
    
    if venv_path.exists():
        print_status("Virtual environment already exists")
    else:
        print_status("Creating virtual environment...")
        success, _, stderr = run_command([sys.executable, "-m", "venv", "venv"])
        if not success:
            print_error(f"Failed to create virtual environment: {stderr}")
            return False
        print_success("Virtual environment created")
    
    return True

def get_pip_command() -> str:
    """Get the appropriate pip command"""
    venv_path = Path("venv")
    
    if platform.system() == "Windows":
        pip_path = venv_path / "Scripts" / "pip.exe"
    else:
        pip_path = venv_path / "bin" / "pip"
    
    if pip_path.exists():
        return str(pip_path)
    
    # Fallback to system pip
    return "pip3" if command_exists("pip3") else "pip"

def get_python_command() -> str:
    """Get the appropriate Python command"""
    venv_path = Path("venv")
    
    if platform.system() == "Windows":
        python_path = venv_path / "Scripts" / "python.exe"
    else:
        python_path = venv_path / "bin" / "python"
    
    if python_path.exists():
        return str(python_path)
    
    # Fallback to system python
    return sys.executable

def install_python_dependencies() -> bool:
    """Install Python dependencies"""
    print_header("📦 Installing Python Dependencies...")
    
    if not Path("requirements.txt").exists():
        print_error("requirements.txt not found")
        return False
    
    pip_cmd = get_pip_command()
    
    # Upgrade pip first
    print_status("Upgrading pip...")
    success, _, stderr = run_command([pip_cmd, "install", "--upgrade", "pip"])
    if not success:
        print_warning(f"Failed to upgrade pip: {stderr}")
    
    # Install dependencies
    print_status("Installing from requirements.txt...")
    success, _, stderr = run_command([pip_cmd, "install", "-r", "requirements.txt"])
    if not success:
        print_error(f"Failed to install dependencies: {stderr}")
        return False
    
    print_success("Python dependencies installed")
    return True

def setup_configuration() -> bool:
    """Setup configuration files"""
    print_header("⚙️ Setting up Configuration...")
    
    # Create config directory
    if platform.system() == "Windows":
        config_dir = Path.home() / ".config" / "promptcraft"
    else:
        config_dir = Path.home() / ".config" / "promptcraft"
    
    config_dir.mkdir(parents=True, exist_ok=True)
    print_status(f"Created config directory: {config_dir}")
    
    # Copy environment template
    env_file = Path(".env")
    env_example = Path(".env.example")
    
    if not env_file.exists() and env_example.exists():
        shutil.copy(env_example, env_file)
        print_status("Created .env file from template")
        print_warning("Please edit .env file to configure your settings")
    
    # Initialize default configuration
    config_file = config_dir / "config.json"
    if not config_file.exists():
        print_status("Initializing default configuration...")
        python_cmd = get_python_command()
        
        # Try to create config programmatically
        try:
            success, _, stderr = run_command([
                python_cmd, "-c",
                f"from prompt_craft import create_default_config; create_default_config()"
            ])
            if success:
                print_success("Configuration initialized")
            else:
                # Fallback: try interactive mode with automated input
                print_status("Creating configuration interactively...")
                process = subprocess.Popen(
                    [python_cmd, "prompt_craft.py", "-i"],
                    stdin=subprocess.PIPE,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )
                stdout, stderr = process.communicate(input="\n\n\ntest prompt\n\n")
                if process.returncode == 0:
                    print_success("Configuration initialized")
                else:
                    print_warning("Configuration initialization may have failed")
        except Exception as e:
            print_warning(f"Configuration setup encountered issues: {e}")
    
    # Create integrations config
    integrations_file = config_dir / "integrations.json"
    if not integrations_file.exists():
        print_status("Creating integrations configuration...")
        python_cmd = get_python_command()
        success, _, _ = run_command([python_cmd, "integrations.py", "--config"])
        if success:
            print_success("Integrations configuration created")
    
    return True

def run_tests() -> bool:
    """Run basic system tests"""
    print_header("🧪 Running System Tests...")
    
    python_cmd = get_python_command()
    
    # Test core functionality
    print_status("Testing core prompt enhancement...")
    success, _, _ = run_command([python_cmd, "prompt_craft.py", "test prompt"])
    if success:
        print_success("Core functionality working")
    else:
        print_warning("Core functionality test failed, but continuing...")
    
    # Test analytics
    print_status("Testing analytics system...")
    success, _, _ = run_command([python_cmd, "analytics.py", "--summary"])
    if success:
        print_success("Analytics system working")
    else:
        print_warning("Analytics test failed, but continuing...")
    
    # Test integrations
    print_status("Testing integrations system...")
    success, _, _ = run_command([python_cmd, "integrations.py", "--status"])
    if success:
        print_success("Integrations system working")
    else:
        print_warning("Integrations test failed, but continuing...")
    
    return True

def check_port_available(port: int) -> bool:
    """Check if a port is available"""
    import socket
    
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(('localhost', port))
            return True
    except OSError:
        return False

def find_available_port(start_port: int) -> int:
    """Find an available port starting from start_port"""
    port = start_port
    while not check_port_available(port) and port < start_port + 100:
        port += 1
    
    if port >= start_port + 100:
        raise Exception(f"Could not find available port starting from {start_port}")
    
    return port

def start_api_server() -> Optional[subprocess.Popen]:
    """Start the API server"""
    print_header("🚀 Starting API Server...")
    
    global API_PORT
    
    # Check if port is available
    if not check_port_available(API_PORT):
        print_warning(f"Port {API_PORT} is in use, finding alternative...")
        API_PORT = find_available_port(API_PORT)
        print_status(f"Using port {API_PORT} for API server")
    
    # Set environment variables
    env = os.environ.copy()
    env['PROMPTCRAFT_API_PORT'] = str(API_PORT)
    env['PROMPTCRAFT_ENV'] = 'development'
    env['PROMPTCRAFT_DEBUG'] = 'true'
    
    # Start API server
    python_cmd = get_python_command()
    print_status(f"Starting API server on port {API_PORT}...")
    
    try:
        process = subprocess.Popen(
            [python_cmd, "api_server.py"],
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Wait for server to start
        print_status("Waiting for API server to start...")
        for i in range(30):
            try:
                with urllib.request.urlopen(f"http://localhost:{API_PORT}/health", timeout=1) as response:
                    if response.status == 200:
                        print_success("API server started successfully")
                        print_status(f"API Documentation: http://localhost:{API_PORT}/docs")
                        print_status(f"Health Check: http://localhost:{API_PORT}/health")
                        return process
            except:
                pass
            time.sleep(1)
        
        print_error("API server failed to start within timeout")
        process.terminate()
        return None
        
    except Exception as e:
        print_error(f"Failed to start API server: {e}")
        return None

def start_web_server() -> Optional[subprocess.Popen]:
    """Start the web server"""
    if not Path("prompt_craft.html").exists():
        return None
    
    print_header("🌐 Starting Web Server...")
    
    global WEB_PORT
    
    # Check if port is available
    if not check_port_available(WEB_PORT):
        print_warning(f"Port {WEB_PORT} is in use, finding alternative...")
        WEB_PORT = find_available_port(WEB_PORT)
        print_status(f"Using port {WEB_PORT} for web server")
    
    # Start web server
    python_cmd = get_python_command()
    print_status(f"Starting web server on port {WEB_PORT}...")
    
    try:
        process = subprocess.Popen(
            [python_cmd, "-m", "http.server", str(WEB_PORT)],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Wait a moment for server to start
        time.sleep(2)
        
        try:
            with urllib.request.urlopen(f"http://localhost:{WEB_PORT}/prompt_craft.html", timeout=2) as response:
                if response.status == 200:
                    print_success("Web server started successfully")
                    print_status(f"Web Interface: http://localhost:{WEB_PORT}/prompt_craft.html")
                    return process
        except:
            pass
        
        print_warning("Web server may not have started properly")
        return process
        
    except Exception as e:
        print_error(f"Failed to start web server: {e}")
        return None

def show_usage_examples():
    """Show usage examples"""
    print_header("📖 Usage Examples")
    
    python_cmd = get_python_command()
    
    print_colored("Command Line Interface:", Colors.WHITE)
    print(f"  {python_cmd} prompt_craft.py -i                    # Interactive mode")
    print(f"  {python_cmd} prompt_craft.py 'write a function'    # Direct usage")
    print(f"  {python_cmd} prompt_craft.py -m gpt4 'explain AI'  # Model-specific")
    print()
    
    print_colored("API Endpoints:", Colors.WHITE)
    print(f"  curl -X POST http://localhost:{API_PORT}/enhance \\")
    print("    -H 'Content-Type: application/json' \\")
    print("    -d '{\"prompt\": \"write a function\", \"model\": \"gpt4\"}'")
    print()
    
    print_colored("Batch Processing:", Colors.WHITE)
    print(f"  {python_cmd} batch_processor.py --csv input.csv --output results.csv")
    print(f"  {python_cmd} batch_processor.py --json input.json --output results.json")
    print()
    
    print_colored("Analytics:", Colors.WHITE)
    print(f"  {python_cmd} analytics.py --summary               # View analytics")
    print(f"  {python_cmd} analytics.py --export report.json    # Export data")
    print()
    
    print_colored("Integrations:", Colors.WHITE)
    print(f"  {python_cmd} integrations.py --status             # Check integrations")
    print(f"  {python_cmd} integrations.py --list               # List enabled")
    print()

def show_running_services(api_process, web_process):
    """Show information about running services"""
    print_header("🔧 Running Services")
    
    print_colored("Active Services:", Colors.WHITE)
    if api_process:
        print(f"  • API Server (PID: {api_process.pid}) - http://localhost:{API_PORT}")
        print(f"    └── Documentation: http://localhost:{API_PORT}/docs")
        print(f"    └── Health Check: http://localhost:{API_PORT}/health")
    
    if web_process:
        print(f"  • Web Server (PID: {web_process.pid}) - http://localhost:{WEB_PORT}")
        print(f"    └── Interface: http://localhost:{WEB_PORT}/prompt_craft.html")
    
    print()
    print_colored("Stop Services:", Colors.WHITE)
    if api_process or web_process:
        pids = []
        if api_process:
            pids.append(str(api_process.pid))
        if web_process:
            pids.append(str(web_process.pid))
        
        if platform.system() == "Windows":
            print(f"  taskkill /PID {' /PID '.join(pids)} /F")
        else:
            print(f"  kill {' '.join(pids)}")
    print("  # Or press Ctrl+C to stop this script and all services")

def cleanup_processes(processes):
    """Cleanup running processes"""
    print_header("🧹 Cleaning up...")
    
    for name, process in processes.items():
        if process:
            print_status(f"Stopping {name} (PID: {process.pid})...")
            try:
                process.terminate()
                process.wait(timeout=5)
            except:
                try:
                    process.kill()
                except:
                    pass
    
    print_success("Cleanup completed")

def main():
    """Main installation and startup function"""
    # Print banner
    print_colored("""
╔══════════════════════════════════════════════════════════════╗
║                    PromptCraft Installer                     ║
║              Complete Automated Setup Script                ║
║                                                              ║
║  This script will:                                          ║
║  • Check system requirements                                 ║
║  • Install all dependencies                                  ║
║  • Set up configuration                                      ║
║  • Start all services                                        ║
║  • Run tests                                                 ║
╚══════════════════════════════════════════════════════════════╝
    """, Colors.PURPLE)
    
    # Check if we're in the right directory
    if not Path("prompt_craft.py").exists():
        print_error("prompt_craft.py not found. Please run this script from the PromptCraft directory.")
        return 1
    
    processes = {'API Server': None, 'Web Server': None}
    
    try:
        # Step 1: Check system requirements
        status = check_system_requirements()
        
        if not status['python_ok']:
            print_error("Python requirements not met. Please install Python 3.7+ and try again.")
            return 1
        
        if not status['pip_ok']:
            print_error("pip not found. Please install pip and try again.")
            return 1
        
        # Step 2: Create virtual environment
        if not create_virtual_environment():
            print_error("Failed to create virtual environment")
            return 1
        
        # Step 3: Install Python dependencies
        if not install_python_dependencies():
            print_error("Failed to install Python dependencies")
            return 1
        
        # Step 4: Setup configuration
        if not setup_configuration():
            print_warning("Configuration setup had issues, but continuing...")
        
        # Step 5: Run basic tests
        run_tests()
        
        # Step 6: Start API server
        api_process = start_api_server()
        processes['API Server'] = api_process
        
        # Step 7: Start web server
        web_process = start_web_server()
        processes['Web Server'] = web_process
        
        # Step 8: Show usage examples
        show_usage_examples()
        
        # Step 9: Show running services
        show_running_services(api_process, web_process)
        
        # Final success message
        print()
        print_header("🎉 Installation and Setup Complete!")
        
        if api_process:
            print_colored("✅ PromptCraft is now running and ready to use!", Colors.GREEN)
            print()
            print_colored("Quick Start:", Colors.WHITE)
            print(f"  1. Visit http://localhost:{API_PORT}/docs for API documentation")
            print(f"  2. Visit http://localhost:{WEB_PORT}/prompt_craft.html for web interface")
            print(f"  3. Try: {get_python_command()} prompt_craft.py -i for interactive mode")
            print()
        else:
            print_colored("⚠️ PromptCraft installed but API server failed to start", Colors.YELLOW)
            print(f"  Try running: {get_python_command()} api_server.py manually")
            print()
        
        # Wait for user input
        print_status("Press Enter to run comprehensive tests, or Ctrl+C to exit...")
        try:
            input()
            
            # Run comprehensive tests
            if Path("test_new_features.py").exists():
                print_header("🧪 Running Comprehensive Tests...")
                python_cmd = get_python_command()
                success, stdout, stderr = run_command([python_cmd, "test_new_features.py"], capture_output=False)
                if success:
                    print_success("All tests completed")
                else:
                    print_warning("Some tests may have failed")
            
        except KeyboardInterrupt:
            pass
        
        return 0
        
    except KeyboardInterrupt:
        print_status("Installation interrupted by user")
        return 1
    except Exception as e:
        print_error(f"Installation failed: {e}")
        return 1
    finally:
        cleanup_processes(processes)

if __name__ == "__main__":
    sys.exit(main())