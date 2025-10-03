# PromptCraft User Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Installation](#installation)
3. [Basic Usage](#basic-usage)
4. [Advanced Features](#advanced-features)
5. [Configuration](#configuration)
6. [Tips and Best Practices](#tips-and-best-practices)
7. [Troubleshooting](#troubleshooting)

## Getting Started

PromptCraft is a powerful tool that automatically enhances your AI prompts using intelligent template selection and model-specific optimizations. Whether you're writing code, creating content, or asking for explanations, PromptCraft helps you get better results from AI models.

### What PromptCraft Does

- 🎯 **Intelligent Template Selection**: Automatically chooses the best prompt template based on your input
- 🤖 **Model Optimization**: Tailors prompts for specific AI models (GPT-4, Claude, Gemini)
- 📋 **Professional Formatting**: Structures prompts with clear roles, tasks, and requirements
- ⚡ **Multiple Interfaces**: CLI, web browser, and React component options
- 🔧 **Customizable**: Configure templates and keywords to match your needs

## Installation

### Prerequisites

- **Python**: 3.7 or higher
- **Node.js**: 16 or higher (for React component)
- **Modern Browser**: Chrome, Firefox, Safari, or Edge (for web interface)

### Python CLI Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/blackarched/Prompt-Kraft.git
   cd Prompt-Kraft
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Make executable (optional):**
   ```bash
   chmod +x prompt_craft.py
   ln -s $(pwd)/prompt_craft.py /usr/local/bin/promptcraft
   ```

4. **Verify installation:**
   ```bash
   python prompt_craft.py --version
   ```

### Web Interface Setup

1. **Open in browser:**
   ```bash
   # Serve locally (recommended)
   python -m http.server 8000
   # Then open http://localhost:8000/prompt_craft.html
   ```

2. **Or open directly:**
   ```bash
   open prompt_craft.html
   # or double-click the file
   ```

### React Component Installation

```bash
npm install promptcraft
# or
yarn add promptcraft
```

## Basic Usage

### Command Line Interface (CLI)

#### Interactive Mode (Recommended for Beginners)

```bash
python prompt_craft.py -i
```

This launches an interactive session that guides you through:
1. Template selection (or auto-detection)
2. Entering your prompt
3. Choosing target AI model

**Example Session:**
```
🚀 Welcome to PromptCraft Interactive Mode!
==================================================

1. Select a template:
   [1] Code Generation 💻
   [2] Creative Writing ✍️
   [3] Detailed Explanation 🎓
   [4] General Expert 🧠

> Enter template number (or press Enter for auto-detect): 

2. Enter your prompt:
> write a function to calculate fibonacci numbers

🎯 Auto-detected template: Code Generation 💻

3. Select target model (available: default, gpt4, claude, gemini):
> Enter model name (or press Enter for default): gpt4

✨ PromptCraft | Template: Code Generation 💻 | Model: gpt4 ✨
────────────────────────────────────────────────────────────
**Role:** You are a senior software engineer with expertise in multiple programming paradigms and languages.
**Task:** Write code for: "write a function to calculate fibonacci numbers"

**Requirements:**
1. Robust, efficient, and best-practice code.
2. Clear comments for complex logic.
3. Comprehensive error handling.
4. Consideration of edge cases.
**For GPT-4:** Leverage your advanced reasoning capabilities and multi-step analytical processes.
────────────────────────────────────────────────────────────
✅ Prompt copied to clipboard!
```

#### Direct Command Usage

```bash
# Basic enhancement
python prompt_craft.py "explain machine learning"

# Specify model
python prompt_craft.py -m claude "write a poem about coding"

# Quiet mode (script-friendly)
python prompt_craft.py -q "debug this error" > enhanced_prompt.txt
```

### Web Interface

1. **Open `prompt_craft.html` in your browser**
2. **Enter your prompt** in the text area
3. **Choose template and model** (or let it auto-detect)
4. **Click the Mario-style button** to enhance
5. **Copy the enhanced prompt** with one click

**Features:**
- 🎨 Cyberpunk-themed interface with smooth animations
- 📱 Responsive design works on mobile devices
- ⚙️ Settings panel for customization
- 📊 Character counter and validation
- 🎯 Auto-detection of prompt type

### React Component

```tsx
import React from 'react';
import PromptCraftUI from 'promptcraft';

function MyApp() {
  const handleEnhanced = (prompt: string, template: string) => {
    console.log('Enhanced prompt ready:', prompt);
    // Send to your AI model API
  };

  return (
    <PromptCraftUI 
      onPromptEnhanced={handleEnhanced}
      defaultModel="gpt4"
      autoEnhance={false}
    />
  );
}
```

## Advanced Features

### Template Auto-Detection

PromptCraft automatically selects the best template by analyzing keywords in your input:

| Keywords | Template | Best For |
|----------|----------|----------|
| code, python, function, script | Code Generation | Programming tasks |
| write, create, story, poem | Creative Writing | Content creation |
| explain, what is, how does | Detailed Explanation | Learning and education |
| analyze, research, study | General Expert | Analysis and research |

### Model-Specific Optimization

Each AI model has unique strengths. PromptCraft optimizes prompts accordingly:

- **GPT-4**: Emphasizes reasoning and step-by-step thinking
- **Claude**: Focuses on safety and helpful responses
- **Gemini**: Leverages multimodal capabilities
- **Default**: Generic optimization for any model

### Custom Configuration

#### Creating Custom Templates

1. **Locate your config file:**
   ```bash
   # Default location
   ~/.config/promptcraft/config.json
   ```

2. **Add a custom template:**
   ```json
   {
     "templates": {
       "marketing": {
         "name": "Marketing Copy 📢",
         "content": "**Role:** You are a professional copywriter...\n**Task:** Create marketing content for: \"{user_input}\"\n\n**Requirements:**\n- Compelling and persuasive\n- Target audience focus\n- Clear call-to-action\n{model_instructions}"
       }
     },
     "keywords": {
       "marketing": ["marketing", "copy", "advertisement", "campaign", "promotion"]
     }
   }
   ```

3. **Test your template:**
   ```bash
   python prompt_craft.py "create a campaign for our new product"
   ```

#### Environment Configuration

Create a `.env` file for your environment:

```bash
# Development settings
PROMPTCRAFT_ENV=development
PROMPTCRAFT_DEBUG=true
PROMPTCRAFT_LOG_LEVEL=debug
PROMPTCRAFT_MAX_INPUT_LENGTH=15000

# Custom paths
PROMPTCRAFT_CONFIG_DIR=./config
PROMPTCRAFT_CONFIG_FILE=my-config.json
```

### Batch Processing

Process multiple prompts efficiently:

```python
#!/usr/bin/env python3
from prompt_craft import enhance_prompt, load_config

def batch_process(prompts_file, output_file, model="default"):
    config = load_config()
    
    with open(prompts_file, 'r') as f:
        prompts = f.readlines()
    
    with open(output_file, 'w') as f:
        for i, prompt in enumerate(prompts):
            prompt = prompt.strip()
            if prompt:
                enhanced, template = enhance_prompt(config, prompt, model)
                f.write(f"=== Prompt {i+1} (Template: {template}) ===\n")
                f.write(enhanced)
                f.write("\n\n")

# Usage
batch_process("my_prompts.txt", "enhanced_prompts.txt", "gpt4")
```

## Configuration

### Configuration File Structure

The configuration file (`~/.config/promptcraft/config.json`) controls all behavior:

```json
{
  "templates": {
    "template_id": {
      "name": "Display Name",
      "content": "Template with {user_input} and {model_instructions}"
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

### Customization Options

#### Adding New Models

```json
{
  "model_instructions": {
    "custom_model": "**For Custom Model:** Use specific formatting and capabilities."
  }
}
```

#### Modifying Keywords

```json
{
  "keywords": {
    "code": ["code", "programming", "development", "script", "algorithm", "debug"]
  }
}
```

#### Template Variables

Templates support these placeholders:

- `{user_input}`: Original user prompt
- `{model_instructions}`: Model-specific optimizations

## Tips and Best Practices

### Writing Better Input Prompts

1. **Be Specific**: "Write a Python function to sort a list" vs "write code"
2. **Include Context**: "Explain quantum computing to a high school student"
3. **State Requirements**: "Create a REST API with error handling and documentation"

### Choosing the Right Model

- **GPT-4**: Complex reasoning, analysis, academic writing
- **Claude**: Safety-critical applications, ethical considerations
- **Gemini**: Multimodal tasks, image analysis
- **Default**: General use, model-agnostic prompts

### Template Selection

- **Code**: Programming, scripting, technical implementation
- **Creative**: Stories, poems, marketing copy, creative content
- **Explain**: Tutorials, educational content, concept explanation
- **General**: Research, analysis, professional communication

### Performance Tips

1. **Use Quiet Mode** for automation: `-q` flag
2. **Cache Configuration** in scripts
3. **Batch Process** multiple prompts
4. **Set Appropriate Limits** with environment variables

### Security Considerations

1. **Validate Input**: Always sanitize user input
2. **Use Environment Variables**: For sensitive configuration
3. **Regular Updates**: Keep dependencies current
4. **Access Control**: Protect configuration files

## Troubleshooting

### Common Issues and Solutions

#### Issue: "Configuration file not found"
```bash
# Solution: Create default configuration
python prompt_craft.py -i
```

#### Issue: "Permission denied"
```bash
# Solution: Check directory permissions
chmod 755 ~/.config/promptcraft/
```

#### Issue: "'pyperclip' not found"
```bash
# Solution: Install clipboard support
pip install pyperclip

# On Linux, you may also need:
sudo apt-get install xclip  # or xsel
```

#### Issue: "Input too long"
```bash
# Solution: Increase limit or reduce input
export PROMPTCRAFT_MAX_INPUT_LENGTH=20000
```

#### Issue: Web interface not loading
```bash
# Solution: Serve via HTTP server
python -m http.server 8000
# Then open http://localhost:8000/prompt_craft.html
```

### Debug Mode

Enable verbose output for troubleshooting:

```bash
# CLI debug mode
python prompt_craft.py -v "your prompt"

# Environment variable
export PROMPTCRAFT_DEBUG=true
export PROMPTCRAFT_LOG_LEVEL=debug
```

### Getting Help

1. **Built-in Help**: `python prompt_craft.py --help`
2. **Interactive Mode**: `python prompt_craft.py -i`
3. **GitHub Issues**: Report bugs and request features
4. **Documentation**: Check `docs/` directory for detailed guides

### Log Files

Check log files for detailed error information:

```bash
# Default log location (if configured)
tail -f ~/.config/promptcraft/promptcraft.log

# Or check system logs
journalctl -f | grep promptcraft
```

## Examples and Use Cases

### Code Development

```bash
# Generate a complete function
python prompt_craft.py -m gpt4 "create a REST API endpoint for user authentication"

# Debug assistance
python prompt_craft.py "explain this error: TypeError: list indices must be integers"

# Code review
python prompt_craft.py "review this Python function for security issues"
```

### Content Creation

```bash
# Blog post
python prompt_craft.py -m claude "write a blog post about sustainable technology"

# Marketing copy
python prompt_craft.py "create compelling copy for a productivity app"

# Social media
python prompt_craft.py "write engaging Twitter thread about remote work"
```

### Education and Research

```bash
# Academic explanation
python prompt_craft.py "explain machine learning algorithms for computer science students"

# Research analysis
python prompt_craft.py "analyze the impact of AI on healthcare industry"

# Study guide
python prompt_craft.py "create study questions for quantum physics chapter"
```

### Business and Professional

```bash
# Meeting agenda
python prompt_craft.py "create agenda for quarterly planning meeting"

# Email draft
python prompt_craft.py "write professional email declining a project proposal"

# Report summary
python prompt_craft.py "summarize quarterly sales data and trends"
```

Remember: PromptCraft enhances your prompts, but the quality of the final result still depends on the AI model you use and how you apply the enhanced prompt. Experiment with different templates and models to find what works best for your specific use cases!