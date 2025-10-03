# PromptCraft Configuration Guide

## Overview

PromptCraft is highly configurable to meet different use cases and preferences. This guide covers all configuration options, from basic settings to advanced customization.

## Configuration Files

### Primary Configuration

**Location**: `~/.config/promptcraft/config.json`

This file contains templates, model instructions, and keyword mappings:

```json
{
  "templates": {
    "template_id": {
      "name": "Display Name",
      "content": "Template content with {placeholders}"
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

### Environment Configuration

**Files**: `.env`, `.env.development`, `.env.production`

Environment variables control application behavior:

```bash
# Application Settings
PROMPTCRAFT_ENV=development
PROMPTCRAFT_DEBUG=true
PROMPTCRAFT_LOG_LEVEL=info

# File Paths
PROMPTCRAFT_CONFIG_DIR=~/.config/promptcraft
PROMPTCRAFT_CONFIG_FILE=config.json

# Security Settings
PROMPTCRAFT_VALIDATE_INPUT=true
PROMPTCRAFT_MAX_INPUT_LENGTH=10000
```

## Templates Configuration

### Template Structure

Each template consists of:

- **name**: Display name shown to users
- **content**: Template text with placeholders
- **Associated keywords**: For auto-detection

```json
{
  "templates": {
    "custom_template": {
      "name": "Custom Template 🎯",
      "content": "**Role:** You are a {role}.\n**Task:** {task_description}\n\n**Context:** {user_input}\n\n**Requirements:**\n- Requirement 1\n- Requirement 2\n{model_instructions}"
    }
  }
}
```

### Available Placeholders

| Placeholder | Description | Required |
|------------|-------------|----------|
| `{user_input}` | Original user prompt | Yes |
| `{model_instructions}` | Model-specific optimizations | Recommended |

### Template Best Practices

1. **Clear Structure**: Use consistent formatting with headers
2. **Specific Roles**: Define clear roles for the AI
3. **Explicit Requirements**: List specific requirements and constraints
4. **Flexible Content**: Make templates adaptable to different inputs

### Example Templates

#### Research Template
```json
{
  "research": {
    "name": "Research Assistant 🔬",
    "content": "**Role:** You are a thorough research assistant with expertise in academic methodology.\n**Task:** Conduct comprehensive research on: \"{user_input}\"\n\n**Research Requirements:**\n- Use credible, peer-reviewed sources\n- Provide citations and references\n- Present findings in a structured format\n- Include multiple perspectives\n- Highlight key insights and conclusions\n\n**Output Format:**\n- Executive summary\n- Detailed findings\n- Source citations\n- Recommendations\n{model_instructions}"
  }
}
```

#### Marketing Template
```json
{
  "marketing": {
    "name": "Marketing Specialist 📢",
    "content": "**Role:** You are a professional marketing specialist with expertise in persuasive communication.\n**Task:** Create compelling marketing content for: \"{user_input}\"\n\n**Marketing Objectives:**\n- Identify target audience\n- Highlight unique value proposition\n- Create emotional connection\n- Include clear call-to-action\n- Optimize for conversion\n\n**Deliverables:**\n- Audience analysis\n- Key messaging\n- Content variations\n- Performance metrics\n{model_instructions}"
  }
}
```

## Model Instructions

### Purpose

Model instructions tailor prompts for specific AI models, leveraging their unique capabilities and addressing their characteristics.

### Built-in Models

```json
{
  "model_instructions": {
    "default": "**Output Format:** Provide a clear, well-formatted response using markdown where appropriate.",
    "gpt4": "**For GPT-4:** Leverage your advanced reasoning capabilities and multi-step analytical processes. Use chain-of-thought reasoning when appropriate.",
    "claude": "**For Claude:** Utilize your nuanced understanding and contextual awareness to provide helpful, precise responses. Prioritize safety and helpfulness.",
    "gemini": "**For Gemini:** Apply your multimodal reasoning and comprehensive analytical capabilities. Consider visual and contextual elements when relevant."
  }
}
```

### Custom Model Instructions

Add instructions for custom or new models:

```json
{
  "model_instructions": {
    "custom_model": "**For Custom Model:** Specific instructions for optimal performance with this model.",
    "local_llm": "**For Local LLM:** Consider computational constraints and optimize for efficiency.",
    "specialized_ai": "**For Specialized AI:** Focus on domain-specific expertise and accuracy."
  }
}
```

### Model Instruction Guidelines

1. **Leverage Strengths**: Highlight model-specific capabilities
2. **Address Limitations**: Provide guidance for known weaknesses
3. **Format Preferences**: Specify preferred output formats
4. **Safety Considerations**: Include safety guidelines when relevant

## Keywords Configuration

### Purpose

Keywords enable automatic template detection based on user input analysis.

### Keyword Structure

```json
{
  "keywords": {
    "template_id": [
      "primary_keyword",
      "secondary_keyword",
      "phrase with spaces",
      "variant_spelling"
    ]
  }
}
```

### Keyword Selection Strategy

1. **Primary Terms**: Core words that directly relate to the template
2. **Synonyms**: Alternative words with similar meaning
3. **Phrases**: Multi-word expressions
4. **Common Misspellings**: Account for user typos
5. **Domain Terms**: Specialized vocabulary

### Example Keyword Configurations

```json
{
  "keywords": {
    "code": [
      "code", "programming", "script", "function", "algorithm",
      "debug", "refactor", "optimize", "implement", "develop",
      "python", "javascript", "java", "c++", "sql",
      "api", "database", "frontend", "backend", "fullstack"
    ],
    "creative": [
      "write", "create", "compose", "craft", "author",
      "story", "poem", "article", "essay", "blog",
      "narrative", "fiction", "creative", "literary",
      "content", "copy", "marketing", "advertisement"
    ],
    "research": [
      "research", "study", "analyze", "investigate", "examine",
      "survey", "review", "assess", "evaluate", "compare",
      "academic", "scholarly", "scientific", "empirical",
      "data", "statistics", "findings", "methodology"
    ]
  }
}
```

## Environment Variables

### Application Configuration

| Variable | Description | Default | Options |
|----------|-------------|---------|---------|
| `PROMPTCRAFT_ENV` | Environment mode | `development` | `development`, `production` |
| `PROMPTCRAFT_DEBUG` | Enable debug mode | `false` | `true`, `false` |
| `PROMPTCRAFT_LOG_LEVEL` | Logging verbosity | `info` | `debug`, `info`, `warn`, `error` |

### File Path Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `PROMPTCRAFT_CONFIG_DIR` | Configuration directory | `~/.config/promptcraft` |
| `PROMPTCRAFT_CONFIG_FILE` | Configuration file name | `config.json` |

### Security Configuration

| Variable | Description | Default | Range |
|----------|-------------|---------|-------|
| `PROMPTCRAFT_VALIDATE_INPUT` | Enable input validation | `true` | `true`, `false` |
| `PROMPTCRAFT_SANITIZE_OUTPUT` | Enable output sanitization | `true` | `true`, `false` |
| `PROMPTCRAFT_MAX_INPUT_LENGTH` | Maximum input characters | `10000` | `1-50000` |

### Performance Configuration

| Variable | Description | Default | Range |
|----------|-------------|---------|-------|
| `PROMPTCRAFT_CACHE_TTL` | Cache time-to-live (seconds) | `3600` | `60-86400` |
| `PROMPTCRAFT_REQUEST_TIMEOUT` | Request timeout (milliseconds) | `30000` | `1000-300000` |
| `PROMPTCRAFT_MAX_RETRIES` | Maximum retry attempts | `3` | `0-10` |

### Feature Flags

| Variable | Description | Default |
|----------|-------------|---------|
| `PROMPTCRAFT_ENABLE_ANALYTICS` | Enable usage analytics | `false` |
| `PROMPTCRAFT_ENABLE_TELEMETRY` | Enable telemetry data | `false` |
| `PROMPTCRAFT_ENABLE_CACHE` | Enable response caching | `true` |

## Advanced Configuration

### Multi-Environment Setup

#### Development Environment
```bash
# .env.development
PROMPTCRAFT_ENV=development
PROMPTCRAFT_DEBUG=true
PROMPTCRAFT_LOG_LEVEL=debug
PROMPTCRAFT_MAX_INPUT_LENGTH=15000
PROMPTCRAFT_VALIDATE_INPUT=true
PROMPTCRAFT_CONFIG_DIR=./config-dev
```

#### Production Environment
```bash
# .env.production
PROMPTCRAFT_ENV=production
PROMPTCRAFT_DEBUG=false
PROMPTCRAFT_LOG_LEVEL=warn
PROMPTCRAFT_MAX_INPUT_LENGTH=5000
PROMPTCRAFT_VALIDATE_INPUT=true
PROMPTCRAFT_CONFIG_DIR=/etc/promptcraft
```

### Custom Configuration Locations

#### Per-User Configuration
```bash
# Use custom config directory
export PROMPTCRAFT_CONFIG_DIR="$HOME/.promptcraft"
export PROMPTCRAFT_CONFIG_FILE="my-config.json"
```

#### Project-Specific Configuration
```bash
# Project directory configuration
export PROMPTCRAFT_CONFIG_DIR="./config"
export PROMPTCRAFT_CONFIG_FILE="project-config.json"
```

### Configuration Validation

PromptCraft validates configurations using JSON Schema:

```json
{
  "type": "object",
  "properties": {
    "templates": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "properties": {
          "name": {"type": "string", "minLength": 1},
          "content": {"type": "string", "minLength": 10}
        },
        "required": ["name", "content"]
      }
    }
  },
  "required": ["templates", "model_instructions", "keywords"]
}
```

### Backup and Migration

#### Configuration Backup
```bash
# Backup current configuration
cp ~/.config/promptcraft/config.json ~/.config/promptcraft/config.backup.$(date +%Y%m%d)

# Restore from backup
cp ~/.config/promptcraft/config.backup.20241201 ~/.config/promptcraft/config.json
```

#### Configuration Migration
```python
#!/usr/bin/env python3
import json
import shutil
from pathlib import Path

def migrate_config(old_path, new_path):
    """Migrate configuration to new format."""
    with open(old_path) as f:
        old_config = json.load(f)
    
    # Apply migrations
    new_config = migrate_templates(old_config)
    new_config = migrate_keywords(new_config)
    
    # Backup old config
    shutil.copy(old_path, f"{old_path}.backup")
    
    # Save new config
    with open(new_path, 'w') as f:
        json.dump(new_config, f, indent=2)
```

## Troubleshooting Configuration

### Common Issues

#### Configuration Not Found
```bash
# Check if file exists
ls -la ~/.config/promptcraft/config.json

# Create default if missing
python prompt_craft.py -i
```

#### Invalid JSON Syntax
```bash
# Validate JSON syntax
python -m json.tool ~/.config/promptcraft/config.json

# Fix common issues
# - Missing commas
# - Trailing commas
# - Unescaped quotes
```

#### Permission Issues
```bash
# Check permissions
ls -la ~/.config/promptcraft/

# Fix permissions
chmod 755 ~/.config/promptcraft/
chmod 644 ~/.config/promptcraft/config.json
```

### Debugging Configuration

#### Enable Debug Mode
```bash
export PROMPTCRAFT_DEBUG=true
export PROMPTCRAFT_LOG_LEVEL=debug
python prompt_craft.py -v "test prompt"
```

#### Validate Configuration
```python
from prompt_craft import load_config, validate_config

