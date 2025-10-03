# PromptCraft API Documentation

## Overview

PromptCraft provides multiple interfaces for AI prompt enhancement:
- **Python CLI**: Command-line interface for automation and scripting
- **Web Interface**: Browser-based UI for interactive use
- **React Component**: Embeddable UI component for web applications

## Python CLI API

### Command Line Interface

```bash
promptcraft [OPTIONS] [PROMPT...]
```

#### Arguments

- `PROMPT`: The prompt text to enhance (optional if using interactive mode)

#### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--interactive` | `-i` | Enable interactive mode | `false` |
| `--model` | `-m` | Target AI model (gpt4, claude, gemini, default) | `default` |
| `--quiet` | `-q` | Quiet mode with minimal output | `false` |
| `--verbose` | `-v` | Verbose output for debugging | `false` |
| `--config` | | Path to custom configuration file | `~/.config/promptcraft/config.json` |
| `--version` | | Show version information | |
| `--help` | `-h` | Show help message | |

#### Examples

```bash
# Interactive mode
promptcraft -i

# Direct prompt enhancement
promptcraft "write a Python function to sort a list"

# Model-specific enhancement
promptcraft -m gpt4 "explain quantum computing"

# Quiet mode (useful for scripts)
promptcraft -q "code review checklist" | pbcopy

# Custom configuration
promptcraft --config ./my-config.json "creative writing prompt"

# Verbose debugging
promptcraft -v -m claude "debug this error"
```

### Python Module API

```python
from prompt_craft import enhance_prompt, load_config

# Load configuration
config = load_config()

# Enhance a prompt
enhanced, template_name = enhance_prompt(
    config=config,
    user_input="write a REST API",
    model="gpt4"
)

print(f"Template: {template_name}")
print(f"Enhanced: {enhanced}")
```

#### Functions

##### `load_config(config_path: Optional[str] = None) -> Dict[str, Any]`

Load and validate configuration from JSON file.

**Parameters:**
- `config_path` (optional): Path to configuration file

**Returns:**
- `Dict[str, Any]`: Validated configuration dictionary

**Raises:**
- `ConfigurationError`: If configuration is invalid or cannot be loaded

##### `enhance_prompt(config: Dict[str, Any], user_input: str, model: str) -> Tuple[str, str]`

Enhance a prompt using intelligent template selection.

**Parameters:**
- `config`: Validated configuration dictionary
- `user_input`: Raw user prompt
- `model`: Target AI model identifier

**Returns:**
- `Tuple[str, str]`: Enhanced prompt and template name

**Raises:**
- `ValidationError`: If input validation fails
- `ConfigurationError`: If template/model not found

##### `validate_input(user_input: str) -> str`

Validate and sanitize user input.

**Parameters:**
- `user_input`: Raw user input

**Returns:**
- `str`: Sanitized input string

**Raises:**
- `ValidationError`: If input is invalid

## Configuration API

### Configuration File Structure

```json
{
  "templates": {
    "template_id": {
      "name": "Template Display Name",
      "content": "Template content with {user_input} and {model_instructions} placeholders"
    }
  },
  "model_instructions": {
    "model_id": "Model-specific instructions"
  },
  "keywords": {
    "template_id": ["keyword1", "keyword2"]
  }
}
```

### Template Variables

Templates support the following placeholders:

- `{user_input}`: User's original prompt
- `{model_instructions}`: Model-specific enhancement instructions

### Built-in Templates

| Template ID | Name | Use Case |
|-------------|------|----------|
| `code` | Code Generation 💻 | Programming and development tasks |
| `creative` | Creative Writing ✍️ | Creative content and storytelling |
| `explain` | Detailed Explanation 🎓 | Educational and explanatory content |
| `general` | General Expert 🧠 | General-purpose prompt enhancement |

### Built-in Models

| Model ID | Description |
|----------|-------------|
| `default` | Generic optimization for all models |
| `gpt4` | Optimized for GPT-4 reasoning capabilities |
| `claude` | Optimized for Claude's safety and helpfulness |
| `gemini` | Optimized for Gemini's multimodal capabilities |

## Environment Variables

Configure PromptCraft behavior using environment variables:

### Application Settings
- `PROMPTCRAFT_ENV`: Environment (development, production)
- `PROMPTCRAFT_DEBUG`: Enable debug mode (true/false)
- `PROMPTCRAFT_LOG_LEVEL`: Logging level (debug, info, warn, error)

