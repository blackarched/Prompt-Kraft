# HTTPS and Secure Context Guide for PromptCraft

This guide provides comprehensive instructions for implementing HTTPS and ensuring secure context requirements for PromptCraft deployments.

## 🔒 Why HTTPS is Required

### Secure Context Requirements
Many modern web APIs require a **secure context** (HTTPS) to function:

- **Clipboard API**: `navigator.clipboard.writeText()` requires HTTPS
- **Service Workers**: Only available over HTTPS
- **Geolocation API**: Requires secure context
- **Camera/Microphone**: Media APIs need HTTPS
- **Push Notifications**: Service worker dependent
- **Web Crypto API**: Cryptographic operations require secure context

### PromptCraft Specific Requirements
```typescript
// ❌ This will fail over HTTP
await navigator.clipboard.writeText(enhancedPrompt)

// ✅ This works over HTTPS
if (navigator.clipboard && window.isSecureContext) {
  await navigator.clipboard.writeText(enhancedPrompt)
}
```

## 🚀 HTTPS Implementation Guide

### 1. Development Environment

#### Local HTTPS Setup
```bash
# Generate self-signed certificates for development
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Update your development server
npm run dev -- --https --cert cert.pem --key key.pem
```

#### Vite HTTPS Configuration
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import fs from 'fs'

export default defineConfig({
  server: {
    https: {
      key: fs.readFileSync('key.pem'),
      cert: fs.readFileSync('cert.pem'),
    },
    port: 3000,
    host: true
  },
  preview: {
    https: {
      key: fs.readFileSync('key.pem'),
      cert: fs.readFileSync('cert.pem'),
    },
    port: 4173
  }
})
```

#### mkcert for Trusted Local Certificates
```bash
# Install mkcert
brew install mkcert  # macOS
# or
choco install mkcert  # Windows
# or
apt install libnss3-tools && wget -O mkcert https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64 && chmod +x mkcert

# Create local CA
mkcert -install

# Generate certificates
mkcert localhost 127.0.0.1 ::1

# Use in Vite
mv localhost+2.pem cert.pem
mv localhost+2-key.pem key.pem
```

### 2. Production HTTPS Setup

#### Let's Encrypt with Certbot
```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Nginx Configuration
```nginx
# /etc/nginx/sites-available/promptcraft
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    
    # Security Headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # CSP Header (will be overridden by application)
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;" always;

    # Application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static assets with caching
    location /assets/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Apache Configuration
```apache
# /etc/apache2/sites-available/promptcraft-ssl.conf
<VirtualHost *:443>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/yourdomain.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/yourdomain.com/privkey.pem
    
    # Modern SSL settings
    SSLProtocol all -SSLv3 -TLSv1 -TLSv1.1
    SSLCipherSuite ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384
    SSLHonorCipherOrder off
    SSLSessionTickets off
    
    # Security Headers
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    Header always set X-Frame-Options DENY
    Header always set X-Content-Type-Options nosniff
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    
    # Proxy to application
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
</VirtualHost>

# Redirect HTTP to HTTPS
<VirtualHost *:80>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    Redirect permanent / https://yourdomain.com/
</VirtualHost>
```

### 3. Cloud Platform HTTPS

#### Vercel
```json
// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "http://yourdomain.com/(.*)",
      "destination": "https://yourdomain.com/$1",
      "permanent": true
    }
  ]
}
```

#### Netlify
```toml
# netlify.toml
[[headers]]
  for = "/*"
  [headers.values]
    Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[redirects]]
  from = "http://yourdomain.com/*"
  to = "https://yourdomain.com/:splat"
  status = 301
  force = true
```

#### AWS CloudFront
```yaml
# cloudformation.yaml
Resources:
  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        ViewerProtocolPolicy: redirect-to-https
        MinimumProtocolVersion: TLSv1.2_2021
        ResponseHeadersPolicy:
          ResponseHeadersPolicyConfig:
            SecurityHeadersConfig:
              StrictTransportSecurity:
                AccessControlMaxAgeSec: 31536000
                IncludeSubdomains: true
                Preload: true
              ContentTypeOptions:
                Override: true
              FrameOptions:
                FrameOption: DENY
                Override: true
              ReferrerPolicy:
                ReferrerPolicy: strict-origin-when-cross-origin
                Override: true
```

### 4. Docker HTTPS Setup

#### Dockerfile with HTTPS
```dockerfile
FROM node:18-alpine

# Install certificates
RUN apk add --no-cache ca-certificates

WORKDIR /app

# Copy SSL certificates
COPY certs/ /app/certs/

# Copy application
COPY . .

# Install dependencies
RUN npm ci --only=production

# Expose HTTPS port
EXPOSE 443