try:
    config = load_config()
    validate_config(config)
    print("Configuration is valid")
except Exception as e:
    print(f"Configuration error: {e}")
```

## Configuration Examples

### Minimal Configuration
```json
{
  "templates": {
    "simple": {
      "name": "Simple Template",
      "content": "Please help with: {user_input}\n{model_instructions}"
    }
  },
  "model_instructions": {
    "default": "Provide a helpful response."
  },
  "keywords": {
    "simple": ["help", "assist"]
  }
}
```

### Advanced Configuration
```json
{
  "templates": {
    "code_review": {
      "name": "Code Review Specialist 👁️",
      "content": "**Role:** You are a senior software engineer conducting a thorough code review.\n**Task:** Review the following code: \"{user_input}\"\n\n**Review Criteria:**\n- Code quality and readability\n- Performance considerations\n- Security vulnerabilities\n- Best practices adherence\n- Documentation completeness\n\n**Output Format:**\n- Overall assessment\n- Specific issues with line references\n- Improvement suggestions\n- Security considerations\n- Performance recommendations\n{model_instructions}"
    },
    "technical_writing": {
      "name": "Technical Writer 📝",
      "content": "**Role:** You are an experienced technical writer specializing in clear, comprehensive documentation.\n**Task:** Create technical documentation for: \"{user_input}\"\n\n**Documentation Standards:**\n- Clear, concise language\n- Logical structure and flow\n- Appropriate technical depth\n- Practical examples\n- User-focused approach\n\n**Deliverables:**\n- Introduction and overview\n- Detailed explanations\n- Code examples (if applicable)\n- Troubleshooting guide\n- References and resources\n{model_instructions}"
    }
  },
  "model_instructions": {
    "default": "**Output Format:** Provide a comprehensive, well-structured response with clear headings and bullet points.",
    "gpt4": "**For GPT-4:** Use your advanced reasoning to provide detailed analysis with step-by-step explanations.",
    "claude": "**For Claude:** Focus on accuracy, safety, and helpful guidance while maintaining professional tone.",
    "codex": "**For Codex:** Emphasize code quality, best practices, and include working examples with explanations."
  },
  "keywords": {
    "code_review": [
      "review", "audit", "inspect", "analyze code",
      "code quality", "security review", "performance review",
      "refactor", "optimize", "improve code"
    ],
    "technical_writing": [
      "document", "documentation", "guide", "manual",
      "tutorial", "how-to", "instructions", "readme",
      "specification", "technical spec", "api docs"
    ]
  }
}
```

This configuration guide provides comprehensive coverage of all PromptCraft configuration options. Use it to customize the tool for your specific needs and workflows.