### File Paths
- `PROMPTCRAFT_CONFIG_DIR`: Configuration directory path
- `PROMPTCRAFT_CONFIG_FILE`: Configuration file name

### Security Settings
- `PROMPTCRAFT_VALIDATE_INPUT`: Enable input validation (true/false)
- `PROMPTCRAFT_SANITIZE_OUTPUT`: Enable output sanitization (true/false)
- `PROMPTCRAFT_MAX_INPUT_LENGTH`: Maximum input length (default: 10000)

### Performance Settings
- `PROMPTCRAFT_CACHE_TTL`: Cache time-to-live in seconds
- `PROMPTCRAFT_REQUEST_TIMEOUT`: Request timeout in milliseconds
- `PROMPTCRAFT_MAX_RETRIES`: Maximum retry attempts

## Web Interface API

### HTML Integration

```html
<!DOCTYPE html>
<html>
<head>
    <title>My App with PromptCraft</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
    <!-- Include the PromptCraft HTML file -->
    <iframe src="prompt_craft.html" width="100%" height="600"></iframe>
</body>
</html>
```

### JavaScript Events

The web interface dispatches custom events:

```javascript
// Listen for prompt enhancement events
window.addEventListener('promptcraft:enhanced', (event) => {
    const { prompt, template, model } = event.detail;
    console.log('Enhanced prompt:', prompt);
});

// Listen for template selection events
window.addEventListener('promptcraft:template-changed', (event) => {
    const { templateId, templateName } = event.detail;
    console.log('Template changed:', templateName);
});
```

## React Component API

### Installation

```bash
npm install promptcraft
```

### Basic Usage

```tsx
import React from 'react';
import PromptCraftUI from 'promptcraft';

function App() {
  const handlePromptEnhanced = (enhancedPrompt: string, templateName: string) => {
    console.log('Enhanced:', enhancedPrompt);
    console.log('Template:', templateName);
  };

  return (
    <div className="App">
      <PromptCraftUI 
        onPromptEnhanced={handlePromptEnhanced}
        defaultModel="gpt4"
        theme="cyberpunk"
      />
    </div>
  );
}
```

### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `onPromptEnhanced` | `(prompt: string, template: string) => void` | Callback when prompt is enhanced | |
| `onTemplateChanged` | `(templateId: string) => void` | Callback when template changes | |
| `defaultModel` | `string` | Default AI model selection | `"default"` |
| `defaultTemplate` | `string` | Default template selection | `"general"` |
| `theme` | `"cyberpunk" \| "minimal" \| "dark"` | UI theme | `"cyberpunk"` |
| `showSettings` | `boolean` | Show settings panel | `true` |
| `autoEnhance` | `boolean` | Enable auto-enhancement | `false` |
| `maxInputLength` | `number` | Maximum input length | `10000` |

### Styling

The React component uses Tailwind CSS classes and can be customized:

```css
/* Override default styles */
.promptcraft-container {
  --primary-color: #00ffff;
  --secondary-color: #ff00ff;
  --background-color: #000000;
}
```

## Error Handling

### Exception Hierarchy

```
PromptCraftError
├── ConfigurationError
│   ├── Invalid configuration format
│   ├── Missing required fields
│   └── File access errors
└── ValidationError
    ├── Empty input
    ├── Input too long
    └── Invalid characters
```

### Error Response Format

```python
try:
    enhanced, template = enhance_prompt(config, user_input, model)
except ValidationError as e:
    print(f"Input validation failed: {e}")
except ConfigurationError as e:
    print(f"Configuration error: {e}")
except PromptCraftError as e:
    print(f"PromptCraft error: {e}")
```

## Rate Limiting and Best Practices

### Performance Optimization

1. **Cache Configuration**: Load configuration once and reuse
2. **Batch Processing**: Process multiple prompts in sequence
3. **Input Validation**: Always validate input before processing
4. **Error Handling**: Implement proper exception handling

### Security Best Practices

1. **Input Sanitization**: Always sanitize user input
2. **Configuration Validation**: Validate configuration files
3. **Environment Variables**: Use environment variables for sensitive settings
4. **Regular Updates**: Keep dependencies updated

### Usage Examples

#### Batch Processing

```python
import asyncio
from prompt_craft import enhance_prompt, load_config

async def batch_enhance(prompts, model="default"):
    config = load_config()
    results = []
    
    for prompt in prompts:
        try:
            enhanced, template = enhance_prompt(config, prompt, model)
            results.append({
                'original': prompt,
                'enhanced': enhanced,
                'template': template,
                'status': 'success'
            })
        except Exception as e:
            results.append({
                'original': prompt,
                'error': str(e),
                'status': 'error'
            })
    
    return results

# Usage
prompts = [
    "write a function",
    "explain AI",
    "create a story"
]
results = await batch_enhance(prompts, "gpt4")
```

