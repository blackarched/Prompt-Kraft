# PromptCraft 🚀

**Neural Prompt Enhancement System**

Transform your basic prompts into professional, optimized instructions for AI models with intelligent template selection and model-specific optimizations.

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Python](https://img.shields.io/badge/Python-3.7+-green.svg)](https://python.org)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org)

## ✨ Features

- 🎯 **Intelligent Template Selection**: Automatically chooses the best prompt template based on keywords
- 🤖 **Multi-Model Optimization**: Tailored enhancements for GPT-4, Claude, Gemini, and more
- 🖥️ **Multiple Interfaces**: CLI, Web UI, and React component
- 📋 **Professional Formatting**: Structures prompts with clear roles, tasks, and requirements
- ⚙️ **Highly Configurable**: Custom templates, keywords, and model instructions
- 🔒 **Security-First**: Input validation, sanitization, and secure coding practices
- 🎨 **Beautiful UI**: Cyberpunk-themed interface with smooth animations
- 📱 **Responsive Design**: Works perfectly on desktop and mobile devices

## 🚀 Quick Start

### Option 1: Python CLI (Recommended)

```bash
# Clone the repository
git clone https://github.com/blackarched/Prompt-Kraft.git
cd Prompt-Kraft

# Install dependencies
pip install -r requirements.txt

# Interactive mode (guided experience)
python prompt_craft.py -i

# Direct usage
python prompt_craft.py "write a Python function to sort a list"

# Model-specific enhancement
python prompt_craft.py -m gpt4 "explain quantum computing"
```

### Option 2: Web Interface

```bash
# Serve locally (recommended)
python -m http.server 8000

# Open in browser
open http://localhost:8000/prompt_craft.html
```

### Option 3: React Component

```bash
npm install promptcraft
```

```tsx
import PromptCraftUI from 'promptcraft';

<PromptCraftUI 
  onPromptEnhanced={(prompt, template) => console.log(prompt)}
  defaultModel="gpt4" 
/>
```

## 📖 Documentation

- **[User Guide](docs/USER_GUIDE.md)**: Complete usage instructions and examples
- **[API Documentation](docs/API.md)**: Detailed API reference and integration guide
- **[Configuration Guide](docs/CONFIGURATION.md)**: Advanced configuration options

## 🎯 Use Cases

### Code Development
```bash
# Input: "write a function"
# Output: Professional prompt with requirements for robust, documented code

python prompt_craft.py "create a REST API for user management"
```

### Creative Writing
```bash
# Input: "write a story"
# Output: Structured prompt for engaging, well-crafted narrative

python prompt_craft.py "create a sci-fi story about time travel"
```

### Educational Content
```bash
# Input: "explain AI"
# Output: Educational prompt with clear audience and teaching approach

python prompt_craft.py "explain machine learning to high school students"
```

### Business Communication
```bash
# Input: "write an email"
# Output: Professional communication template with structure and tone guidance

python prompt_craft.py "draft a project proposal email"
```

## 🛠️ Installation

### Prerequisites

- **Python 3.7+** (for CLI and core functionality)
- **Node.js 16+** (for React component)
- **Modern Browser** (for web interface)

### Step-by-Step Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/blackarched/Prompt-Kraft.git
   cd Prompt-Kraft
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Optional: Install globally:**
   ```bash
   chmod +x prompt_craft.py
   ln -s $(pwd)/prompt_craft.py /usr/local/bin/promptcraft
   ```

4. **Verify installation:**
   ```bash
   python prompt_craft.py --version
   # or if installed globally:
   promptcraft --version
   ```

### Environment Setup

1. **Copy environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Customize settings (optional):**
   ```bash
   vim .env  # Edit to match your preferences
   ```

3. **Initialize configuration:**
   ```bash
   python prompt_craft.py -i  # Creates default config
   ```

## 📚 Usage Examples

### Command Line Interface

```bash
# Interactive mode (best for beginners)
python prompt_craft.py -i

# Direct prompt enhancement
python prompt_craft.py "debug this Python error"

# Model-specific optimization
python prompt_craft.py -m claude "write safe code for handling user data"

# Quiet mode for scripting
python prompt_craft.py -q "code review checklist" | pbcopy

# Custom configuration
python prompt_craft.py --config ./my-config.json "custom prompt"

# Verbose debugging
python prompt_craft.py -v "troubleshoot this issue"
```

### Web Interface Usage

1. Open `prompt_craft.html` in your browser
2. Enter your prompt in the text area
3. Select template and target model (or use auto-detection)
4. Click the enhance button
5. Copy the enhanced prompt

### React Component Usage

```tsx
import React from 'react';
import PromptCraftUI from 'promptcraft';

function App() {
  const handlePromptEnhanced = (enhanced: string, template: string) => {
    // Send enhanced prompt to your AI model
    sendToAI(enhanced);
  };

  return (
    <div className="App">
      <h1>My AI Assistant</h1>
      <PromptCraftUI 
        onPromptEnhanced={handlePromptEnhanced}
        defaultModel="gpt4"
        theme="cyberpunk"
        showSettings={true}
        autoEnhance={false}
      />
    </div>
  );
}
```

## ⚙️ Configuration

### Default Templates

PromptCraft includes 4 built-in templates:

| Template | Icon | Use Case | Keywords |
|----------|------|----------|----------|
| **Code Generation** | 💻 | Programming, scripts, technical implementation | code, python, function, script |
| **Creative Writing** | ✍️ | Stories, poems, marketing copy, content | write, create, story, poem |
| **Detailed Explanation** | 🎓 | Education, tutorials, concept explanation | explain, what is, how does |
| **General Expert** | 🧠 | Research, analysis, professional tasks | analyze, research, study |

### Model Optimizations

| Model | Optimization Focus |
|-------|-------------------|
| **GPT-4** | Advanced reasoning, step-by-step thinking |
| **Claude** | Safety, helpfulness, ethical considerations |
| **Gemini** | Multimodal capabilities, comprehensive analysis |
| **Default** | Generic optimization for any model |

### Custom Configuration

Create custom templates and keywords:

```json
{
  "templates": {
    "research": {
      "name": "Research Assistant 🔬",
      "content": "**Role:** You are a meticulous research assistant...\n**Task:** Research: \"{user_input}\"\n{model_instructions}"
    }
  },
  "keywords": {
    "research": ["research", "study", "analyze", "investigate"]
  }
}
```

### Environment Variables

Configure behavior via environment variables:

```bash
# Application settings
PROMPTCRAFT_ENV=production
PROMPTCRAFT_DEBUG=false
PROMPTCRAFT_LOG_LEVEL=info

# Security settings
PROMPTCRAFT_MAX_INPUT_LENGTH=10000
PROMPTCRAFT_VALIDATE_INPUT=true

# Performance settings
PROMPTCRAFT_CACHE_TTL=3600
PROMPTCRAFT_REQUEST_TIMEOUT=30000
```

## 🔧 Development

### Project Structure

```
Prompt-Kraft/
├── prompt_craft.py          # Main CLI application
├── prompt_craft.html        # Web interface
├── prompt_craft_ui.tsx      # React component
├── requirements.txt         # Python dependencies
├── package.json            # Node.js dependencies
├── .env.example            # Environment template
├── docs/                   # Documentation
│   ├── API.md             # API reference
│   ├── USER_GUIDE.md      # User guide
│   └── CONFIGURATION.md   # Config guide
└── LICENSE                # Apache 2.0 license
```

### Running Tests

```bash
# Install development dependencies
pip install -r requirements.txt

# Run Python tests (when available)
pytest tests/

# Run JavaScript tests (when available)
npm test
```

### Development Setup

1. **Fork the repository**
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Test thoroughly**
5. **Submit a pull request**

### Code Quality

- **Type hints**: All Python functions include type annotations
- **Error handling**: Comprehensive exception handling throughout
- **Security**: Input validation and sanitization
- **Documentation**: Detailed docstrings and comments
- **Formatting**: Consistent code style

## 🔒 Security

PromptCraft implements several security measures:

- **Input Validation**: All user input is validated and sanitized
- **XSS Prevention**: No innerHTML usage in web interface
- **Configuration Validation**: JSON schema validation for config files
- **Environment Isolation**: Support for environment-specific configurations
- **Dependency Management**: Regular security updates for dependencies

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Ways to Contribute

- 🐛 **Bug Reports**: Report issues and bugs
- 💡 **Feature Requests**: Suggest new features
- 📖 **Documentation**: Improve docs and examples
- 🧪 **Testing**: Add test cases and improve coverage
- 🔧 **Code**: Fix bugs and implement features

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests (if applicable)
5. Update documentation
6. Submit a pull request

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **TailwindCSS**: For the beautiful styling system
- **Lucide React**: For the icon set
- **Python Community**: For the excellent ecosystem
- **AI Research Community**: For advancing the field

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/blackarched/Prompt-Kraft/issues)
- **Discussions**: [GitHub Discussions](https://github.com/blackarched/Prompt-Kraft/discussions)
- **Documentation**: [User Guide](docs/USER_GUIDE.md) and [API Docs](docs/API.md)

## 🔥 **NEW: API Server & Advanced Features**

### **REST API Server**
```bash
# Start the API server
./start_api.sh

# Or with Docker
docker-compose up -d
```

**API Endpoints:**
- `POST /enhance` - Enhance single prompt
- `POST /batch` - Batch process multiple prompts  
- `GET /analytics` - Usage analytics (requires auth)
- `POST /integrations/webhook` - Webhook integration
- `GET /health` - Health check

### **Analytics & Usage Tracking**
```bash
# View analytics summary
python analytics.py --summary

# Export analytics data
python analytics.py --export analytics_report.json

# Cleanup old data
python analytics.py --cleanup 90
```

### **Batch Processing**
```bash
# Process CSV file
python batch_processor.py --csv input.csv --output results.csv

# Process JSON file  
python batch_processor.py --json input.json --output results.json
```

### **Third-Party Integrations**
- **Slack**: Send enhanced prompts to Slack channels
- **Discord**: Post to Discord via webhooks
- **Email**: SMTP email notifications
- **Database**: Store in SQLite/PostgreSQL
- **Webhooks**: Generic HTTP webhook support

```bash
# Configure integrations
python integrations.py --status
```

## 🚀 What's Next?

- [x] **API Server**: RESTful API for integration ✅ 
- [x] **Batch Processing**: Enhanced batch operations ✅
- [x] **Analytics**: Usage analytics and optimization insights ✅
- [x] **Integrations**: Third-party service integrations ✅
- [ ] **Test Suite**: Comprehensive test coverage
- [ ] **CI/CD Pipeline**: Automated testing and deployment
- [ ] **Plugin System**: Extensible architecture for custom plugins
- [ ] **Mobile App**: Native mobile applications

---

**Made with ❤️ by the PromptCraft Team**

Transform your prompts. Enhance your AI interactions. Get better results.