# Start with HTTPS
CMD ["node", "server.js", "--https", "--cert", "/app/certs/cert.pem", "--key", "/app/certs/key.pem"]
```

#### Docker Compose with Reverse Proxy
```yaml
# docker-compose.yml
version: '3.8'

services:
  promptcraft:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    networks:
      - promptcraft-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - promptcraft
    networks:
      - promptcraft-network

networks:
  promptcraft-network:
    driver: bridge
```

## 🔧 Secure Context Detection

### Client-Side Detection
```typescript
// src/utils/secureContext.ts
export class SecureContextManager {
  /**
   * Check if running in secure context
   */
  static isSecureContext(): boolean {
    return window.isSecureContext || location.protocol === 'https:'
  }

  /**
   * Check if specific APIs are available
   */
  static hasClipboardAPI(): boolean {
    return this.isSecureContext() && 'clipboard' in navigator
  }

  /**
   * Check if service workers are available
   */
  static hasServiceWorker(): boolean {
    return this.isSecureContext() && 'serviceWorker' in navigator
  }

  /**
   * Get secure context status
   */
  static getSecurityStatus(): {
    isSecure: boolean
    protocol: string
    clipboardAvailable: boolean
    serviceWorkerAvailable: boolean
    warnings: string[]
  } {
    const isSecure = this.isSecureContext()
    const warnings: string[] = []

    if (!isSecure) {
      warnings.push('Application is not running in a secure context (HTTPS)')
      warnings.push('Clipboard API will not be available')
      warnings.push('Some features may be limited')
    }

    return {
      isSecure,
      protocol: location.protocol,
      clipboardAvailable: this.hasClipboardAPI(),
      serviceWorkerAvailable: this.hasServiceWorker(),
      warnings
    }
  }

  /**
   * Show security warnings to user
   */
  static showSecurityWarnings(): void {
    const status = this.getSecurityStatus()
    
    if (!status.isSecure && process.env.NODE_ENV === 'production') {
      console.warn('⚠️ PromptCraft Security Warning:', status.warnings)
      
      // Show user-friendly warning
      const warningDiv = document.createElement('div')
      warningDiv.innerHTML = `
        <div style="
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          color: #856404;
          padding: 12px;
          border-radius: 4px;
          margin: 10px;
          font-size: 14px;
        ">
          <strong>⚠️ Security Notice:</strong> This site is not using HTTPS. 
          Some features like clipboard copying may not work. 
          <a href="https://${location.host}${location.pathname}" style="color: #856404;">
            Switch to HTTPS
          </a>
        </div>
      `
      document.body.insertBefore(warningDiv, document.body.firstChild)
    }
  }
}

