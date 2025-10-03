#!/usr/bin/env python3
"""
PromptCraft - Neural Prompt Enhancement System

A command-line tool for enhancing AI prompts with intelligent template selection
and model-specific optimizations.

Author: PromptCraft Team
License: Apache 2.0
Version: 3.0.1
"""

import sys
import os
import json
import argparse
import logging
from typing import Dict, Any, Optional, Tuple
from pathlib import Path

try:
    import pyperclip
except ImportError:
    pyperclip = None

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None

try:
    import jsonschema
except ImportError:
    jsonschema = None

# Load environment variables
if load_dotenv:
    load_dotenv()

# Environment-aware configuration
ENV = os.getenv('PROMPTCRAFT_ENV', 'development')
DEBUG = os.getenv('PROMPTCRAFT_DEBUG', 'false').lower() == 'true'
LOG_LEVEL = os.getenv('PROMPTCRAFT_LOG_LEVEL', 'info').upper()
MAX_INPUT_LENGTH = int(os.getenv('PROMPTCRAFT_MAX_INPUT_LENGTH', '10000'))
VALIDATE_INPUT = os.getenv('PROMPTCRAFT_VALIDATE_INPUT', 'true').lower() == 'true'

CONFIG_DIR = os.path.expanduser(os.getenv('PROMPTCRAFT_CONFIG_DIR', '~/.config/promptcraft'))
CONFIG_FILE = os.path.join(CONFIG_DIR, os.getenv('PROMPTCRAFT_CONFIG_FILE', 'config.json'))

# Set up logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('promptcraft')

# Configuration validation schema
CONFIG_SCHEMA = {
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
        },
        "model_instructions": {
            "type": "object",
            "additionalProperties": {"type": "string"}
        },
        "keywords": {
            "type": "object",
            "additionalProperties": {
                "type": "array",
                "items": {"type": "string"}
            }
        }
    },
    "required": ["templates", "model_instructions", "keywords"]
}

class PromptCraftError(Exception):
    """Base exception for PromptCraft errors."""
    pass

class ConfigurationError(PromptCraftError):
    """Configuration-related errors."""
    pass

class ValidationError(PromptCraftError):
    """Input validation errors."""
    pass

def validate_config(config: Dict[str, Any]) -> None:
    """Validate configuration against schema.
    
    Args:
        config: Configuration dictionary to validate
        
    Raises:
        ConfigurationError: If configuration is invalid
    """
    if jsonschema is None:
        logger.warning("jsonschema not available, skipping config validation")
        return
        
    try:
        jsonschema.validate(config, CONFIG_SCHEMA)
        logger.debug("Configuration validation passed")
    except jsonschema.ValidationError as e:
        raise ConfigurationError(f"Invalid configuration: {e.message}")
    except Exception as e:
        raise ConfigurationError(f"Configuration validation failed: {e}")

def validate_input(user_input: str) -> str:
    """Validate and sanitize user input.
    
    Args:
        user_input: Raw user input
        
    Returns:
        Sanitized input string
        
    Raises:
        ValidationError: If input is invalid
    """
    if not user_input or not user_input.strip():
        raise ValidationError("Input cannot be empty")
        
    if len(user_input) > MAX_INPUT_LENGTH:
        raise ValidationError(f"Input too long. Maximum {MAX_INPUT_LENGTH} characters allowed")
        
    # Basic sanitization - remove control characters
    sanitized = ''.join(char for char in user_input if ord(char) >= 32 or char in '\n\r\t')
    
    if len(sanitized) != len(user_input):
        logger.warning("Input contained control characters that were removed")
        
    return sanitized.strip()

