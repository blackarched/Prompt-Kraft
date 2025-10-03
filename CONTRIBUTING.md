# Contributing to PromptCraft

Thank you for your interest in contributing to PromptCraft! This document provides guidelines and information for contributors.

## 🤝 Ways to Contribute

- 🐛 **Bug Reports**: Report issues and bugs you encounter
- 💡 **Feature Requests**: Suggest new features and improvements
- 📖 **Documentation**: Improve documentation and examples
- 🧪 **Testing**: Add test cases and improve coverage
- 🔧 **Code**: Fix bugs and implement new features
- 🎨 **UI/UX**: Improve user interface and experience
- 🌐 **Translations**: Add support for multiple languages

## 🚀 Getting Started

### Development Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Prompt-Kraft.git
   cd Prompt-Kraft
   ```

3. **Set up the development environment:**
   ```bash
   # Python dependencies
   pip install -r requirements.txt
   
   # Node.js dependencies (if working on React component)
   npm install
   
   # Development dependencies
   pip install pytest black flake8 mypy
   ```

4. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

5. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your preferences
   ```

### Development Workflow

1. **Make your changes**
2. **Test your changes** thoroughly
3. **Follow code style guidelines**
4. **Update documentation** if needed
5. **Commit with clear messages**
6. **Push to your fork**
7. **Create a pull request**

## 📝 Code Style Guidelines

### Python Code Style

We follow PEP 8 with some modifications:

```python
# Use type hints
def enhance_prompt(config: Dict[str, Any], user_input: str, model: str) -> Tuple[str, str]:
    """Enhance a prompt using intelligent template selection.
    
    Args:
        config: Validated configuration dictionary
        user_input: User's raw input prompt
        model: Target AI model identifier
        
    Returns:
        Tuple of (enhanced_prompt, template_name)
        
    Raises:
        ValidationError: If input validation fails
    """
    pass

# Use descriptive variable names
enhanced_prompt = template.replace("{user_input}", sanitized_input)

# Handle errors explicitly
try:
    config = load_config()
except ConfigurationError as e:
    logger.error(f"Configuration error: {e}")
    raise
```

### JavaScript/TypeScript Style

```typescript
// Use TypeScript interfaces
interface PromptConfig {
  templates: Record<string, Template>;
  modelInstructions: Record<string, string>;
  keywords: Record<string, string[]>;
}

// Use descriptive function names
const enhancePromptSafely = (input: string): string => {
  // Sanitize input without using innerHTML
  const sanitized = document.createTextNode(input).textContent || '';
  return sanitized;
};

// Handle errors gracefully
try {
  const enhanced = await enhancePrompt(config, input, model);
  onSuccess(enhanced);
} catch (error) {
  console.error('Enhancement failed:', error);
  onError(error);
}
```

### Code Formatting

Run these commands before committing:

```bash
# Python formatting
black prompt_craft.py
flake8 prompt_craft.py
mypy prompt_craft.py

# JavaScript/TypeScript formatting (if applicable)
npm run lint:fix
npm run type-check
```

## 🧪 Testing Guidelines

### Writing Tests

1. **Unit Tests**: Test individual functions
2. **Integration Tests**: Test component interactions
3. **End-to-End Tests**: Test complete workflows

### Test Structure

```python
# test_prompt_craft.py
import pytest
from prompt_craft import enhance_prompt, validate_input, ConfigurationError

class TestPromptEnhancement:
    def test_enhance_prompt_with_valid_input(self):
        """Test prompt enhancement with valid input."""
        config = {
            "templates": {"general": {"content": "Role: {user_input}"}},
            "model_instructions": {"default": "Be helpful"},
            "keywords": {"general": ["help"]}
        }
        
        enhanced, template = enhance_prompt(config, "help me", "default")
        
        assert "help me" in enhanced
        assert template == "general"
    
    def test_validate_input_rejects_empty_string(self):
        """Test input validation rejects empty strings."""
        with pytest.raises(ValidationError):
            validate_input("")
```

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=prompt_craft

# Run specific test file
pytest test_prompt_craft.py

