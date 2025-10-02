#!/usr/bin/env python3

import json
import sys
import os

# Test the API server functionality without actually starting the server
def test_api_functionality():
    print("🧪 Testing PromptCraft API functionality...")
    
    try:
        # Test imports
        from api_server import app, get_config, enhance_prompt
        from prompt_craft import load_config, create_default_config
        print("✅ All imports successful")
        
        # Test configuration loading
        try:
            config = get_config()
            print("✅ Configuration loaded successfully")
            print(f"   - Templates: {len(config['templates'])}")
            print(f"   - Models: {len(config['model_instructions'])}")
            print(f"   - Keywords: {len(config['keywords'])}")
        except Exception as e:
            print(f"❌ Configuration loading failed: {e}")
            return False
        
        # Test prompt enhancement
        try:
            enhanced, template_name = enhance_prompt(config, "Create a login function", "gpt4")
            print("✅ Prompt enhancement working")
            print(f"   - Template used: {template_name}")
            print(f"   - Enhanced length: {len(enhanced)} characters")
        except Exception as e:
            print(f"❌ Prompt enhancement failed: {e}")
            return False
        
        print("✅ All API functionality tests passed!")
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    success = test_api_functionality()
    sys.exit(0 if success else 1)