def load_config() -> Dict[str, Any]:
    """Load and validate configuration from JSON file.
    
    Returns:
        Validated configuration dictionary
        
    Raises:
        ConfigurationError: If configuration cannot be loaded or is invalid
    """
    logger.info(f"Loading configuration from {CONFIG_FILE}")
    
    if not os.path.exists(CONFIG_FILE):
        logger.info("Configuration file not found. Creating default configuration...")
        try:
            create_default_config()
        except Exception as e:
            raise ConfigurationError(f"Failed to create default config: {e}")
    
    try:
        with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
            config = json.load(f)
        logger.debug("Configuration loaded successfully")
    except json.JSONDecodeError as e:
        raise ConfigurationError(f"Invalid JSON in config file: {e}")
    except FileNotFoundError:
        raise ConfigurationError(f"Config file not found: {CONFIG_FILE}")
    except PermissionError:
        raise ConfigurationError(f"Permission denied reading config file: {CONFIG_FILE}")
    except Exception as e:
        raise ConfigurationError(f"Unexpected error loading config: {e}")
    
    # Validate configuration if validation is enabled
    if VALIDATE_INPUT:
        validate_config(config)
    
    return config

def create_default_config() -> None:
    """Create a default configuration file.
    
    Raises:
        ConfigurationError: If default config creation fails
    """
    default_config = {
        "templates": {
            "code": {
                "name": "Code Generation 💻",
                "content": "**Role:** You are a senior software engineer with expertise in multiple programming paradigms and languages.\n**Task:** Write code for: \"{user_input}\"\n\n**Requirements:**\n1. Robust, efficient, and best-practice code.\n2. Clear comments for complex logic.\n3. Comprehensive error handling.\n4. Consideration of edge cases.\n{model_instructions}"
            },
            "creative": {
                "name": "Creative Writing ✍️",
                "content": "**Role:** You are a skilled creative writer with mastery over narrative techniques and stylistic flourishes.\n**Task:** Write for the prompt: \"{user_input}\"\n\n**Tone and Style:** Engaging and immersive\n**Audience:** Discerning readers who appreciate nuanced prose\n{model_instructions}"
            },
            "explain": {
                "name": "Detailed Explanation 🎓",
                "content": "**Role:** You are a master educator capable of distilling complex concepts into comprehensible explanations.\n**Task:** Explain the topic: \"{user_input}\"\n\n**Target Audience:** Intelligent learners seeking depth\n**Instructions:**\n- Use clear analogies where appropriate.\n- Build understanding progressively.\n- Avoid unnecessary jargon.\n{model_instructions}"
            },
            "general": {
                "name": "General Expert 🧠",
                "content": "**Role:** You are a world-class expert with comprehensive knowledge across domains.\n**Task:** Fulfill the request: \"{user_input}\"\n\n**Constraints:**\n- Provide a well-structured response.\n- Verify facts and maintain accuracy.\n- Consider multiple perspectives.\n{model_instructions}"
            }
        },
        "model_instructions": {
            "default": "**Output Format:** Provide a clear, well-formatted response using markdown where appropriate.",
            "gpt4": "**For GPT-4:** Leverage your advanced reasoning capabilities and multi-step analytical processes.",
            "claude": "**For Claude:** Utilize your nuanced understanding and contextual awareness to provide helpful, precise responses.",
            "gemini": "**For Gemini:** Apply your multimodal reasoning and comprehensive analytical capabilities."
        },
        "keywords": {
            "code": ["code", "python", "javascript", "function", "script", "sql", "program", "algorithm"],
            "creative": ["write", "create", "poem", "story", "email", "narrative", "compose"],
            "explain": ["explain", "what is", "how does", "summarize", "describe", "clarify"]
        }
    }
    
    try:
        os.makedirs(CONFIG_DIR, exist_ok=True)
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(default_config, f, indent=4, ensure_ascii=False)
        logger.info(f"Default configuration created at {CONFIG_FILE}")
    except PermissionError:
        raise ConfigurationError(f"Permission denied creating config directory: {CONFIG_DIR}")
    except Exception as e:
        raise ConfigurationError(f"Failed to create default config: {e}")

