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

# Import advanced engine if available
try:
    from advanced_prompt_engine import AdvancedPromptEngine, PromptAnalysis, EnhancementMetrics
    ADVANCED_ENGINE_AVAILABLE = True
except ImportError:
    ADVANCED_ENGINE_AVAILABLE = False

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
    analysis: Optional[Dict] = None
    metrics: Optional[Dict] = None
    advanced_engine_used: bool = False

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
        
        # Add additional models not in model_instructions
        additional_models = [
            {"id": "gemini", "name": "Gemini", "color": "from-purple-400 to-violet-400"},
            {"id": "o1", "name": "O1 (Reasoning)", "color": "from-orange-400 to-red-400"},
            {"id": "gpt3", "name": "GPT-3.5", "color": "from-blue-400 to-cyan-400"}
        ]
        
        for model in additional_models:
            if not any(m["id"] == model["id"] for m in models):
                models.append(model)
        
        return ModelResponse(models=models)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load models: {str(e)}")

@app.post("/api/enhance", response_model=EnhanceResponse, summary="Enhance Prompt")
async def enhance_user_prompt(request: EnhanceRequest):
    """Enhance a user prompt using advanced AI-powered analysis and optimization"""
    try:
        config = get_config()
        analysis_data = None
        metrics_data = None
        advanced_used = False
        
        # Try to use advanced engine first
        if (ADVANCED_ENGINE_AVAILABLE and 
            config.get("advanced_features", {}).get("intelligent_analysis", False)):
            try:
                engine = AdvancedPromptEngine()
                enhanced_prompt, template_name, analysis, metrics = engine.generate_enhanced_prompt(
                    request.user_input, request.model, request.template
                )
                
                # Convert analysis and metrics to dictionaries for JSON response
                analysis_data = {
                    "complexity": analysis.complexity.value,
                    "intent": analysis.intent.value,
                    "domain": analysis.domain,
                    "confidence": analysis.confidence,
                    "keywords": analysis.keywords,
                    "entities": analysis.entities,
                    "sentiment": analysis.sentiment,
                    "length_category": analysis.length_category,
                    "technical_depth": analysis.technical_depth,
                    "creativity_level": analysis.creativity_level
                }
                
                metrics_data = {
                    "clarity_score": metrics.clarity_score,
                    "specificity_score": metrics.specificity_score,
                    "completeness_score": metrics.completeness_score,
                    "effectiveness_score": metrics.effectiveness_score,
                    "token_efficiency": metrics.token_efficiency,
                    "overall_score": (
                        metrics.clarity_score + metrics.specificity_score + 
                        metrics.completeness_score + metrics.effectiveness_score + 
                        metrics.token_efficiency
                    ) / 5.0
                }
                
                advanced_used = True
                
            except Exception as e:
                print(f"Advanced engine error: {e}. Falling back to basic enhancement.")
                # Fall through to basic enhancement
        
        # Fallback to basic enhancement or handle template override
        if not advanced_used:
            if request.template:
                # Validate template exists
                if request.template not in config["templates"]:
                    raise HTTPException(status_code=400, detail=f"Template '{request.template}' not found")
                
                # Use specified template with enhanced basic functionality
                enhanced_prompt, template_name = enhance_prompt(config, request.user_input, request.model)
            else:
                # Use auto-detection from enhanced function
                enhanced_prompt, template_name = enhance_prompt(config, request.user_input, request.model)
        
        return EnhanceResponse(
            enhanced_prompt=enhanced_prompt,
            template_used=template_name,
            model=request.model,
            analysis=analysis_data,
            metrics=metrics_data,
            advanced_engine_used=advanced_used
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to enhance prompt: {str(e)}")

@app.post("/api/detect-template", summary="Detect Template")
async def detect_template(request: Dict[str, str]):
    """Detect the best template for a given input using advanced analysis"""
    try:
        user_input = request.get("user_input", "")
        if not user_input:
            raise HTTPException(status_code=400, detail="user_input is required")
            
        config = get_config()
        
        # Use advanced engine if available
        if ADVANCED_ENGINE_AVAILABLE and config.get("advanced_features", {}).get("intelligent_analysis", False):
            try:
                engine = AdvancedPromptEngine()
                analysis = engine.analyze_prompt(user_input)
                template_key = engine._select_optimal_template(analysis)
                
                return {
                    "detected_template": template_key,
                    "template_name": engine._get_template_name(template_key, analysis),
                    "confidence": analysis.confidence,
                    "analysis": {
                        "complexity": analysis.complexity.value,
                        "intent": analysis.intent.value,
                        "domain": analysis.domain,
                        "technical_depth": analysis.technical_depth,
                        "creativity_level": analysis.creativity_level
                    }
                }
            except Exception as e:
                print(f"Advanced detection error: {e}. Using basic detection.")
        
        # Fallback to basic detection
        lower_input = user_input.lower()
        template_key = "general"  # Default
        for key, keywords in config["keywords"].items():
            if any(kw in lower_input for kw in keywords):
                template_key = key
                break
        
        return {
            "detected_template": template_key,
            "template_name": config["templates"][template_key]["name"],
            "confidence": 0.5,
            "analysis": None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to detect template: {str(e)}")

@app.post("/api/analyze", summary="Analyze Prompt")
async def analyze_prompt_endpoint(request: Dict[str, str]):
    """Perform comprehensive analysis of a prompt"""
    try:
        user_input = request.get("user_input", "")
        if not user_input:
            raise HTTPException(status_code=400, detail="user_input is required")
        
        if not ADVANCED_ENGINE_AVAILABLE:
            raise HTTPException(status_code=503, detail="Advanced analysis not available")
        
        engine = AdvancedPromptEngine()
        analysis = engine.analyze_prompt(user_input)
        
        return {
            "analysis": {
                "complexity": analysis.complexity.value,
                "intent": analysis.intent.value,
                "domain": analysis.domain,
                "confidence": analysis.confidence,
                "keywords": analysis.keywords,
                "entities": analysis.entities,
                "sentiment": analysis.sentiment,
                "length_category": analysis.length_category,
                "technical_depth": analysis.technical_depth,
                "creativity_level": analysis.creativity_level
            },
            "recommendations": {
                "suggested_template": engine._select_optimal_template(analysis),
                "optimization_suggestions": [
                    "Consider adding more specific requirements" if analysis.complexity == analysis.complexity.SIMPLE else None,
                    "Break down into smaller subtasks" if analysis.complexity == analysis.complexity.EXPERT else None,
                    "Add domain-specific context" if analysis.confidence < 0.7 else None,
                    "Include examples or constraints" if len(analysis.keywords) < 3 else None
                ]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze prompt: {str(e)}")

@app.get("/api/capabilities", summary="Get System Capabilities")
async def get_capabilities():
    """Get information about system capabilities and features"""
    return {
        "advanced_engine_available": ADVANCED_ENGINE_AVAILABLE,
        "features": {
            "intelligent_analysis": ADVANCED_ENGINE_AVAILABLE,
            "context_awareness": ADVANCED_ENGINE_AVAILABLE,
            "dynamic_optimization": ADVANCED_ENGINE_AVAILABLE,
            "effectiveness_metrics": ADVANCED_ENGINE_AVAILABLE,
            "multi_model_support": True,
            "template_auto_detection": True,
            "prompt_analytics": ADVANCED_ENGINE_AVAILABLE
        },
        "supported_models": ["default", "gpt4", "claude", "gemini", "o1", "gpt3"],
        "analysis_capabilities": [
            "complexity_assessment",
            "intent_detection", 
            "domain_identification",
            "keyword_extraction",
            "entity_recognition",
            "sentiment_analysis",
            "technical_depth_scoring",
            "creativity_level_assessment"
        ] if ADVANCED_ENGINE_AVAILABLE else [],
        "enhancement_metrics": [
            "clarity_score",
            "specificity_score", 
            "completeness_score",
            "effectiveness_score",
            "token_efficiency"
        ] if ADVANCED_ENGINE_AVAILABLE else []
    }

if __name__ == "__main__":
    # Run the server
    uvicorn.run(
        "api_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )