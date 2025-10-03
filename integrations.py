#!/usr/bin/env python3
"""
PromptCraft Integrations
Third-party service integrations for PromptCraft
"""

import os
import json
import time
import asyncio
from datetime import datetime
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass
import logging
import requests
from urllib.parse import urljoin

from prompt_craft import enhance_prompt, load_config, PromptCraftError

logger = logging.getLogger('promptcraft.integrations')

@dataclass
class IntegrationConfig:
    """Configuration for third-party integrations"""
    name: str
    enabled: bool
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None

class BaseIntegration:
    """Base class for all integrations"""
    
    def __init__(self, config: IntegrationConfig):
        self.config = config
        self.name = config.name
        self.enabled = config.enabled
    
    async def send_prompt(self, enhanced_prompt: str, original_prompt: str, 
                         template: str, model: str, metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        """Send enhanced prompt to the integration"""
        raise NotImplementedError
    
    def validate_config(self) -> bool:
        """Validate integration configuration"""
        return self.enabled and bool(self.config.api_key)

class SlackIntegration(BaseIntegration):
    """Slack integration for sending enhanced prompts"""
    
    def __init__(self, config: IntegrationConfig):
        super().__init__(config)
        self.webhook_url = config.settings.get('webhook_url') if config.settings else None
        self.channel = config.settings.get('channel', '#general') if config.settings else '#general'
    
    async def send_prompt(self, enhanced_prompt: str, original_prompt: str,
                         template: str, model: str, metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        """Send enhanced prompt to Slack"""
        if not self.validate_config():
            raise PromptCraftError("Slack integration not properly configured")
        
        # Create Slack message
        message = {
            "channel": self.channel,
            "username": "PromptCraft",
            "icon_emoji": ":robot_face:",
            "attachments": [
                {
                    "color": "good",
                    "title": f"Enhanced Prompt - {template}",
                    "fields": [
                        {
                            "title": "Original Prompt",
                            "value": f"```{original_prompt[:500]}{'...' if len(original_prompt) > 500 else ''}```",
                            "short": False
                        },
                        {
                            "title": "Enhanced Prompt",
                            "value": f"```{enhanced_prompt[:1000]}{'...' if len(enhanced_prompt) > 1000 else ''}```",
                            "short": False
                        },
                        {
                            "title": "Template",
                            "value": template,
                            "short": True
                        },
                        {
                            "title": "Model",
                            "value": model,
                            "short": True
                        }
                    ],
                    "footer": "PromptCraft",
                    "ts": int(time.time())
                }
            ]
        }
        
        try:
            response = requests.post(
                self.webhook_url,
                json=message,
                timeout=30
            )
            response.raise_for_status()
            
            return {
                "success": True,
                "message": "Sent to Slack successfully",
                "channel": self.channel
            }
            
        except Exception as e:
            logger.error(f"Failed to send to Slack: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def validate_config(self) -> bool:
        """Validate Slack configuration"""
        return self.enabled and bool(self.webhook_url)

class DiscordIntegration(BaseIntegration):
    """Discord integration for sending enhanced prompts"""
    
    def __init__(self, config: IntegrationConfig):
        super().__init__(config)
        self.webhook_url = config.settings.get('webhook_url') if config.settings else None
    
    async def send_prompt(self, enhanced_prompt: str, original_prompt: str,
                         template: str, model: str, metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        """Send enhanced prompt to Discord"""
        if not self.validate_config():
            raise PromptCraftError("Discord integration not properly configured")
        
        # Create Discord embed
        embed = {
            "title": f"🚀 Enhanced Prompt - {template}",
            "color": 65535,  # Cyan color
            "fields": [
                {
                    "name": "📝 Original Prompt",
                    "value": f"```{original_prompt[:500]}{'...' if len(original_prompt) > 500 else ''}```",
                    "inline": False
                },
                {
                    "name": "✨ Enhanced Prompt",
                    "value": f"```{enhanced_prompt[:1000]}{'...' if len(enhanced_prompt) > 1000 else ''}```",
                    "inline": False
                },
                {
                    "name": "🎯 Template",
                    "value": template,
                    "inline": True
                },
                {
                    "name": "🤖 Model",
                    "value": model,
                    "inline": True
                }
            ],
            "footer": {
                "text": "PromptCraft Neural Enhancement System"
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
        message = {
            "embeds": [embed]
        }
        
        try:
            response = requests.post(
                self.webhook_url,
                json=message,
                timeout=30
            )
            response.raise_for_status()
            
            return {
                "success": True,
                "message": "Sent to Discord successfully"
            }
            
        except Exception as e:
            logger.error(f"Failed to send to Discord: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def validate_config(self) -> bool:
        """Validate Discord configuration"""
        return self.enabled and bool(self.webhook_url)

class WebhookIntegration(BaseIntegration):
    """Generic webhook integration"""
    
    def __init__(self, config: IntegrationConfig):
        super().__init__(config)
        self.webhook_url = config.settings.get('webhook_url') if config.settings else None
        self.headers = config.settings.get('headers', {}) if config.settings else {}
        self.method = config.settings.get('method', 'POST').upper() if config.settings else 'POST'
    
    async def send_prompt(self, enhanced_prompt: str, original_prompt: str,
                         template: str, model: str, metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        """Send enhanced prompt via webhook"""
        if not self.validate_config():
            raise PromptCraftError("Webhook integration not properly configured")
        
        payload = {
            "timestamp": datetime.utcnow().isoformat(),
            "original_prompt": original_prompt,
            "enhanced_prompt": enhanced_prompt,
            "template": template,
            "model": model,
            "metadata": metadata or {}
        }
        
        try:
            if self.method == 'POST':
                response = requests.post(
                    self.webhook_url,
                    json=payload,
                    headers=self.headers,
                    timeout=30
                )
            elif self.method == 'PUT':
                response = requests.put(
                    self.webhook_url,
                    json=payload,
                    headers=self.headers,
                    timeout=30
                )
            else:
                raise ValueError(f"Unsupported HTTP method: {self.method}")
            
            response.raise_for_status()
            
            return {
                "success": True,
                "message": "Webhook sent successfully",
                "status_code": response.status_code,
                "response": response.text[:500] if response.text else None
            }
            
        except Exception as e:
            logger.error(f"Failed to send webhook: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def validate_config(self) -> bool:
        """Validate webhook configuration"""
        return self.enabled and bool(self.webhook_url)

class EmailIntegration(BaseIntegration):
    """Email integration using SMTP"""
    
    def __init__(self, config: IntegrationConfig):
        super().__init__(config)
        self.smtp_server = config.settings.get('smtp_server') if config.settings else None
        self.smtp_port = config.settings.get('smtp_port', 587) if config.settings else 587
        self.username = config.settings.get('username') if config.settings else None
        self.password = config.settings.get('password') if config.settings else None
        self.from_email = config.settings.get('from_email') if config.settings else None
        self.to_emails = config.settings.get('to_emails', []) if config.settings else []
    
    async def send_prompt(self, enhanced_prompt: str, original_prompt: str,
                         template: str, model: str, metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        """Send enhanced prompt via email"""
        if not self.validate_config():
            raise PromptCraftError("Email integration not properly configured")
        
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            
            # Create email message
            msg = MIMEMultipart()
            msg['From'] = self.from_email
            msg['To'] = ', '.join(self.to_emails)
            msg['Subject'] = f"PromptCraft Enhancement - {template}"
            
            # Create email body
            body = f"""
            PromptCraft Enhanced Prompt
            
            Template: {template}
            Model: {model}
            Timestamp: {datetime.utcnow().isoformat()}
            
            Original Prompt:
            {'-' * 50}
            {original_prompt}
            
            Enhanced Prompt:
            {'-' * 50}
            {enhanced_prompt}
            
            ---
            Generated by PromptCraft Neural Enhancement System
            """
            
            msg.attach(MIMEText(body, 'plain'))
            
            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.username, self.password)
                server.send_message(msg)
            
            return {
                "success": True,
                "message": f"Email sent to {len(self.to_emails)} recipients",
                "recipients": self.to_emails
            }
            
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def validate_config(self) -> bool:
        """Validate email configuration"""
        return (self.enabled and bool(self.smtp_server) and 
                bool(self.username) and bool(self.password) and 
                bool(self.from_email) and bool(self.to_emails))

class DatabaseIntegration(BaseIntegration):
    """Database integration for storing enhanced prompts"""
    
    def __init__(self, config: IntegrationConfig):
        super().__init__(config)
        self.connection_string = config.settings.get('connection_string') if config.settings else None
        self.table_name = config.settings.get('table_name', 'enhanced_prompts') if config.settings else 'enhanced_prompts'
        self.db_type = config.settings.get('db_type', 'sqlite') if config.settings else 'sqlite'
    
    async def send_prompt(self, enhanced_prompt: str, original_prompt: str,
                         template: str, model: str, metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        """Store enhanced prompt in database"""
        if not self.validate_config():
            raise PromptCraftError("Database integration not properly configured")
        
        try:
            if self.db_type.lower() == 'sqlite':
                return await self._store_sqlite(enhanced_prompt, original_prompt, template, model, metadata)
            elif self.db_type.lower() == 'postgresql':
                return await self._store_postgresql(enhanced_prompt, original_prompt, template, model, metadata)
            else:
                raise ValueError(f"Unsupported database type: {self.db_type}")
                
        except Exception as e:
            logger.error(f"Failed to store in database: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _store_sqlite(self, enhanced_prompt: str, original_prompt: str,
                           template: str, model: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Store in SQLite database"""
        import sqlite3
        
        with sqlite3.connect(self.connection_string) as conn:
            # Create table if it doesn't exist
            conn.execute(f'''
                CREATE TABLE IF NOT EXISTS {self.table_name} (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    original_prompt TEXT NOT NULL,
                    enhanced_prompt TEXT NOT NULL,
                    template TEXT NOT NULL,
                    model TEXT NOT NULL,
                    metadata TEXT
                )
            ''')
            
            # Insert record
            conn.execute(f'''
                INSERT INTO {self.table_name}
                (timestamp, original_prompt, enhanced_prompt, template, model, metadata)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                datetime.utcnow().isoformat(),
                original_prompt,
                enhanced_prompt,
                template,
                model,
                json.dumps(metadata) if metadata else None
            ))
            
            conn.commit()
        
        return {
            "success": True,
            "message": "Stored in SQLite database",
            "table": self.table_name
        }
    
    async def _store_postgresql(self, enhanced_prompt: str, original_prompt: str,
                               template: str, model: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Store in PostgreSQL database"""
        try:
            import psycopg2
            from psycopg2.extras import Json
            
            with psycopg2.connect(self.connection_string) as conn:
                with conn.cursor() as cursor:
                    # Create table if it doesn't exist
                    cursor.execute(f'''
                        CREATE TABLE IF NOT EXISTS {self.table_name} (
                            id SERIAL PRIMARY KEY,
                            timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
                            original_prompt TEXT NOT NULL,
                            enhanced_prompt TEXT NOT NULL,
                            template VARCHAR(100) NOT NULL,
                            model VARCHAR(100) NOT NULL,
                            metadata JSONB
                        )
                    ''')
                    
                    # Insert record
                    cursor.execute(f'''
                        INSERT INTO {self.table_name}
                        (original_prompt, enhanced_prompt, template, model, metadata)
                        VALUES (%s, %s, %s, %s, %s)
                    ''', (
                        original_prompt,
                        enhanced_prompt,
                        template,
                        model,
                        Json(metadata) if metadata else None
                    ))
                
                conn.commit()
            
            return {
                "success": True,
                "message": "Stored in PostgreSQL database",
                "table": self.table_name
            }
            
        except ImportError:
            raise PromptCraftError("psycopg2 not installed. Install with: pip install psycopg2-binary")
    
    def validate_config(self) -> bool:
        """Validate database configuration"""
        return self.enabled and bool(self.connection_string)

class IntegrationManager:
    """Manager for all integrations"""
    
    def __init__(self, config_file: Optional[str] = None):
        """Initialize integration manager"""
        self.integrations: Dict[str, BaseIntegration] = {}
        self.config_file = config_file or os.path.join(
            os.path.expanduser(os.getenv('PROMPTCRAFT_CONFIG_DIR', '~/.config/promptcraft')),
            'integrations.json'
        )
        self.load_integrations()
    
    def load_integrations(self):
        """Load integration configurations"""
        if not os.path.exists(self.config_file):
            self._create_default_config()
            return
        
        try:
            with open(self.config_file, 'r') as f:
                config_data = json.load(f)
            
            for name, config in config_data.get('integrations', {}).items():
                integration_config = IntegrationConfig(
                    name=name,
                    enabled=config.get('enabled', False),
                    api_key=config.get('api_key'),
                    base_url=config.get('base_url'),
                    settings=config.get('settings', {})
                )
                
                # Create appropriate integration instance
                if name.lower() == 'slack':
                    self.integrations[name] = SlackIntegration(integration_config)
                elif name.lower() == 'discord':
                    self.integrations[name] = DiscordIntegration(integration_config)
                elif name.lower() == 'webhook':
                    self.integrations[name] = WebhookIntegration(integration_config)
                elif name.lower() == 'email':
                    self.integrations[name] = EmailIntegration(integration_config)
                elif name.lower() == 'database':
                    self.integrations[name] = DatabaseIntegration(integration_config)
                else:
                    logger.warning(f"Unknown integration type: {name}")
            
            logger.info(f"Loaded {len(self.integrations)} integrations")
            
        except Exception as e:
            logger.error(f"Failed to load integrations: {e}")
    
    def _create_default_config(self):
        """Create default integration configuration"""
        default_config = {
            "integrations": {
                "slack": {
                    "enabled": False,
                    "settings": {
                        "webhook_url": "",
                        "channel": "#general"
                    }
                },
                "discord": {
                    "enabled": False,
                    "settings": {
                        "webhook_url": ""
                    }
                },
                "webhook": {
                    "enabled": False,
                    "settings": {
                        "webhook_url": "",
                        "method": "POST",
                        "headers": {
                            "Content-Type": "application/json"
                        }
                    }
                },
                "email": {
                    "enabled": False,
                    "settings": {
                        "smtp_server": "smtp.gmail.com",
                        "smtp_port": 587,
                        "username": "",
                        "password": "",
                        "from_email": "",
                        "to_emails": []
                    }
                },
                "database": {
                    "enabled": False,
                    "settings": {
                        "db_type": "sqlite",
                        "connection_string": "enhanced_prompts.db",
                        "table_name": "enhanced_prompts"
                    }
                }
            }
        }
        
        os.makedirs(os.path.dirname(self.config_file), exist_ok=True)
        with open(self.config_file, 'w') as f:
            json.dump(default_config, f, indent=2)
        
        logger.info(f"Created default integration config at {self.config_file}")
    
    async def send_to_integrations(self, enhanced_prompt: str, original_prompt: str,
                                  template: str, model: str, metadata: Dict[str, Any] = None,
                                  integration_names: Optional[List[str]] = None) -> Dict[str, Any]:
        """Send enhanced prompt to configured integrations"""
        results = {}
        
        # Determine which integrations to use
        if integration_names:
            integrations_to_use = {name: self.integrations[name] 
                                 for name in integration_names 
                                 if name in self.integrations}
        else:
            integrations_to_use = {name: integration 
                                 for name, integration in self.integrations.items() 
                                 if integration.enabled}
        
        # Send to each integration
        for name, integration in integrations_to_use.items():
            try:
                result = await integration.send_prompt(
                    enhanced_prompt, original_prompt, template, model, metadata
                )
                results[name] = result
                
                if result.get('success'):
                    logger.info(f"Successfully sent to {name}")
                else:
                    logger.warning(f"Failed to send to {name}: {result.get('error')}")
                    
            except Exception as e:
                logger.error(f"Error sending to {name}: {e}")
                results[name] = {
                    "success": False,
                    "error": str(e)
                }
        
        return results
    
    def get_enabled_integrations(self) -> List[str]:
        """Get list of enabled integration names"""
        return [name for name, integration in self.integrations.items() 
                if integration.enabled]
    
    def validate_integration(self, name: str) -> bool:
        """Validate a specific integration"""
        if name not in self.integrations:
            return False
        return self.integrations[name].validate_config()
    
    def get_integration_status(self) -> Dict[str, Dict[str, Any]]:
        """Get status of all integrations"""
        status = {}
        for name, integration in self.integrations.items():
            status[name] = {
                "enabled": integration.enabled,
                "configured": integration.validate_config(),
                "type": integration.__class__.__name__
            }
        return status

# Global integration manager instance
integration_manager = None

def get_integration_manager() -> IntegrationManager:
    """Get global integration manager instance"""
    global integration_manager
    if integration_manager is None:
        integration_manager = IntegrationManager()
    return integration_manager

async def send_to_integrations(enhanced_prompt: str, original_prompt: str,
                              template: str, model: str, metadata: Dict[str, Any] = None,
                              integration_names: Optional[List[str]] = None) -> Dict[str, Any]:
    """Convenience function to send to integrations"""
    manager = get_integration_manager()
    return await manager.send_to_integrations(
        enhanced_prompt, original_prompt, template, model, metadata, integration_names
    )

def main():
    """CLI interface for integrations"""
    import argparse
    
    parser = argparse.ArgumentParser(description="PromptCraft Integrations")
    parser.add_argument('--list', action='store_true', help='List all integrations')
    parser.add_argument('--status', action='store_true', help='Show integration status')
    parser.add_argument('--test', type=str, help='Test specific integration')
    parser.add_argument('--config', action='store_true', help='Show config file location')
    
    args = parser.parse_args()
    
    manager = get_integration_manager()
    
    if args.list:
        integrations = manager.get_enabled_integrations()
        print("Enabled integrations:")
        for name in integrations:
            print(f"  - {name}")
    
    if args.status:
        status = manager.get_integration_status()
        print("Integration status:")
        for name, info in status.items():
            enabled = "✅" if info['enabled'] else "❌"
            configured = "✅" if info['configured'] else "❌"
            print(f"  {name}: {enabled} enabled, {configured} configured ({info['type']})")
    
    if args.test:
        if args.test in manager.integrations:
            print(f"Testing {args.test} integration...")
            # This would require async context, simplified for CLI
            print("Test functionality not implemented in CLI mode")
        else:
            print(f"Integration '{args.test}' not found")
    
    if args.config:
        print(f"Configuration file: {manager.config_file}")

if __name__ == "__main__":
    main()