def enhance_prompt(config: Dict[str, Any], user_input: str, model: str) -> Tuple[str, str]:
    """Determine the best template and enhance the prompt.
    
    Args:
        config: Validated configuration dictionary
        user_input: User's raw input prompt
        model: Target AI model identifier
        
    Returns:
        Tuple of (enhanced_prompt, template_name)
        
    Raises:
        ValidationError: If input validation fails
        ConfigurationError: If template or model not found
    """
    try:
        # Validate and sanitize input
        if VALIDATE_INPUT:
            user_input = validate_input(user_input)
        
        logger.debug(f"Enhancing prompt for model: {model}")
        
        # Keyword matching to find the right template
        lower_input = user_input.lower()
        template_key = "general"  # Default fallback
        
        # Find best matching template based on keywords
        max_matches = 0
        for key, keywords in config["keywords"].items():
            matches = sum(1 for kw in keywords if kw in lower_input)
            if matches > max_matches:
                max_matches = matches
                template_key = key
        
        logger.debug(f"Selected template: {template_key} (matches: {max_matches})")
        
        # Validate template exists
        if template_key not in config["templates"]:
            raise ConfigurationError(f"Template '{template_key}' not found in configuration")
        
        template = config["templates"][template_key]["content"]
        template_name = config["templates"][template_key]["name"]
        
        # Get model-specific instructions
        model_inst = config["model_instructions"].get(
            model, 
            config["model_instructions"].get("default", "")
        )
        
        if not model_inst and model != "default":
            logger.warning(f"No instructions found for model '{model}', using default")
            model_inst = config["model_instructions"].get("default", "")
        
        # Fill placeholders with proper escaping
        enhanced = template.replace("{user_input}", user_input)
        enhanced = enhanced.replace("{model_instructions}", model_inst)
        
        logger.info(f"Prompt enhanced using template '{template_name}' for model '{model}'")
        return enhanced, template_name
        
    except (ValidationError, ConfigurationError):
        raise
    except Exception as e:
        raise PromptCraftError(f"Unexpected error during prompt enhancement: {e}")

def interactive_mode(config: Dict[str, Any]) -> Tuple[str, str]:
    """Guide the user through building a prompt interactively.
    
    Args:
        config: Validated configuration dictionary
        
    Returns:
        Tuple of (enhanced_prompt, template_name)
        
    Raises:
        PromptCraftError: If interactive session fails
    """
    try:
        print("\n🚀 Welcome to PromptCraft Interactive Mode!")
        print("=" * 50)
        
        # 1. Choose template
        print("\n1. Select a template:")
        template_options = {str(i+1): key for i, key in enumerate(config["templates"])}
        for i, key in template_options.items():
            print(f"   [{i}] {config['templates'][key]['name']}")
        
        while True:
            try:
                choice = input("\n> Enter template number (or press Enter for auto-detect): ").strip()
                if not choice:
                    template_key = None  # Will auto-detect later
                    break
                elif choice in template_options:
                    template_key = template_options[choice]
                    break
                else:
                    print(f"❌ Invalid choice. Please enter 1-{len(template_options)} or press Enter.")
            except KeyboardInterrupt:
                print("\n\n👋 Goodbye!")
                sys.exit(0)
        
        # 2. Get user input
        print("\n2. Enter your prompt:")
        while True:
            try:
                user_input = input("> ").strip()
                if user_input:
                    break
                print("❌ Prompt cannot be empty. Please try again.")
            except KeyboardInterrupt:
                print("\n\n👋 Goodbye!")
                sys.exit(0)
        
        # Auto-detect template if not specified
        if template_key is None:
            lower_input = user_input.lower()
            max_matches = 0
            template_key = "general"
            for key, keywords in config["keywords"].items():
                matches = sum(1 for kw in keywords if kw in lower_input)
                if matches > max_matches:
                    max_matches = matches
                    template_key = key
            print(f"🎯 Auto-detected template: {config['templates'][template_key]['name']}")
        
        # 3. Choose model
        available_models = list(config["model_instructions"].keys())
        print(f"\n3. Select target model (available: {', '.join(available_models)}):")
        model = input("> Enter model name (or press Enter for default): ").strip().lower()
        if not model:
            model = "default"
        
        return enhance_prompt(config, user_input, model)
        
    except (EOFError, KeyboardInterrupt):
        print("\n\n👋 Goodbye!")
        sys.exit(0)
    except Exception as e:
        raise PromptCraftError(f"Interactive mode failed: {e}")

