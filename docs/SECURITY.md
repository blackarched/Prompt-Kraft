# Security Guide for PromptCraft

This document provides comprehensive guidance on secure deployment and secret management for PromptCraft applications.

## 🔒 Secret Management

### Environment Variables vs Secret Stores

**❌ DON'T:** Store secrets in `.env` files in production
```bash
# .env - NEVER do this in production
API_KEY=sk-1234567890abcdef
DATABASE_PASSWORD=supersecret123
```

**✅ DO:** Use dedicated secret management services

#### 1. AWS Secrets Manager

```python
import boto3
import json
from botocore.exceptions import ClientError

def get_secret(secret_name, region_name="us-east-1"):
    """Retrieve secret from AWS Secrets Manager."""
    session = boto3.session.Session()
    client = session.client(
        service_name='secretsmanager',
        region_name=region_name
    )
    
    try:
        get_secret_value_response = client.get_secret_value(
            SecretId=secret_name
        )
        secret = get_secret_value_response['SecretString']
        return json.loads(secret)
    except ClientError as e:
        raise e

# Usage in your application
try:
    secrets = get_secret("promptcraft/production")
    api_key = secrets['api_key']
    db_password = secrets['database_password']
except Exception as e:
    logger.error(f"Failed to retrieve secrets: {e}")
    sys.exit(1)
```

#### 2. HashiCorp Vault

```python
import hvac
import os

def get_vault_secrets(vault_url, vault_token, secret_path):
    """Retrieve secrets from HashiCorp Vault."""
    client = hvac.Client(url=vault_url, token=vault_token)
    
    if not client.is_authenticated():
        raise Exception("Vault authentication failed")
    
    try:
        response = client.secrets.kv.v2.read_secret_version(
            path=secret_path
        )
        return response['data']['data']
    except Exception as e:
        raise Exception(f"Failed to read secret: {e}")

# Usage
vault_url = os.getenv('VAULT_ADDR')
vault_token = os.getenv('VAULT_TOKEN')  # From service auth, not hardcoded
secrets = get_vault_secrets(vault_url, vault_token, 'promptcraft/config')
```

#### 3. Azure Key Vault

```python
from azure.keyvault.secrets import SecretClient
from azure.identity import DefaultAzureCredential

def get_azure_secret(vault_url, secret_name):
    """Retrieve secret from Azure Key Vault."""
    credential = DefaultAzureCredential()
    client = SecretClient(vault_url=vault_url, credential=credential)
    
    try:
        secret = client.get_secret(secret_name)
        return secret.value
    except Exception as e:
        raise Exception(f"Failed to retrieve secret: {e}")

# Usage
vault_url = "https://your-keyvault.vault.azure.net/"
api_key = get_azure_secret(vault_url, "promptcraft-api-key")
```

#### 4. Google Secret Manager

```python
from google.cloud import secretmanager

def get_google_secret(project_id, secret_id, version_id="latest"):
    """Retrieve secret from Google Secret Manager."""
    client = secretmanager.SecretManagerServiceClient()
    name = f"projects/{project_id}/secrets/{secret_id}/versions/{version_id}"
    
    try:
        response = client.access_secret_version(request={"name": name})
        return response.payload.data.decode("UTF-8")
    except Exception as e:
        raise Exception(f"Failed to retrieve secret: {e}")

# Usage
project_id = "your-gcp-project"
api_key = get_google_secret(project_id, "promptcraft-api-key")
```

### Kubernetes Secrets

```yaml
# k8s-secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: promptcraft-secrets
  namespace: production
type: Opaque
data:
  api-key: <base64-encoded-value>
  db-password: <base64-encoded-value>
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: promptcraft
spec:
  template:
    spec:
      containers:
      - name: promptcraft
        image: promptcraft:latest
        env:
        - name: API_KEY
          valueFrom:
            secretKeyRef:
              name: promptcraft-secrets
              key: api-key
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: promptcraft-secrets
              key: db-password
```

### Docker Secrets

```yaml
# docker-compose.yml
version: '3.8'
services:
  promptcraft:
    image: promptcraft:latest
    secrets:
      - api_key
      - db_password
    environment:
      - API_KEY_FILE=/run/secrets/api_key
      - DB_PASSWORD_FILE=/run/secrets/db_password

secrets:
  api_key:
    external: true
  db_password:
    external: true
```

```python
# Reading Docker secrets in Python
def read_secret_file(secret_path):
    """Read secret from Docker secrets file."""
    try:
        with open(secret_path, 'r') as f:
            return f.read().strip()
    except FileNotFoundError:
        return None

# Usage
api_key = read_secret_file('/run/secrets/api_key')
if not api_key:
    api_key = os.getenv('API_KEY')  # Fallback to env var
```

## 🔐 Security Best Practices

### 1. Environment Separation

