# PromptCraft - Neural Prompt Enhancement System

A sophisticated web application that enhances AI prompts using template-based optimization and model-specific instructions. Features a modern React frontend with a Python FastAPI backend.

## 🚀 Features

- **Template-Based Enhancement**: Automatically detects and applies optimal prompt templates
- **Model-Specific Optimization**: Tailored instructions for GPT-4, Claude, Gemini, and more
- **Real-time API Integration**: Dynamic configuration loading and prompt processing
- **Modern UI**: Cyberpunk-themed interface with animations and visual effects
- **Auto-Enhancement**: Optional automatic prompt enhancement as you type
- **Clipboard Integration**: One-click copying of enhanced prompts
- **Error Handling**: Comprehensive error states and API connection monitoring

## 🏗️ Architecture

### Frontend (React + TypeScript + Vite)
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom animations
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Features**: Real-time API integration, loading states, error handling

### Backend (Python + FastAPI)
- **Framework**: FastAPI with async support
- **Features**: RESTful API, CORS support, configuration management
- **Endpoints**: 
  - `GET /` - Health check
  - `GET /api/config` - Get complete configuration
  - `GET /api/templates` - Get available templates
  - `GET /api/models` - Get available AI models
  - `POST /api/enhance` - Enhance a prompt
  - `POST /api/detect-template` - Auto-detect best template

## 📦 Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# Start the API server
python api_server.py
```
The API will be available at `http://localhost:8000`

### Frontend Setup
```bash
# Install Node.js dependencies
npm install

# Start the development server
npm run dev
```
The frontend will be available at `http://localhost:3000`

### Quick Start (Both Frontend & Backend)
```bash
# Install all dependencies
pip install -r requirements.txt
npm install

# Start both servers concurrently
npm start
```

## 🔧 Configuration

The system uses a JSON configuration file located at `~/.config/promptcraft/config.json`. If it doesn't exist, a default configuration will be created automatically.

### Configuration Structure
```json
{
  "templates": {
    "code": {
      "name": "Code Generation 💻",
      "content": "Template content with {user_input} and {model_instructions} placeholders"
    },
    "creative": { ... },
    "explain": { ... },
    "general": { ... }
  },
  "model_instructions": {
    "default": "Default instructions",
    "gpt4": "GPT-4 specific instructions",
    "claude": "Claude specific instructions",
    "gemini": "Gemini specific instructions"
  },
  "keywords": {
    "code": ["code", "python", "javascript", ...],
    "creative": ["write", "create", "poem", ...],
    "explain": ["explain", "what is", "how does", ...]
  }
}
```

## 🎯 Usage

### Web Interface
1. Open `http://localhost:3000` in your browser
2. Enter your basic prompt in the input field
3. Select a template (or let the system auto-detect)
4. Choose your target AI model
5. Click "Craft Prompt" to enhance your prompt
6. Copy the enhanced prompt to your clipboard

### API Usage
```bash
# Enhance a prompt
curl -X POST "http://localhost:8000/api/enhance" \
  -H "Content-Type: application/json" \
  -d '{
    "user_input": "Create a login function",
    "template": "code",
    "model": "gpt4"
  }'

# Get available templates
curl "http://localhost:8000/api/templates"

# Health check
curl "http://localhost:8000/"
```

### CLI Usage (Legacy)
```bash
# Interactive mode
python prompt_craft.py -i

# Direct enhancement
python prompt_craft.py "Create a login function" -m gpt4

# Quiet mode (clipboard only)
python prompt_craft.py "Explain quantum computing" -q
```

## 🔍 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/api/config` | Get complete configuration |
| GET | `/api/templates` | Get available templates |
| GET | `/api/models` | Get available AI models |
| POST | `/api/enhance` | Enhance a prompt |
| POST | `/api/detect-template` | Auto-detect best template |

## 🎨 UI Features

- **Loading States**: Smooth loading animations during API calls
- **Error Handling**: Clear error messages with retry options
- **API Status**: Real-time connection status indicator
- **Responsive Design**: Works on desktop and mobile devices
- **Accessibility**: Keyboard navigation and screen reader support
- **Visual Effects**: Cyberpunk-themed animations and transitions

## 🚧 Development

### Project Structure
```
promptcraft/
├── api_server.py          # FastAPI backend server
├── prompt_craft.py        # Legacy CLI tool
├── prompt_craft_ui.tsx    # Main React component
├── src/
│   ├── main.tsx          # React app entry point
│   └── index.css         # Global styles
├── requirements.txt       # Python dependencies
├── package.json          # Node.js dependencies
├── vite.config.ts        # Vite configuration
├── tailwind.config.js    # Tailwind CSS configuration
└── README.md             # This file
```

### Development Commands
```bash
# Backend development
python api_server.py

# Frontend development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔧 Environment Variables

- `REACT_APP_API_URL`: Backend API URL (default: `http://localhost:8000`)

## 📝 License

Apache License 2.0 - See [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 🐛 Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Ensure the backend server is running on port 8000
   - Check firewall settings
   - Verify CORS configuration

2. **Configuration Not Loading**
   - Check file permissions for `~/.config/promptcraft/`
   - Verify JSON syntax in config file
   - Delete config file to regenerate defaults

3. **Frontend Build Issues**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check Node.js version compatibility
   - Verify all dependencies are installed

4. **Python Dependencies**
   - Use virtual environment: `python -m venv venv && source venv/bin/activate`
   - Upgrade pip: `pip install --upgrade pip`
   - Install dependencies: `pip install -r requirements.txt`

## 📊 Performance

- **Backend**: FastAPI with async support for high concurrency
- **Frontend**: Vite for fast development and optimized builds
- **Caching**: Configuration caching for improved API response times
- **Bundle Size**: Optimized with tree-shaking and code splitting

## 🔮 Future Enhancements

- [ ] User authentication and personalized templates
- [ ] Template marketplace and sharing
- [ ] Advanced prompt analytics and optimization
- [ ] Integration with popular AI platforms
- [ ] Mobile app version
- [ ] Collaborative prompt editing
- [ ] A/B testing for prompt effectiveness