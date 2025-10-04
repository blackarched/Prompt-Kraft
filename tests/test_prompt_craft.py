#!/usr/bin/env python3
"""
Tests for PromptCraft functionality.

Run with: python -m pytest tests/test_prompt_craft.py -v
"""

import pytest
import json
import tempfile
import os
from unittest.mock import patch, mock_open
from pathlib import Path

# Import the functions we want to test
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from prompt_craft import (
    enhance_prompt, 
    validate_input, 
    validate_config,
    create_default_config,
    load_config,
    PromptCraftError,
    ConfigurationError,
    ValidationError
)


class TestInputValidation:
    """Test input validation functionality."""
    
    def test_validate_input_with_valid_string(self):
        """Test that valid input passes validation."""
        valid_input = "This is a valid prompt"
        result = validate_input(valid_input)
        assert result == valid_input
    
    def test_validate_input_rejects_empty_string(self):
        """Test that empty strings are rejected."""
        with pytest.raises(ValidationError, match="Input cannot be empty"):
            validate_input("")
    
    def test_validate_input_rejects_whitespace_only(self):
        """Test that whitespace-only strings are rejected."""
        with pytest.raises(ValidationError, match="Input cannot be empty"):
            validate_input("   \n\t  ")
    
    def test_validate_input_trims_whitespace(self):
        """Test that leading/trailing whitespace is trimmed."""
        result = validate_input("  test prompt  ")
        assert result == "test prompt"
    
    def test_validate_input_removes_control_characters(self):
        """Test that control characters are removed."""
        input_with_controls = "test\x00prompt\x01"
        result = validate_input(input_with_controls)
        assert result == "testprompt"
    
    @patch('prompt_craft.MAX_INPUT_LENGTH', 10)
    def test_validate_input_rejects_too_long(self):
        """Test that overly long input is rejected."""
        long_input = "a" * 11  # Longer than MAX_INPUT_LENGTH
        with pytest.raises(ValidationError, match="Input too long"):
            validate_input(long_input)


class TestConfigValidation:
    """Test configuration validation."""
    
    def test_validate_config_with_valid_config(self):
        """Test that valid configuration passes validation."""
        valid_config = {
            "templates": {
                "test": {
                    "name": "Test Template",
                    "content": "Test content with {user_input}"
                }
            },
            "model_instructions": {
                "default": "Test instructions"
            },
            "keywords": {
                "test": ["test", "example"]
            }
        }
        # Should not raise any exception
        validate_config(valid_config)
    
    def test_validate_config_rejects_missing_templates(self):
        """Test that config without templates is rejected."""
        invalid_config = {
            "model_instructions": {"default": "test"},
            "keywords": {"test": ["test"]}
        }
        with pytest.raises(ConfigurationError):
            validate_config(invalid_config)
    
    def test_validate_config_rejects_empty_template_name(self):
        """Test that templates with empty names are rejected."""
        invalid_config = {
            "templates": {
                "test": {
                    "name": "",  # Empty name
                    "content": "Test content"
                }
            },
            "model_instructions": {"default": "test"},
            "keywords": {"test": ["test"]}
        }
        with pytest.raises(ConfigurationError):
            validate_config(invalid_config)


class TestTemplateDetection:
    """Test template detection based on keywords."""
    
    def test_detect_template_with_matching_keywords(self):
        """Test template detection with matching keywords."""
        keywords = {
            "code": ["code", "python", "function"],
            "creative": ["write", "story", "poem"],
            "general": ["help", "assist"]
        }
        
        # Test code detection
        assert detect_template("write a python function", keywords) == "code"
        
        # Test creative detection
        assert detect_template("write a story about adventure", keywords) == "creative"
        
        # Test general fallback
        assert detect_template("random unmatched text", keywords) == "general"
    
    def test_detect_template_case_insensitive(self):
        """Test that template detection is case-insensitive."""
        keywords = {"code": ["python", "function"]}
        
        result = detect_template("Write a PYTHON Function", keywords)
        assert result == "code"
    
    def test_detect_template_multiple_matches(self):
        """Test that template with most matches is selected."""
        keywords = {
            "code": ["code", "python"],
            "creative": ["write", "create"],
            "general": []
        }
        
        # Input matches both "code" (1 match) and "creative" (1 match)
        # Should return the first one found or handle tie-breaking
        result = detect_template("write python code", keywords)
        assert result in ["code", "creative"]


def detect_template(input_text: str, keywords: dict) -> str:
    """Simple template detection for testing."""
    lower_input = input_text.lower()
    template_key = "general"  # Default
    max_matches = 0
    
    for key, kw_list in keywords.items():
        matches = sum(1 for kw in kw_list if kw.lower() in lower_input)
        if matches > max_matches:
            max_matches = matches
            template_key = key
    
    return template_key


