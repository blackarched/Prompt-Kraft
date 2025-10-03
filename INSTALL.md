# PromptCraft Installation Guide

## 🚀 Quick Start - Automatic Installation

PromptCraft provides **three automated installation scripts** that handle everything for you:

### Option 1: Bash Script (Linux/macOS) - **Recommended**
```bash
# Make executable and run
chmod +x install_and_run.sh
./install_and_run.sh
```

### Option 2: Python Script (Cross-Platform)
```bash
# Works on Windows, Linux, and macOS
python3 install_and_run.py
```

### Option 3: Windows Batch File
```cmd
# For Windows users
install_and_run.bat
```

## 📋 What the Installation Scripts Do

### **Automatic System Check**
- ✅ Verify Python 3.7+ installation
- ✅ Check pip availability  
- ✅ Detect Node.js (optional)
- ✅ Verify curl and git (optional)
- ✅ OS compatibility check

### **Dependency Installation**
- ✅ Create Python virtual environment
- ✅ Install all Python packages from `requirements.txt`
- ✅ Install Node.js packages (if available)
- ✅ Upgrade pip to latest version

### **Configuration Setup**
- ✅ Create config directory (`~/.config/promptcraft/`)
- ✅ Initialize default configuration files
- ✅ Set up environment variables
- ✅ Create integrations configuration
- ✅ Copy `.env` template

### **Service Startup**
- ✅ Start API server on port 8080 (auto-find available port)
- ✅ Start web server on port 8000 (auto-find available port)
- ✅ Health check all services
- ✅ Display service URLs and documentation links

### **Testing & Validation**
- ✅ Test core prompt enhancement
- ✅ Test analytics system
- ✅ Test integrations
- ✅ Run comprehensive test suite
- ✅ Validate all endpoints

## 🎯 After Installation

Once installation completes, you'll have:

### **API Server Running**
- 📖 **Documentation**: `http://localhost:8080/docs`
- 🔍 **Health Check**: `http://localhost:8080/health`
- 🚀 **API Endpoints**: Ready for programmatic access

### **Web Interface Running**
- 🌐 **Web UI**: `http://localhost:8000/prompt_craft.html`
- 🎨 **Cyberpunk Theme**: Beautiful interactive interface
- 📱 **Responsive**: Works on desktop and mobile

### **Command Line Tools**
```bash
# Interactive mode
python3 prompt_craft.py -i

# Direct usage
python3 prompt_craft.py "write a Python function"

# Model-specific
python3 prompt_craft.py -m gpt4 "explain quantum computing"

# Batch processing
python3 batch_processor.py --csv input.csv --output results.csv

# Analytics
python3 analytics.py --summary

# Integrations
python3 integrations.py --status
```

## 🔧 Manual Installation (If Needed)

If the automatic scripts don't work, follow these manual steps:

### 1. Install Dependencies
```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # Linux/macOS
# OR
venv\Scripts\activate.bat  # Windows

# Install packages
pip install -r requirements.txt
```

### 2. Setup Configuration
```bash
# Create config directory
mkdir -p ~/.config/promptcraft

# Initialize configuration
python3 prompt_craft.py -i

# Copy environment template
cp .env.example .env
```

### 3. Start Services
```bash
# Start API server
python3 api_server.py &

# Start web server
python3 -m http.server 8000 &
```

## 🐛 Troubleshooting

### **Common Issues**

#### Python Not Found
```bash
# Install Python 3.7+
# Ubuntu/Debian:
sudo apt-get install python3 python3-pip

# macOS (with Homebrew):
brew install python3

# Windows: Download from python.org
```

#### Port Already in Use
```bash
# The scripts automatically find available ports
# Or manually specify ports:
export PROMPTCRAFT_API_PORT=8081
export PROMPTCRAFT_WEB_PORT=8001
```

#### Permission Denied
```bash
# Make scripts executable
chmod +x install_and_run.sh
chmod +x install_and_run.py

# Or run with explicit interpreter
bash install_and_run.sh
python3 install_and_run.py
```

#### Dependencies Fail to Install
```bash
# Update pip first
pip install --upgrade pip

# Install with verbose output
pip install -r requirements.txt -v

# Try with user flag
pip install -r requirements.txt --user
```

### **System-Specific Issues**

#### **Linux**
```bash
# Install system dependencies
sudo apt-get update
sudo apt-get install python3-dev python3-pip curl git

# For CentOS/RHEL:
sudo yum install python3-devel python3-pip curl git
```

#### **macOS**
```bash
# Install Homebrew if needed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Python
brew install python3
```

#### **Windows**
```cmd
# Install Python from python.org
# Make sure to check "Add Python to PATH"

# Install Git for Windows (includes curl)
# Download from git-scm.com
```

## 🔍 Verification

After installation, verify everything works:

### **Test API Server**
```bash
curl http://localhost:8080/health
```

### **Test Web Interface**
Open `http://localhost:8000/prompt_craft.html` in your browser

### **Test CLI**
```bash
python3 prompt_craft.py "test prompt"
```

### **Run Full Test Suite**
```bash
python3 test_new_features.py
```

## 🚀 Next Steps

1. **Configure Integrations**: Edit `~/.config/promptcraft/integrations.json`
2. **Set Environment Variables**: Edit `.env` file
3. **Explore API**: Visit `http://localhost:8080/docs`
4. **Try Web Interface**: Visit `http://localhost:8000/prompt_craft.html`
5. **Read Documentation**: Check `docs/` directory

## 💡 Pro Tips

- **Use Virtual Environment**: Always activate `venv` before running commands
- **Check Logs**: API server logs show in terminal
- **Port Conflicts**: Scripts auto-detect and use alternative ports
- **Configuration**: Customize templates in `~/.config/promptcraft/config.json`
- **Integrations**: Enable Slack, Discord, email notifications
- **Analytics**: View usage statistics with `python3 analytics.py --summary`

## 🆘 Support

If you encounter issues:

1. **Check Prerequisites**: Python 3.7+, pip installed
2. **Run with Verbose**: Add `-v` flag to commands
3. **Check Logs**: Look at terminal output for errors
4. **Try Manual Steps**: Follow manual installation if scripts fail
5. **Report Issues**: Create GitHub issue with error details

---

**🎉 Welcome to PromptCraft! Transform your prompts and enhance your AI interactions.**