// Auto-check on load
if (typeof window !== 'undefined') {
  SecureContextManager.showSecurityWarnings()
}
```

### Enhanced Clipboard Manager
```typescript
// src/utils/clipboard.ts
export class SecureClipboard {
  /**
   * Safely copy text to clipboard with fallbacks
   */
  static async copyText(text: string): Promise<boolean> {
    // Modern Clipboard API (requires HTTPS)
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text)
        return true
      } catch (error) {
        console.warn('Clipboard API failed:', error)
        return this.fallbackCopy(text)
      }
    }

    // Fallback for non-secure contexts
    return this.fallbackCopy(text)
  }

  /**
   * Fallback copy method for non-secure contexts
   */
  private static fallbackCopy(text: string): boolean {
    try {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      const result = document.execCommand('copy')
      document.body.removeChild(textArea)
      
      return result
    } catch (error) {
      console.error('Fallback copy failed:', error)
      return false
    }
  }

  /**
   * Show copy result to user
   */
  static showCopyResult(success: boolean, isSecure: boolean): void {
    const message = success 
      ? '✅ Copied to clipboard!'
      : isSecure 
        ? '❌ Failed to copy to clipboard'
        : '⚠️ Copied using fallback method (consider using HTTPS)'

    // Show toast notification
    this.showToast(message, success ? 'success' : 'warning')
  }

  private static showToast(message: string, type: 'success' | 'warning' | 'error'): void {
    const toast = document.createElement('div')
    toast.textContent = message
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      border-radius: 4px;
      color: white;
      font-size: 14px;
      z-index: 10000;
      animation: slideIn 0.3s ease;
      background: ${type === 'success' ? '#28a745' : type === 'warning' ? '#ffc107' : '#dc3545'};
    `

    document.body.appendChild(toast)

    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease'
      setTimeout(() => document.body.removeChild(toast), 300)
    }, 3000)
  }
}
```

## 🔍 HTTPS Testing and Validation

### SSL/TLS Testing Script
```bash
#!/bin/bash
# test-https.sh - HTTPS configuration testing

DOMAIN="yourdomain.com"

echo "🔍 Testing HTTPS configuration for $DOMAIN"

# Test SSL certificate
echo "📜 SSL Certificate Information:"
openssl s_client -connect $DOMAIN:443 -servername $DOMAIN < /dev/null 2>/dev/null | openssl x509 -noout -dates -subject -issuer

# Test SSL Labs rating
echo "🏆 SSL Labs Rating:"
curl -s "https://api.ssllabs.com/api/v3/analyze?host=$DOMAIN&publish=off&all=done" | jq -r '.endpoints[0].grade'

# Test security headers
echo "🛡️ Security Headers:"
curl -I -s https://$DOMAIN | grep -E "(Strict-Transport-Security|X-Frame-Options|X-Content-Type-Options|Content-Security-Policy)"

# Test HTTP to HTTPS redirect
echo "🔄 HTTP Redirect Test:"
curl -I -s http://$DOMAIN | grep -E "(Location|301|302)"

# Test modern TLS
echo "🔐 TLS Version Support:"
for version in tls1 tls1_1 tls1_2 tls1_3; do
    if openssl s_client -connect $DOMAIN:443 -$version < /dev/null 2>/dev/null | grep -q "Verify return code: 0"; then
        echo "  ✅ $version supported"
    else
        echo "  ❌ $version not supported"
    fi
done

echo "✅ HTTPS testing complete"
```

### Automated HTTPS Monitoring
```typescript
// src/monitoring/httpsMonitor.ts
export class HTTPSMonitor {
  private static checkInterval: number = 300000 // 5 minutes

  /**
   * Start monitoring HTTPS status
   */
  static startMonitoring(): void {
    this.checkHTTPSStatus()
    setInterval(() => this.checkHTTPSStatus(), this.checkInterval)
  }

  /**
   * Check current HTTPS status
   */
  private static async checkHTTPSStatus(): Promise<void> {
    const status = {
      timestamp: new Date().toISOString(),
      isSecure: window.isSecureContext,
      protocol: location.protocol,
      host: location.host,
      userAgent: navigator.userAgent,
      clipboardAPI: 'clipboard' in navigator,
      serviceWorker: 'serviceWorker' in navigator
    }

    // Log to monitoring service
    this.logSecurityStatus(status)

    // Alert if not secure in production
    if (!status.isSecure && process.env.NODE_ENV === 'production') {
      this.alertInsecureConnection(status)
    }
  }

  private static logSecurityStatus(status: any): void {
    // Send to monitoring service
    if (process.env.MONITORING_ENDPOINT) {
      fetch(process.env.MONITORING_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'https_status', data: status })
      }).catch(console.error)
    }

    console.log('HTTPS Status:', status)
  }

  private static alertInsecureConnection(status: any): void {
    // Alert security team
    console.error('🚨 INSECURE CONNECTION DETECTED:', status)
    
    // Could integrate with alerting systems
    // - Slack webhook
    // - PagerDuty
    // - Email alerts
  }
}

// Auto-start monitoring
if (typeof window !== 'undefined') {
  HTTPSMonitor.startMonitoring()
}
```

## 📋 HTTPS Deployment Checklist

### Pre-Deployment
- [ ] SSL certificate obtained and installed
- [ ] Certificate auto-renewal configured
- [ ] HTTP to HTTPS redirects configured
- [ ] Security headers implemented
- [ ] HSTS preload submitted (optional)

### Testing
- [ ] SSL Labs test passes (A+ rating)
- [ ] All pages load over HTTPS
- [ ] Mixed content warnings resolved
- [ ] Clipboard API works correctly
- [ ] Service workers function properly

### Monitoring
- [ ] Certificate expiration monitoring
- [ ] HTTPS status monitoring
- [ ] Security header validation
- [ ] Performance impact assessment

### Documentation
- [ ] Deployment procedures documented
- [ ] Certificate renewal process documented
- [ ] Troubleshooting guide created
- [ ] Team training completed

## 🚨 Common Issues and Solutions

### Mixed Content Warnings
```javascript
// Fix mixed content by ensuring all resources use HTTPS
// ❌ Problematic
<script src="http://example.com/script.js"></script>

// ✅ Fixed
<script src="https://example.com/script.js"></script>
// or use protocol-relative URLs
<script src="//example.com/script.js"></script>
```

### Certificate Chain Issues
```bash
# Test certificate chain
openssl s_client -connect yourdomain.com:443 -showcerts

# Fix incomplete chain
cat yourdomain.com.crt intermediate.crt > fullchain.pem
```

### HSTS Preload Issues
```nginx
# Ensure HSTS header is correct for preload
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

This comprehensive HTTPS guide ensures PromptCraft runs securely with all modern web APIs functioning correctly.