```python
# secure_config.py
import os
from typing import Dict, Any

class SecureConfig:
    def __init__(self):
        self.env = os.getenv('PROMPTCRAFT_ENV', 'development')
        self._secrets_cache = {}
        
    def get_config(self) -> Dict[str, Any]:
        """Get configuration based on environment."""
        if self.env == 'production':
            return self._get_production_config()
        elif self.env == 'staging':
            return self._get_staging_config()
        else:
            return self._get_development_config()
    
    def _get_production_config(self) -> Dict[str, Any]:
        """Production configuration with secret store integration."""
        return {
            'api_key': self._get_secret('api_key'),
            'database_url': self._get_secret('database_url'),
            'debug': False,
            'log_level': 'WARNING'
        }
    
    def _get_secret(self, key: str) -> str:
        """Retrieve secret with caching."""
        if key not in self._secrets_cache:
            # Implement your secret store logic here
            self._secrets_cache[key] = self._fetch_from_secret_store(key)
        return self._secrets_cache[key]
```

### 2. Input Validation & Sanitization

```python
import re
import html
from typing import Optional

class SecurityValidator:
    """Enhanced security validation for PromptCraft."""
    
    # Patterns for detecting potential security issues
    SUSPICIOUS_PATTERNS = [
        r'<script[^>]*>.*?</script>',  # XSS attempts
        r'javascript:',                # JavaScript URLs
        r'data:text/html',            # Data URLs
        r'vbscript:',                 # VBScript
        r'on\w+\s*=',                 # Event handlers
    ]
    
    SQL_INJECTION_PATTERNS = [
        r'(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION)\b)',
        r'(--|#|/\*|\*/)',
        r'(\b(OR|AND)\b.*=.*)',
    ]
    
    @classmethod
    def validate_prompt(cls, prompt: str) -> tuple[bool, Optional[str]]:
        """Validate prompt for security issues."""
        if not prompt or len(prompt.strip()) == 0:
            return False, "Prompt cannot be empty"
        
        if len(prompt) > 50000:  # Reasonable limit
            return False, "Prompt exceeds maximum length"
        
        # Check for suspicious patterns
        for pattern in cls.SUSPICIOUS_PATTERNS:
            if re.search(pattern, prompt, re.IGNORECASE):
                return False, f"Potentially malicious content detected"
        
        # Check for SQL injection attempts
        for pattern in cls.SQL_INJECTION_PATTERNS:
            if re.search(pattern, prompt, re.IGNORECASE):
                return False, "Potential SQL injection attempt detected"
        
        return True, None
    
    @classmethod
    def sanitize_output(cls, output: str) -> str:
        """Sanitize output for safe display."""
        # HTML escape
        sanitized = html.escape(output)
        
        # Remove any remaining script tags
        sanitized = re.sub(r'<script[^>]*>.*?</script>', '', sanitized, flags=re.IGNORECASE | re.DOTALL)
        
        return sanitized

# Usage in prompt_craft.py
def enhance_prompt_secure(config: Dict[str, Any], user_input: str, model: str) -> Tuple[str, str]:
    """Enhanced prompt function with security validation."""
    
    # Validate input
    is_valid, error_msg = SecurityValidator.validate_prompt(user_input)
    if not is_valid:
        raise ValidationError(f"Security validation failed: {error_msg}")
    
    # Process normally
    enhanced, template_name = enhance_prompt(config, user_input, model)
    
    # Sanitize output
    enhanced = SecurityValidator.sanitize_output(enhanced)
    
    return enhanced, template_name
```

### 3. Secure Logging

```python
import logging
import re
from typing import Any

class SecureFormatter(logging.Formatter):
    """Custom formatter that redacts sensitive information."""
    
    SENSITIVE_PATTERNS = [
        (r'(api[_-]?key["\']?\s*[:=]\s*["\']?)([^"\'\\s]+)', r'\1***REDACTED***'),
        (r'(password["\']?\s*[:=]\s*["\']?)([^"\'\\s]+)', r'\1***REDACTED***'),
        (r'(token["\']?\s*[:=]\s*["\']?)([^"\'\\s]+)', r'\1***REDACTED***'),
        (r'(secret["\']?\s*[:=]\s*["\']?)([^"\'\\s]+)', r'\1***REDACTED***'),
    ]
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record with sensitive data redaction."""
        formatted = super().format(record)
        
        for pattern, replacement in self.SENSITIVE_PATTERNS:
            formatted = re.sub(pattern, replacement, formatted, flags=re.IGNORECASE)
        
        return formatted

# Setup secure logging
def setup_secure_logging():
    """Configure secure logging with sensitive data redaction."""
    logger = logging.getLogger('promptcraft')
    handler = logging.StreamHandler()
    handler.setFormatter(SecureFormatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    ))
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    return logger
```

### 4. Rate Limiting

```python
import time
from collections import defaultdict, deque
from typing import Dict

class RateLimiter:
    """Simple rate limiter for API protection."""
    
    def __init__(self, max_requests: int = 100, window_seconds: int = 3600):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: Dict[str, deque] = defaultdict(deque)
    
    def is_allowed(self, identifier: str) -> bool:
        """Check if request is allowed for given identifier."""
        now = time.time()
        window_start = now - self.window_seconds
        
        # Clean old requests
        user_requests = self.requests[identifier]
        while user_requests and user_requests[0] < window_start:
            user_requests.popleft()
        
        # Check if under limit
        if len(user_requests) >= self.max_requests:
            return False
        
        # Add current request
        user_requests.append(now)
        return True

# Usage in web application
rate_limiter = RateLimiter(max_requests=50, window_seconds=3600)

def enhance_with_rate_limit(user_id: str, prompt: str) -> str:
    """Enhance prompt with rate limiting."""
    if not rate_limiter.is_allowed(user_id):
        raise Exception("Rate limit exceeded. Please try again later.")
    
    return enhance_prompt_secure(config, prompt, model)
```