#### Custom Template

```python
from prompt_craft import load_config, create_default_config

# Load existing config
config = load_config()

# Add custom template
config['templates']['research'] = {
    'name': 'Research Assistant 🔬',
    'content': '''**Role:** You are a meticulous research assistant.
**Task:** Research and analyze: "{user_input}"

**Instructions:**
- Provide comprehensive analysis
- Include credible sources
- Present findings clearly
{model_instructions}'''
}

# Add keywords for auto-detection
config['keywords']['research'] = ['research', 'analyze', 'study', 'investigate']

# Save updated config
with open('custom_config.json', 'w') as f:
    json.dump(config, f, indent=4)
```

## REST API Server

### Starting the API Server

```bash
# Using the startup script
./start_api.sh

# Direct execution
python api_server.py

# With Docker
docker-compose up -d promptcraft-api
```

### API Endpoints

#### POST /enhance
Enhance a single prompt.

**Request Body:**
```json
{
  "prompt": "write a Python function",
  "model": "gpt4",
  "template": "code",
  "user_id": "user123"
}
```

**Response:**
```json
{
  "enhanced_prompt": "**Role:** You are a senior software engineer...",
  "template_used": "Code Generation 💻",
  "model": "gpt4",
  "processing_time_ms": 45.2,
  "request_id": "req_1234567890",
  "timestamp": "2024-12-01T10:30:00Z"
}
```

#### POST /batch
Process multiple prompts in batch.

**Request Body:**
```json
{
  "prompts": [
    "write a function",
    "explain AI",
    "create a story"
  ],
  "model": "default",
  "user_id": "user123"
}
```

**Response:**
```json
{
  "results": [...],
  "total_processed": 3,
  "successful": 3,
  "failed": 0,
  "batch_id": "batch_1234567890",
  "processing_time_ms": 156.7
}
```

#### GET /analytics
Get usage analytics (requires authentication).

**Headers:**
```
Authorization: Bearer your-api-key
```

**Response:**
```json
{
  "total_requests": 1250,
  "requests_today": 45,
  "popular_templates": {
    "Code Generation": 450,
    "Creative Writing": 320
  },
  "popular_models": {
    "gpt4": 600,
    "default": 400
  },
  "average_processing_time": 67.3,
  "error_rate": 2.1
}
```

#### GET /templates
Get available templates.

**Response:**
```json
{
  "templates": {
    "code": {
      "name": "Code Generation 💻",
      "description": "Template for code generation"
    }
  }
}
```

#### GET /models
Get available models.

**Response:**
```json
{
  "models": ["default", "gpt4", "claude", "gemini"]
}
```

#### POST /integrations/webhook
Webhook endpoint for integrations.

**Request Body:**
```json
{
  "prompt": "your prompt here",
  "model": "gpt4"
}
```

**Response:**
```json
{
  "status": "success",
  "enhanced_prompt": "enhanced prompt text",
  "template_used": "General Expert 🧠"
}
```

#### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "version": "3.0.1",
  "uptime_seconds": 3600.5,
  "requests_processed": 1250
}
```

### Authentication

Set the API key in environment variables:
```bash
export PROMPTCRAFT_API_KEY=your-secret-key
```

Include in requests:
```bash
curl -H "Authorization: Bearer your-secret-key" \
     http://localhost:8080/analytics
```

### Rate Limiting

The API implements basic rate limiting:
- 100 requests per minute per IP
- 1000 requests per hour per API key
- Batch requests count as number of items processed

## Analytics System

### CLI Usage

```bash
# View summary
python analytics.py --summary

# Detailed analytics for 30 days
python analytics.py --detailed 30

# Export to file
python analytics.py --export report.json

# Cleanup old data (keep 90 days)
python analytics.py --cleanup 90
```

### Programmatic Usage

```python
from analytics import AnalyticsTracker

# Initialize tracker
analytics = AnalyticsTracker()

# Track a request
analytics.track_request(
    user_id="user123",
    template="code",
    model="gpt4",
    processing_time=45.2,
    success=True
)

# Get analytics summary
summary = analytics.get_analytics_summary()
print(summary)
```

## Batch Processing

### CLI Usage

```bash
# Process CSV file
python batch_processor.py \
  --csv input.csv \
  --output results.csv \
  --prompt-column "prompt_text" \
  --model-column "target_model"