# Run specific test
pytest test_prompt_craft.py::TestPromptEnhancement::test_enhance_prompt_with_valid_input
```

## 📖 Documentation Guidelines

### Code Documentation

- **Docstrings**: Use Google-style docstrings for all functions
- **Type Hints**: Include type hints for all function parameters and returns
- **Comments**: Explain complex logic and decisions
- **Examples**: Include usage examples in docstrings

### User Documentation

- **Clear Explanations**: Write for users of all skill levels
- **Examples**: Include practical, working examples
- **Screenshots**: Add screenshots for UI changes
- **Step-by-Step**: Provide detailed instructions

### Documentation Format

```python
def complex_function(param1: str, param2: Optional[int] = None) -> Dict[str, Any]:
    """Process complex operations with multiple parameters.
    
    This function demonstrates the preferred documentation style for
    PromptCraft. Include background information and context.
    
    Args:
        param1: Description of the first parameter with expected format
        param2: Optional parameter with default value and usage notes
        
    Returns:
        Dictionary containing processed results with these keys:
        - 'result': The main result value
        - 'metadata': Additional information about processing
        
    Raises:
        ValueError: When param1 is empty or invalid format
        ProcessingError: When internal processing fails
        
    Example:
        >>> result = complex_function("input_string", 42)
        >>> print(result['result'])
        processed_output
        
    Note:
        This function has side effects on the global configuration.
        Use with caution in multi-threaded environments.
    """
    pass
```

## 🔍 Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] Documentation is updated
- [ ] Changes are focused and atomic
- [ ] Commit messages are clear

### Pull Request Template

```markdown
## Description
Brief description of changes and motivation.

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for hard-to-understand areas
- [ ] Documentation updated
- [ ] No new warnings introduced
```

### Review Process

1. **Automated Checks**: CI/CD pipeline runs automatically
2. **Code Review**: Maintainers review code for quality and correctness
3. **Testing**: Manual and automated testing
4. **Approval**: At least one maintainer approval required
5. **Merge**: Squash and merge after approval

## 🐛 Bug Reports

### Bug Report Template

```markdown
**Describe the Bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
A clear description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
- OS: [e.g. macOS 12.0]
- Python Version: [e.g. 3.9.0]
- PromptCraft Version: [e.g. 3.0.1]
- Browser: [e.g. Chrome 96.0] (if web interface)

**Additional Context**
Add any other context about the problem here.
```

### Security Issues

For security-related issues:

1. **Do NOT** create a public issue
2. **Email** security@promptcraft.dev
3. **Include** detailed reproduction steps
4. **Wait** for response before public disclosure

## 💡 Feature Requests

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is. Ex. I'm always frustrated when [...]

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.

**Use Cases**
Specific examples of how this feature would be used.
```

## 🏗️ Architecture Guidelines

### Code Organization

```
prompt_craft.py           # Main CLI application
├── Configuration         # Config loading and validation
├── Template System       # Template selection and processing
├── Model Instructions    # Model-specific optimizations
├── Input Validation     # Security and sanitization
├── Error Handling       # Exception management
└── CLI Interface        # Command-line interface

prompt_craft.html         # Web interface
├── UI Components        # Interactive elements
├── State Management     # Application state
├── Event Handling       # User interactions
├── Security Measures    # XSS prevention
└── Responsive Design    # Mobile compatibility

prompt_craft_ui.tsx      # React component
├── Component Logic      # React hooks and state
├── Type Definitions     # TypeScript interfaces
├── Event Callbacks      # Parent communication
├── Styling System       # CSS-in-JS or classes
└── Accessibility        # A11y compliance
```

### Design Principles

1. **Security First**: Always validate and sanitize input
2. **User Experience**: Prioritize ease of use and clarity
3. **Maintainability**: Write clean, documented, testable code
4. **Performance**: Optimize for speed and efficiency
5. **Compatibility**: Support multiple platforms and browsers
6. **Extensibility**: Design for future enhancements

### API Design

- **Consistent**: Use consistent naming and patterns
- **Documented**: Provide comprehensive documentation
- **Versioned**: Support backward compatibility
- **Typed**: Use type hints and interfaces
- **Tested**: Include comprehensive test coverage

## 🚀 Release Process

### Version Numbers

We use [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

- [ ] Version number updated
- [ ] Changelog updated
- [ ] Documentation updated
- [ ] Tests passing
- [ ] Security review completed
- [ ] Performance benchmarks run
- [ ] Breaking changes documented

## 📞 Getting Help

### Community Resources

- **GitHub Discussions**: Ask questions and share ideas
- **Issues**: Report bugs and request features
- **Documentation**: Check existing docs first
- **Examples**: Look at example implementations

### Contact Information

- **General Questions**: GitHub Discussions
- **Bug Reports**: GitHub Issues
- **Security Issues**: security@promptcraft.dev
- **Maintainers**: @maintainer1, @maintainer2

## 🙏 Recognition

Contributors are recognized in:

- **README**: Major contributors listed
- **CONTRIBUTORS**: Complete contributor list
- **Release Notes**: Contribution acknowledgments
- **Code Comments**: Credit for significant contributions

### Contributor Levels

- **Core Maintainer**: Full repository access
- **Regular Contributor**: Recognized contributor with multiple merged PRs
- **Contributor**: Anyone with merged contributions
- **Community Member**: Participants in discussions and issues

Thank you for contributing to PromptCraft! Your contributions help make AI interactions better for everyone. 🚀