## 🛡️ Deployment Security Checklist

### Production Deployment

- [ ] **Secrets Management**
  - [ ] All secrets stored in dedicated secret management service
  - [ ] No hardcoded secrets in code or configuration files
  - [ ] Regular secret rotation implemented
  - [ ] Least privilege access to secrets

- [ ] **Environment Security**
  - [ ] Environment variables properly scoped
  - [ ] Production environment isolated from development
  - [ ] Debug mode disabled in production
  - [ ] Sensitive logging disabled

- [ ] **Network Security**
  - [ ] HTTPS/TLS encryption enabled
  - [ ] Certificate management automated
  - [ ] Network segmentation implemented
  - [ ] Firewall rules configured

- [ ] **Application Security**
  - [ ] Input validation enabled
  - [ ] Output sanitization implemented
  - [ ] Rate limiting configured
  - [ ] Security headers set

- [ ] **Monitoring & Auditing**
  - [ ] Security event logging enabled
  - [ ] Anomaly detection configured
  - [ ] Regular security scans scheduled
  - [ ] Incident response plan documented

### Container Security

```dockerfile
# Dockerfile with security best practices
FROM python:3.11-slim as builder

# Create non-root user
RUN groupadd -r promptcraft && useradd -r -g promptcraft promptcraft

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.11-slim

# Copy user from builder
COPY --from=builder /etc/passwd /etc/passwd
COPY --from=builder /etc/group /etc/group

# Install only runtime dependencies
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages

# Copy application
COPY --chown=promptcraft:promptcraft . /app
WORKDIR /app

# Remove unnecessary packages
RUN apt-get update && apt-get remove -y \
    curl wget git && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*

# Switch to non-root user
USER promptcraft

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD python -c "import prompt_craft; print('OK')" || exit 1

EXPOSE 8000
CMD ["python", "prompt_craft.py"]
```

## 📋 Security Incident Response

### 1. Incident Detection
```python
# security_monitor.py
import logging
from typing import Dict, Any

class SecurityMonitor:
    """Monitor for security incidents."""
    
    def __init__(self):
        self.logger = logging.getLogger('security')
    
    def log_security_event(self, event_type: str, details: Dict[str, Any]):
        """Log security event for monitoring."""
        self.logger.warning(f"SECURITY_EVENT: {event_type}", extra={
            'event_type': event_type,
            'details': details,
            'timestamp': time.time()
        })
    
    def check_suspicious_activity(self, user_input: str, user_id: str):
        """Check for suspicious activity patterns."""
        suspicious_indicators = [
            len(user_input) > 10000,  # Unusually long input
            any(pattern in user_input.lower() for pattern in ['<script', 'javascript:', 'eval(']),
            user_input.count('\n') > 100,  # Too many newlines
        ]
        
        if any(suspicious_indicators):
            self.log_security_event('SUSPICIOUS_INPUT', {
                'user_id': user_id,
                'input_length': len(user_input),
                'indicators': suspicious_indicators
            })
```

### 2. Automated Response
```python
def automated_security_response(event_type: str, user_id: str):
    """Automated response to security events."""
    if event_type == 'SUSPICIOUS_INPUT':
        # Temporarily rate limit user
        rate_limiter.block_user(user_id, duration=3600)
        
        # Alert security team
        send_security_alert(f"Suspicious activity from user {user_id}")
        
    elif event_type == 'RATE_LIMIT_EXCEEDED':
        # Extended rate limiting
        rate_limiter.block_user(user_id, duration=7200)
```

## 🔍 Security Testing

### Unit Tests for Security
```python
# tests/test_security.py
import pytest
from prompt_craft import SecurityValidator, ValidationError

class TestSecurityValidation:
    
    def test_xss_detection(self):
        """Test XSS attempt detection."""
        malicious_input = "<script>alert('xss')</script>"
        is_valid, error = SecurityValidator.validate_prompt(malicious_input)
        assert not is_valid
        assert "malicious content" in error.lower()
    
    def test_sql_injection_detection(self):
        """Test SQL injection attempt detection."""
        malicious_input = "'; DROP TABLE users; --"
        is_valid, error = SecurityValidator.validate_prompt(malicious_input)
        assert not is_valid
        assert "sql injection" in error.lower()
    
    def test_output_sanitization(self):
        """Test output sanitization."""
        dangerous_output = "<script>alert('xss')</script>Hello"
        sanitized = SecurityValidator.sanitize_output(dangerous_output)
        assert "<script>" not in sanitized
        assert "Hello" in sanitized
```

This comprehensive security guide ensures that PromptCraft deployments follow security best practices and protect against common vulnerabilities.