# Process JSON file
python batch_processor.py \
  --json input.json \
  --output results.json \
  --batch-size 50
```

### API Usage

```python
import asyncio
from batch_processor import BatchProcessor, BatchItem
from prompt_craft import load_config

async def main():
    config = load_config()
    processor = BatchProcessor(config)
    
    # Create batch items
    items = [
        BatchItem(id="1", prompt="write a function", model="gpt4"),
        BatchItem(id="2", prompt="explain AI", model="claude")
    ]
    
    # Process batch
    results = await processor.process_batch(
        [item.prompt for item in items],
        model="default"
    )
    
    for result in results:
        print(f"Success: {result.success}")
        if result.success:
            print(f"Enhanced: {result.enhanced_prompt}")

asyncio.run(main())
```

### File Formats

**CSV Input:**
```csv
prompt,model
"write a Python function",gpt4
"explain machine learning",claude
"create a story",default
```

**JSON Input:**
```json
[
  {
    "prompt": "write a Python function",
    "model": "gpt4"
  },
  {
    "prompt": "explain machine learning",
    "model": "claude"
  }
]
```

## Integrations

### Configuration

Create `~/.config/promptcraft/integrations.json`:

```json
{
  "integrations": {
    "slack": {
      "enabled": true,
      "settings": {
        "webhook_url": "https://hooks.slack.com/services/...",
        "channel": "#ai-prompts"
      }
    },
    "discord": {
      "enabled": true,
      "settings": {
        "webhook_url": "https://discord.com/api/webhooks/..."
      }
    },
    "email": {
      "enabled": false,
      "settings": {
        "smtp_server": "smtp.gmail.com",
        "smtp_port": 587,
        "username": "your-email@gmail.com",
        "password": "your-app-password",
        "from_email": "your-email@gmail.com",
        "to_emails": ["recipient@example.com"]
      }
    },
    "database": {
      "enabled": true,
      "settings": {
        "db_type": "sqlite",
        "connection_string": "enhanced_prompts.db",
        "table_name": "enhanced_prompts"
      }
    }
  }
}
```

### Usage

```python
from integrations import send_to_integrations

# Send to all enabled integrations
results = await send_to_integrations(
    enhanced_prompt="Enhanced prompt text",
    original_prompt="Original prompt",
    template="Code Generation",
    model="gpt4",
    metadata={"user_id": "user123"}
)

# Send to specific integrations
results = await send_to_integrations(
    enhanced_prompt="Enhanced prompt text",
    original_prompt="Original prompt",
    template="Code Generation",
    model="gpt4",
    integration_names=["slack", "discord"]
)
```

### CLI Management

```bash
# List enabled integrations
python integrations.py --list

# Show integration status
python integrations.py --status

# Show config file location
python integrations.py --config
```

## Troubleshooting

### Common Issues

1. **Configuration Not Found**
   ```bash
   Error: Config file not found
   Solution: Run `promptcraft -i` to create default config
   ```

2. **API Server Won't Start**
   ```bash
   Error: Port 8080 already in use
   Solution: Set PROMPTCRAFT_API_PORT=8081 or kill process on port 8080
   ```

3. **Database Connection Error**
   ```bash
   Error: Unable to connect to database
   Solution: Check database settings in integrations.json
   ```

4. **Missing Dependencies**
   ```bash
   Error: fastapi not found
   Solution: pip install -r requirements.txt
   ```

5. **Integration Failures**
   ```bash
   Error: Slack webhook failed
   Solution: Verify webhook URL and network connectivity
   ```

### Debug Mode

Enable verbose logging for troubleshooting:

```bash
# CLI
promptcraft -v "your prompt"

# API Server
export PROMPTCRAFT_DEBUG=true
export PROMPTCRAFT_LOG_LEVEL=debug
./start_api.sh

# Analytics
python analytics.py --summary --verbose
```

### Performance Tuning

```bash
# Increase batch processing workers
export PROMPTCRAFT_MAX_WORKERS=16

# Increase concurrent batches
export PROMPTCRAFT_MAX_CONCURRENT_BATCHES=10

# Adjust request timeout
export PROMPTCRAFT_REQUEST_TIMEOUT=60000
```

### Support

For additional support and examples, visit:
- GitHub Repository: https://github.com/blackarched/Prompt-Kraft
- Documentation: https://promptcraft.docs
- Issues: https://github.com/blackarched/Prompt-Kraft/issues