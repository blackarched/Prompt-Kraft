#!/usr/bin/env python3

import os
import json
from typing import Dict, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Import the existing prompt craft functionality
from prompt_craft import load_config, enhance_prompt, create_default_config

app = FastAPI(title="PromptCraft API", version="1.0.0")

# Add CORS middleware to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for API requests/responses
class EnhanceRequest(BaseModel):
    user_input: str
    template: Optional[str] = None
    model: str = "default"

class EnhanceResponse(BaseModel):
    enhanced_prompt: str
    template_used: str
    model: str

class ConfigResponse(BaseModel):
    templates: Dict
    model_instructions: Dict
    keywords: Dict

class TemplateResponse(BaseModel):
    templates: Dict

class ModelResponse(BaseModel):
    models: List[Dict[str, str]]

# Global config cache
_config_cache = None

def get_config():
    """Get configuration, using cache for performance"""
    global _config_cache
    if _config_cache is None:
        try:
            _config_cache = load_config()
        except Exception as e:
            # If config loading fails, create default and try again
            create_default_config()
            _config_cache = load_config()
    return _config_cache

@app.get("/", summary="Health Check")
async def root():
    """Health check endpoint"""
    return {"message": "PromptCraft API is running", "status": "healthy"}

@app.get("/api/config", response_model=ConfigResponse, summary="Get Configuration")
async def get_configuration():
    """Get the complete configuration including templates, models, and keywords"""
    try:
        config = get_config()
        return ConfigResponse(
            templates=config["templates"],
            model_instructions=config["model_instructions"],
            keywords=config["keywords"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load configuration: {str(e)}")

@app.get("/api/templates", response_model=TemplateResponse, summary="Get Templates")
async def get_templates():
    """Get available prompt templates"""
    try:
        config = get_config()
        return TemplateResponse(templates=config["templates"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load templates: {str(e)}")

@app.get("/api/models", response_model=ModelResponse, summary="Get Available Models")
async def get_models():
    """Get available AI models"""
    try:
        config = get_config()
        models = []
        for model_id, instruction in config["model_instructions"].items():
            # Create model info with colors matching the frontend
            color_map = {
                "default": "from-cyan-400 to-blue-400",
                "gpt4": "from-green-400 to-emerald-400", 
                "claude": "from-pink-400 to-rose-400",
                "gemini": "from-purple-400 to-violet-400"
            }
            
            name_map = {
                "default": "Default",
                "gpt4": "GPT-4",
                "claude": "Claude", 
                "gemini": "Gemini"
            }
            
            models.append({
                "id": model_id,
                "name": name_map.get(model_id, model_id.title()),
                "color": color_map.get(model_id, "from-gray-400 to-gray-600")
            })
        
        return ModelResponse(models=models)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load models: {str(e)}")

@app.post("/api/enhance", response_model=EnhanceResponse, summary="Enhance Prompt")
async def enhance_user_prompt(request: EnhanceRequest):
    """Enhance a user prompt using the specified template and model"""
    try:
        config = get_config()
        
        # If no template specified, use auto-detection
        if request.template:
            # Validate template exists
            if request.template not in config["templates"]:
                raise HTTPException(status_code=400, detail=f"Template '{request.template}' not found")
            
            # Use specified template
            template = config["templates"][request.template]["content"]
            template_name = config["templates"][request.template]["name"]
            
            # Get model-specific instructions
            model_inst = config["model_instructions"].get(request.model, config["model_instructions"]["default"])
            
            # Fill placeholders
            enhanced = template.replace("{user_input}", request.user_input)
            enhanced = enhanced.replace("{model_instructions}", model_inst)
            
        else:
            # Use auto-detection from existing function
            enhanced, template_name = enhance_prompt(config, request.user_input, request.model)
        
        return EnhanceResponse(
            enhanced_prompt=enhanced,
            template_used=template_name,
            model=request.model
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to enhance prompt: {str(e)}")

@app.post("/api/detect-template", summary="Detect Template")
async def detect_template(request: Dict[str, str]):
    """Detect the best template for a given input"""
    try:
        user_input = request.get("user_input", "")
        if not user_input:
            raise HTTPException(status_code=400, detail="user_input is required")
            
        config = get_config()
        lower_input = user_input.lower()
        
        # Keyword matching to find the right template
        template_key = "general"  # Default
        for key, keywords in config["keywords"].items():
            if any(kw in lower_input for kw in keywords):
                template_key = key
                break
        
        return {
            "detected_template": template_key,
            "template_name": config["templates"][template_key]["name"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to detect template: {str(e)}")

if __name__ == "__main__":
    # Run the server
    uvicorn.run(
        "api_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )