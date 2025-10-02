#!/usr/bin/env python3

import sys
import os
import json
import argparse
try:
    import pyperclip
except ImportError:
    pyperclip = None

CONFIG_DIR = os.path.expanduser("~/.config/promptcraft")
CONFIG_FILE = os.path.join(CONFIG_DIR, "config.json")

def load_config():
    """Loads configuration from the JSON file."""
    if not os.path.exists(CONFIG_FILE):
        print("Configuration file not found. Creating a default one...")
        create_default_config()
    try:
        with open(CONFIG_FILE, 'r') as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError) as e:
        print(f"Error loading config: {e}")
        sys.exit(1)

def create_default_config():
    """Creates a default config.json file."""
    default_config = {
        "templates": {
            "code": {
                "name": "Code Generation 🧑‍💻",
                "content": "**Role:** You are a senior software engineer...\n**Task:** Write code for: \"{user_input}\"\n\n**Requirements:**\n1. Robust, efficient, and best-practice code.\n2. Clear comments for complex logic.\n3. Comprehensive error handling.\n{model_instructions}"
            },
            "creative": {
                "name": "Creative Writing ✍️",
                "content": "**Role:** You are a skilled creative writer...\n**Task:** Write for the prompt: \"{user_input}\"\n\n**Tone and Style:** [Specify desired tone]\n**Audience:** [Specify target audience]\n{model_instructions}"
            },
            "explain": {
                "name": "Detailed Explanation 🎓",
                "content": "**Role:** You are a master educator...\n**Task:** Explain the topic: \"{user_input}\"\n\n**Target Audience:** [Specify audience]\n**Instructions:**\n- Use a simple analogy.\n- Avoid jargon where possible.\n{model_instructions}"
            },
            "general": {
                "name": "General Expert 🧠",
                "content": "**Role:** You are a world-class expert...\n**Task:** Fulfill the request: \"{user_input}\"\n\n**Constraints:**\n- Provide a well-structured response.\n- Verify facts and cite sources.\n{model_instructions}"
            }
        },
        "model_instructions": {
            "default": "**Output Format:** Provide a clear, well-formatted response using markdown.",
            "gpt4": "**For GPT-4:** Leverage your advanced reasoning and step-by-step thinking capabilities.",
            "claude": "**For Claude:** Adhere strictly to your safety guidelines and provide helpful, harmless responses."
        },
        "keywords": {
            "code": ["code", "python", "javascript", "function", "script", "sql"],
            "creative": ["write", "create", "poem", "story", "email"],
            "explain": ["explain", "what is", "how does", "summarize"]
        }
    }
    os.makedirs(CONFIG_DIR, exist_ok=True)
    with open(CONFIG_FILE, 'w') as f:
        json.dump(default_config, f, indent=4)
    print(f"Default config created at {CONFIG_FILE}")

def enhance_prompt(config, user_input, model):
    """Determines the best template and enhances the prompt."""
    lower_input = user_input.lower()
    
    # Keyword matching to find the right template
    template_key = "general" # Default
    for key, keywords in config["keywords"].items():
        if any(kw in lower_input for kw in keywords):
            template_key = key
            break

    template = config["templates"][template_key]["content"]
    
    # Get model-specific instructions
    model_inst = config["model_instructions"].get(model, config["model_instructions"]["default"])
    
    # Fill placeholders
    enhanced = template.replace("{user_input}", user_input)
    enhanced = enhanced.replace("{model_instructions}", model_inst)
    
    return enhanced, config["templates"][template_key]["name"]

def interactive_mode(config):
    """Guides the user through building a prompt."""
    print("Welcome to PromptCraft Interactive Mode!")
    
    # 1. Choose template
    print("1. Select a template:")
    template_options = {str(i+1): key for i, key in enumerate(config["templates"])}
    for i, key in template_options.items():
        print(f"   [{i}] {config['templates'][key]['name']}")
    choice = input("> ")
    template_key = template_options.get(choice, "general")

    # 2. Get user input
    user_input = input("2. Enter your basic prompt:\n> ")
    
    # 3. Choose model
    print("3. (Optional) Specify a model (e.g., gpt4, claude) or press Enter for default:")
    model = input("> ").lower()
    
    return enhance_prompt(config, user_input, model)

def main():
    parser = argparse.ArgumentParser(description="Enhance prompts for AI models.")
    parser.add_argument('prompt', nargs='*', help="The basic prompt to enhance.")
    parser.add_argument('-i', '--interactive', action='store_true', help="Enable interactive mode.")
    parser.add_argument('-m', '--model', type=str, default='default', help="Target a specific AI model (e.g., gpt4, claude).")
    parser.add_argument('-q', '--quiet', action='store_true', help="Quiet mode: only copy to clipboard, no terminal output.")
    
    args = parser.parse_args()
    config = load_config()

    if args.interactive:
        enhanced_prompt, template_name = interactive_mode(config)
    else:
        if not args.prompt:
            parser.print_help()
            sys.exit(1)
        user_input = " ".join(args.prompt)
        enhanced_prompt, template_name = enhance_prompt(config, user_input, args.model)
        
    if not args.quiet:
        print(f"✨ \033[1;36mPromptCraft | Using Template: {template_name}\033[0m ✨")
        print("\033[1;30m" + "─" * 50 + "\033[0m")
        print(enhanced_prompt)
        print("\033[1;30m" + "─" * 50 + "\033[0m")

    if pyperclip:
        try:
            pyperclip.copy(enhanced_prompt)
            if not args.quiet:
                print("✅ \033[1;32mPrompt copied to clipboard!\033[0m")
        except pyperclip.PyperclipException:
            if not args.quiet:
                print("⚠️ \033[1;33mCould not copy. Is 'xclip' or 'xsel' installed?\033[0m")
    else:
        if not args.quiet:
            print("⚠️ \033[1;33m'pyperclip' not found. Skipping clipboard copy.\033[0m")

if __name__ == "__main__":
    main()