def main() -> None:
    """Main entry point for PromptCraft CLI."""
    parser = argparse.ArgumentParser(
        description="PromptCraft - Neural Prompt Enhancement System",
        epilog="Examples:\n"
               "  promptcraft -i                    # Interactive mode\n"
               "  promptcraft 'write a function'    # Direct prompt\n"
               "  promptcraft -m gpt4 'explain AI'  # Model-specific\n"
               "  promptcraft -q 'code review'      # Quiet mode",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    parser.add_argument(
        'prompt', 
        nargs='*', 
        help="The basic prompt to enhance"
    )
    parser.add_argument(
        '-i', '--interactive', 
        action='store_true', 
        help="Enable interactive mode"
    )
    parser.add_argument(
        '-m', '--model', 
        type=str, 
        default='default', 
        help="Target AI model (gpt4, claude, gemini, default)"
    )
    parser.add_argument(
        '-q', '--quiet', 
        action='store_true', 
        help="Quiet mode: minimal output"
    )
    parser.add_argument(
        '-v', '--verbose', 
        action='store_true', 
        help="Verbose output for debugging"
    )
    parser.add_argument(
        '--version', 
        action='version', 
        version='PromptCraft 3.0.1'
    )
    parser.add_argument(
        '--config', 
        type=str, 
        help="Path to custom configuration file"
    )
    
    args = parser.parse_args()
    
    # Adjust logging level based on arguments
    if args.verbose:
        logging.getLogger('promptcraft').setLevel(logging.DEBUG)
    elif args.quiet:
        logging.getLogger('promptcraft').setLevel(logging.ERROR)
    
    # Use custom config file if specified
    if args.config:
        global CONFIG_FILE
        CONFIG_FILE = os.path.expanduser(args.config)
        logger.info(f"Using custom config file: {CONFIG_FILE}")
    
    try:
        # Load and validate configuration
        config = load_config()
        
        # Determine mode and get enhanced prompt
        if args.interactive:
            enhanced_prompt, template_name = interactive_mode(config)
        else:
            if not args.prompt:
                if not args.quiet:
                    print("❌ No prompt provided. Use -i for interactive mode or provide a prompt.")
                    print("\nFor help: promptcraft --help")
                sys.exit(1)
            
            user_input = " ".join(args.prompt)
            enhanced_prompt, template_name = enhance_prompt(config, user_input, args.model)
        
        # Output results
        if not args.quiet:
            print(f"\n✨ \033[1;36mPromptCraft | Template: {template_name} | Model: {args.model}\033[0m ✨")
            print("\033[1;30m" + "─" * 60 + "\033[0m")
            print(enhanced_prompt)
            print("\033[1;30m" + "─" * 60 + "\033[0m")
        
        # Copy to clipboard if available
        if pyperclip:
            try:
                pyperclip.copy(enhanced_prompt)
                if not args.quiet:
                    print("✅ \033[1;32mPrompt copied to clipboard!\033[0m")
            except Exception as e:
                logger.error(f"Clipboard copy failed: {e}")
                if not args.quiet:
                    print("⚠️ \033[1;33mCould not copy to clipboard\033[0m")
        else:
            if not args.quiet:
                print("ℹ️ \033[1;33mInstall 'pyperclip' for clipboard support\033[0m")
        
        logger.info("Prompt enhancement completed successfully")
        
    except KeyboardInterrupt:
        print("\n\n👋 Operation cancelled by user")
        sys.exit(130)
    except (ConfigurationError, ValidationError) as e:
        logger.error(f"Configuration/Validation error: {e}")
        if not args.quiet:
            print(f"❌ Error: {e}")
        sys.exit(1)
    except PromptCraftError as e:
        logger.error(f"PromptCraft error: {e}")
        if not args.quiet:
            print(f"❌ Error: {e}")
        sys.exit(1)
    except Exception as e:
        logger.critical(f"Unexpected error: {e}", exc_info=DEBUG)
        if not args.quiet:
            print(f"💥 Unexpected error: {e}")
            if DEBUG:
                import traceback
                traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()