class TestPromptEnhancement:
    """Test prompt enhancement functionality."""
    
    def test_enhance_prompt_basic_functionality(self):
        """Test basic prompt enhancement."""
        config = {
            "templates": {
                "general": {
                    "name": "General Expert",
                    "content": "Task: {user_input}\nInstructions: {model_instructions}"
                }
            },
            "model_instructions": {
                "default": "Be helpful and clear"
            },
            "keywords": {
                "general": ["help"]
            }
        }
        
        enhanced, template_name = enhance_prompt(config, "help me", "default")
        
        assert "help me" in enhanced
        assert "Be helpful and clear" in enhanced
        assert template_name == "General Expert"
    
    def test_enhance_prompt_with_custom_model(self):
        """Test prompt enhancement with custom model instructions."""
        config = {
            "templates": {
                "general": {
                    "name": "General Expert",
                    "content": "Task: {user_input}\n{model_instructions}"
                }
            },
            "model_instructions": {
                "default": "Default instructions",
                "gpt4": "GPT-4 specific instructions"
            },
            "keywords": {
                "general": ["help"]
            }
        }
        
        enhanced, _ = enhance_prompt(config, "help me", "gpt4")
        
        assert "GPT-4 specific instructions" in enhanced
        assert "Default instructions" not in enhanced
    
    def test_enhance_prompt_falls_back_to_default_model(self):
        """Test that unknown models fall back to default."""
        config = {
            "templates": {
                "general": {
                    "name": "General Expert",
                    "content": "Task: {user_input}\n{model_instructions}"
                }
            },
            "model_instructions": {
                "default": "Default instructions"
            },
            "keywords": {
                "general": ["help"]
            }
        }
        
        enhanced, _ = enhance_prompt(config, "help me", "unknown_model")
        
        assert "Default instructions" in enhanced
    
    def test_enhance_prompt_template_not_found(self):
        """Test error handling when template is not found."""
        config = {
            "templates": {},  # Empty templates
            "model_instructions": {"default": "test"},
            "keywords": {"missing": ["test"]}
        }
        
        with pytest.raises(ConfigurationError, match="Template .* not found"):
            enhance_prompt(config, "test input", "default")


class TestConfigurationCreation:
    """Test configuration file creation."""
    
    def test_create_default_config_structure(self):
        """Test that default config has required structure."""
        with tempfile.TemporaryDirectory() as temp_dir:
            config_file = os.path.join(temp_dir, "config.json")
            
            # Mock the global CONFIG_FILE
            with patch('prompt_craft.CONFIG_FILE', config_file):
                with patch('prompt_craft.CONFIG_DIR', temp_dir):
                    create_default_config()
            
            # Verify file was created
            assert os.path.exists(config_file)
            
            # Verify content structure
            with open(config_file) as f:
                config = json.load(f)
            
            assert "templates" in config
            assert "model_instructions" in config
            assert "keywords" in config
            assert len(config["templates"]) > 0


class TestErrorHandling:
    """Test error handling scenarios."""
    
    def test_configuration_error_inheritance(self):
        """Test that ConfigurationError inherits from PromptCraftError."""
        error = ConfigurationError("test message")
        assert isinstance(error, PromptCraftError)
        assert str(error) == "test message"
    
    def test_validation_error_inheritance(self):
        """Test that ValidationError inherits from PromptCraftError."""
        error = ValidationError("test message")
        assert isinstance(error, PromptCraftError)
        assert str(error) == "test message"


# Integration tests
class TestIntegration:
    """Integration tests for complete workflows."""
    
    def test_complete_enhancement_workflow(self):
        """Test complete enhancement workflow from input to output."""
        # Create a minimal config
        config = {
            "templates": {
                "code": {
                    "name": "Code Generator",
                    "content": "Role: Senior Developer\nTask: {user_input}\n{model_instructions}"
                },
                "general": {
                    "name": "General Expert", 
                    "content": "Task: {user_input}\n{model_instructions}"
                }
            },
            "model_instructions": {
                "default": "Provide clear responses",
                "gpt4": "Use advanced reasoning"
            },
            "keywords": {
                "code": ["code", "function", "script"],
                "general": []
            }
        }
        
        # Test code template detection and enhancement
        user_input = "write a python function to sort a list"
        enhanced, template_name = enhance_prompt(config, user_input, "gpt4")
        
        assert user_input in enhanced
        assert "Use advanced reasoning" in enhanced
        assert template_name == "Code Generator"
        assert "Senior Developer" in enhanced


if __name__ == "__main__":
    # Run tests if script is executed directly
    pytest.main([__file__, "-v"])