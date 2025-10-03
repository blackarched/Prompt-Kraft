#!/usr/bin/env python3
"""
PromptCraft API Server
Fast API server for programmatic access to PromptCraft functionality
"""

import os
import json
import time
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from pathlib import Path

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, validator
import uvicorn

# Import PromptCraft core functionality
from prompt_craft import (
    enhance_prompt, 
    load_config, 
    validate_input,
    PromptCraftError,
    ConfigurationError,
    ValidationError
)
from analytics import AnalyticsTracker
from batch_processor import BatchProcessor

# API Models
class PromptRequest(BaseModel):
    """Request model for prompt enhancement"""
    prompt: str = Field(..., min_length=1, max_length=10000, description="The prompt to enhance")
    model: str = Field(default="default", description="Target AI model")
    template: Optional[str] = Field(default=None, description="Specific template to use (optional)")
    user_id: Optional[str] = Field(default=None, description="User identifier for analytics")
    
    @validator('prompt')
    def validate_prompt(cls, v):
        if not v.strip():
            raise ValueError('Prompt cannot be empty')
        return v.strip()

class PromptResponse(BaseModel):
    """Response model for enhanced prompts"""
    enhanced_prompt: str
    template_used: str
    model: str
    processing_time_ms: float
    request_id: str
    timestamp: datetime

class BatchPromptRequest(BaseModel):
    """Request model for batch processing"""
    prompts: List[str] = Field(..., min_items=1, max_items=100)
    model: str = Field(default="default")
    template: Optional[str] = Field(default=None)
    user_id: Optional[str] = Field(default=None)
    
    @validator('prompts')
    def validate_prompts(cls, v):
        if not v:
            raise ValueError('At least one prompt is required')
        for prompt in v:
            if not prompt.strip():
                raise ValueError('All prompts must be non-empty')
        return [p.strip() for p in v]

class BatchPromptResponse(BaseModel):
    """Response model for batch processing"""
    results: List[PromptResponse]
    total_processed: int
    successful: int
    failed: int
    batch_id: str
    processing_time_ms: float

class AnalyticsResponse(BaseModel):
    """Response model for analytics data"""
    total_requests: int
    requests_today: int
    popular_templates: Dict[str, int]
    popular_models: Dict[str, int]
    average_processing_time: float
    error_rate: float

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    version: str
    uptime_seconds: float
    requests_processed: int

# Initialize FastAPI app
app = FastAPI(
    title="PromptCraft API",
    description="Neural Prompt Enhancement System - Programmatic API",
    version="3.0.1",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
config = None
analytics = None
batch_processor = None
security = HTTPBearer(auto_error=False)
start_time = time.time()

# Authentication dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Simple token-based authentication (extend as needed)"""
    if not credentials:
        return None
    
    # In production, validate the token properly
    api_key = os.getenv('PROMPTCRAFT_API_KEY')
    if api_key and credentials.credentials != api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    
    return credentials.credentials

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    global config, analytics, batch_processor
    
    try:
        # Load configuration
        config = load_config()
        
        # Initialize analytics
        analytics = AnalyticsTracker()
        
        # Initialize batch processor
        batch_processor = BatchProcessor(config)
        
        print("✅ PromptCraft API Server started successfully")
        
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        raise

@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint with basic information"""
    return {
        "service": "PromptCraft API",
        "version": "3.0.1",
        "status": "running",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    uptime = time.time() - start_time
    
    return HealthResponse(
        status="healthy",
        version="3.0.1",
        uptime_seconds=uptime,
        requests_processed=analytics.get_total_requests() if analytics else 0
    )

@app.post("/enhance", response_model=PromptResponse)
async def enhance_prompt_endpoint(
    request: PromptRequest,
    background_tasks: BackgroundTasks,
    user: Optional[str] = Depends(get_current_user)
):
    """Enhance a single prompt"""
    start_time_ms = time.time() * 1000
    request_id = str(uuid.uuid4())
    
    try:
        # Validate input
        validated_input = validate_input(request.prompt)
        
        # Enhance prompt
        enhanced, template_used = enhance_prompt(
            config=config,
            user_input=validated_input,
            model=request.model
        )
        
        processing_time = (time.time() * 1000) - start_time_ms
        
        # Create response
        response = PromptResponse(
            enhanced_prompt=enhanced,
            template_used=template_used,
            model=request.model,
            processing_time_ms=processing_time,
            request_id=request_id,
            timestamp=datetime.utcnow()
        )
        
        # Track analytics in background
        if analytics:
            background_tasks.add_task(
                analytics.track_request,
                user_id=request.user_id or "anonymous",
                template=template_used,
                model=request.model,
                processing_time=processing_time,
                success=True
            )
        
        return response
        
    except ValidationError as e:
        if analytics:
            background_tasks.add_task(
                analytics.track_error,
                error_type="validation",
                error_message=str(e),
                user_id=request.user_id
            )
        raise HTTPException(status_code=400, detail=str(e))
        
    except ConfigurationError as e:
        if analytics:
            background_tasks.add_task(
                analytics.track_error,
                error_type="configuration",
                error_message=str(e),
                user_id=request.user_id
            )
        raise HTTPException(status_code=500, detail=str(e))
        
    except Exception as e:
        if analytics:
            background_tasks.add_task(
                analytics.track_error,
                error_type="internal",
                error_message=str(e),
                user_id=request.user_id
            )
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/batch", response_model=BatchPromptResponse)
async def batch_enhance_endpoint(
    request: BatchPromptRequest,
    background_tasks: BackgroundTasks,
    user: Optional[str] = Depends(get_current_user)
):
    """Enhance multiple prompts in batch"""
    start_time_ms = time.time() * 1000
    batch_id = str(uuid.uuid4())
    
    try:
        # Process batch
        results = await batch_processor.process_batch(
            prompts=request.prompts,
            model=request.model,
            template=request.template,
            user_id=request.user_id
        )
        
        processing_time = (time.time() * 1000) - start_time_ms
        
        # Count successes and failures
        successful = sum(1 for r in results if hasattr(r, 'enhanced_prompt'))
        failed = len(results) - successful
        
        response = BatchPromptResponse(
            results=results,
            total_processed=len(results),
            successful=successful,
            failed=failed,
            batch_id=batch_id,
            processing_time_ms=processing_time
        )
        
        # Track batch analytics
        if analytics:
            background_tasks.add_task(
                analytics.track_batch_request,
                batch_size=len(request.prompts),
                successful=successful,
                failed=failed,
                processing_time=processing_time,
                user_id=request.user_id
            )
        
        return response
        
    except Exception as e:
        if analytics:
            background_tasks.add_task(
                analytics.track_error,
                error_type="batch_processing",
                error_message=str(e),
                user_id=request.user_id
            )
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/templates", response_model=Dict[str, Any])
async def get_templates():
    """Get available templates"""
    if not config:
        raise HTTPException(status_code=500, detail="Configuration not loaded")
    
    return {
        "templates": {
            key: {
                "name": template["name"],
                "description": f"Template for {template['name'].lower()}"
            }
            for key, template in config["templates"].items()
        }
    }

@app.get("/models", response_model=Dict[str, Any])
async def get_models():
    """Get available models"""
    if not config:
        raise HTTPException(status_code=500, detail="Configuration not loaded")
    
    return {
        "models": list(config["model_instructions"].keys())
    }

@app.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics(user: Optional[str] = Depends(get_current_user)):
    """Get analytics data (requires authentication)"""
    if not analytics:
        raise HTTPException(status_code=500, detail="Analytics not available")
    
    # Require authentication for analytics
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    data = analytics.get_analytics_summary()
    
    return AnalyticsResponse(
        total_requests=data["total_requests"],
        requests_today=data["requests_today"],
        popular_templates=data["popular_templates"],
        popular_models=data["popular_models"],
        average_processing_time=data["average_processing_time"],
        error_rate=data["error_rate"]
    )

@app.post("/integrations/webhook", response_model=Dict[str, str])
async def webhook_endpoint(
    payload: Dict[str, Any],
    background_tasks: BackgroundTasks,
    user: Optional[str] = Depends(get_current_user)
):
    """Webhook endpoint for integrations"""
    try:
        # Process webhook payload
        if "prompt" in payload:
            # Extract prompt from webhook
            prompt_text = payload["prompt"]
            model = payload.get("model", "default")
            
            # Enhance prompt
            enhanced, template_used = enhance_prompt(
                config=config,
                user_input=prompt_text,
                model=model
            )
            
            # Return enhanced prompt
            return {
                "status": "success",
                "enhanced_prompt": enhanced,
                "template_used": template_used
            }
        else:
            raise HTTPException(status_code=400, detail="No prompt found in payload")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Error handlers
@app.exception_handler(ValidationError)
async def validation_exception_handler(request, exc):
    return HTTPException(status_code=400, detail=str(exc))

@app.exception_handler(ConfigurationError)
async def configuration_exception_handler(request, exc):
    return HTTPException(status_code=500, detail=str(exc))

def main():
    """Run the API server"""
    port = int(os.getenv('PROMPTCRAFT_API_PORT', '8080'))
    host = os.getenv('PROMPTCRAFT_API_HOST', '0.0.0.0')
    
    print(f"🚀 Starting PromptCraft API Server on {host}:{port}")
    print(f"📖 API Documentation: http://{host}:{port}/docs")
    
    uvicorn.run(
        "api_server:app",
        host=host,
        port=port,
        reload=os.getenv('PROMPTCRAFT_ENV') == 'development',
        log_level="info"
    )

if __name__ == "__main__":
    main()