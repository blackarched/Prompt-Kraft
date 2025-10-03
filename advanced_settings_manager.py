#!/usr/bin/env python3

import json
import os
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field, asdict
from enum import Enum
import copy

class SettingType(Enum):
    BOOLEAN = "boolean"
    INTEGER = "integer"
    FLOAT = "float"
    STRING = "string"
    CHOICE = "choice"
    MULTI_CHOICE = "multi_choice"
    RANGE = "range"
    OBJECT = "object"
    LIST = "list"

class SettingCategory(Enum):
    GENERAL = "general"
    ANALYSIS = "analysis"
    GENERATION = "generation"
    QUALITY = "quality"
    PERSONALIZATION = "personalization"
    ADVANCED = "advanced"
    EXPERIMENTAL = "experimental"

@dataclass
class SettingDefinition:
    key: str
    name: str
    description: str
    category: SettingCategory
    type: SettingType
    default_value: Any
    min_value: Optional[Union[int, float]] = None
    max_value: Optional[Union[int, float]] = None
    choices: Optional[List[str]] = None
    validation_rules: Optional[List[str]] = None
    dependencies: Optional[Dict[str, Any]] = None
    advanced: bool = False
    experimental: bool = False
    restart_required: bool = False

@dataclass
class AdvancedSettings:
    # General Settings
    system_mode: str = "intelligent"  # basic, enhanced, intelligent, expert
    output_language: str = "english"
    debug_mode: bool = False
    performance_mode: str = "balanced"  # fast, balanced, thorough
    
    # Analysis Settings
    enable_deep_analysis: bool = True
    semantic_analysis_depth: int = 8  # 1-10 scale
    context_awareness_level: int = 9  # 1-10 scale
    domain_detection_sensitivity: float = 0.3  # 0.0-1.0
    intent_classification_threshold: float = 0.5  # 0.0-1.0
    enable_entity_recognition: bool = True
    enable_sentiment_analysis: bool = True
    enable_complexity_assessment: bool = True
    
    # Generation Settings
    prompt_expansion_ratio: str = "adaptive"  # minimal, moderate, comprehensive, extensive, adaptive
    template_selection_mode: str = "intelligent"  # manual, automatic, intelligent, hybrid
    optimization_level: int = 8  # 1-10 scale
    creativity_enhancement: bool = True
    technical_precision: bool = True
    include_methodology_frameworks: bool = True
    include_quality_standards: bool = True
    include_validation_steps: bool = True
    
    # Quality Settings
    minimum_relevance_score: float = 0.7  # 0.0-1.0
    enable_quality_validation: bool = True
    enable_completeness_check: bool = True
    enable_accuracy_validation: bool = True
    enable_appropriateness_check: bool = True
    quality_assurance_level: int = 7  # 1-10 scale
    
    # Personalization Settings
    enable_user_preferences: bool = True
    enable_adaptive_learning: bool = True
    learning_rate: float = 0.1  # 0.0-1.0
    preference_weight: float = 0.3  # 0.0-1.0
    enable_feedback_learning: bool = True
    personalization_depth: int = 6  # 1-10 scale
    
    # Model-Specific Settings
    model_optimization_profiles: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    enable_model_specific_tuning: bool = True
    cross_model_compatibility: bool = True
    
    # Advanced Settings
    enable_experimental_features: bool = False
    custom_semantic_networks: Dict[str, Any] = field(default_factory=dict)
    custom_templates: Dict[str, Any] = field(default_factory=dict)
    custom_validation_rules: List[str] = field(default_factory=list)
    enable_plugin_system: bool = False
    
    # Performance Settings
    cache_analysis_results: bool = True
    cache_duration_minutes: int = 60
    max_concurrent_analyses: int = 5
    timeout_seconds: int = 30
    
    # Output Settings
    include_analysis_metadata: bool = True
    include_relevance_scores: bool = True
    include_improvement_suggestions: bool = True
    output_format: str = "comprehensive"  # minimal, standard, comprehensive, detailed
    
    # Experimental Settings
    enable_neural_enhancement: bool = False
    enable_cross_domain_learning: bool = False
    enable_predictive_optimization: bool = False

class AdvancedSettingsManager:
    """
    Comprehensive settings manager with advanced configuration options,
    validation, profiles, and dynamic updates.
    """
    
    def __init__(self, config_dir: str = None):
        self.config_dir = config_dir or os.path.expanduser("~/.config/promptcraft/advanced")
        self.settings_file = os.path.join(self.config_dir, "advanced_settings.json")
        self.profiles_file = os.path.join(self.config_dir, "settings_profiles.json")
        
        # Initialize settings definitions
        self.setting_definitions = self._initialize_setting_definitions()
        
        # Load or create default settings
        self.current_settings = self._load_settings()
        self.settings_profiles = self._load_profiles()
        
        # Validation and change tracking
        self.validation_errors = []
        self.pending_changes = {}
        self.change_callbacks = {}
    
    def _initialize_setting_definitions(self) -> Dict[str, SettingDefinition]:
        """Initialize comprehensive setting definitions with validation rules."""
        definitions = {}
        
        # General Settings
        definitions["system_mode"] = SettingDefinition(
            key="system_mode",
            name="System Mode",
            description="Overall system intelligence and feature level",
            category=SettingCategory.GENERAL,
            type=SettingType.CHOICE,
            default_value="intelligent",
            choices=["basic", "enhanced", "intelligent", "expert"],
            validation_rules=["required"]
        )
        
        definitions["performance_mode"] = SettingDefinition(
            key="performance_mode",
            name="Performance Mode",
            description="Balance between speed and thoroughness",
            category=SettingCategory.GENERAL,
            type=SettingType.CHOICE,
            default_value="balanced",
            choices=["fast", "balanced", "thorough"]
        )
        
        # Analysis Settings
        definitions["semantic_analysis_depth"] = SettingDefinition(
            key="semantic_analysis_depth",
            name="Semantic Analysis Depth",
            description="Depth of semantic understanding (1=basic, 10=comprehensive)",
            category=SettingCategory.ANALYSIS,
            type=SettingType.INTEGER,
            default_value=8,
            min_value=1,
            max_value=10
        )
        
        definitions["context_awareness_level"] = SettingDefinition(
            key="context_awareness_level",
            name="Context Awareness Level",
            description="Level of contextual understanding and adaptation",
            category=SettingCategory.ANALYSIS,
            type=SettingType.INTEGER,
            default_value=9,
            min_value=1,
            max_value=10
        )
        
        definitions["domain_detection_sensitivity"] = SettingDefinition(
            key="domain_detection_sensitivity",
            name="Domain Detection Sensitivity",
            description="Sensitivity threshold for domain classification",
            category=SettingCategory.ANALYSIS,
            type=SettingType.FLOAT,
            default_value=0.3,
            min_value=0.0,
            max_value=1.0
        )
        
        # Generation Settings
        definitions["prompt_expansion_ratio"] = SettingDefinition(
            key="prompt_expansion_ratio",
            name="Prompt Expansion Ratio",
            description="How much to expand and enhance the original prompt",
            category=SettingCategory.GENERATION,
            type=SettingType.CHOICE,
            default_value="adaptive",
            choices=["minimal", "moderate", "comprehensive", "extensive", "adaptive"]
        )
        
        definitions["optimization_level"] = SettingDefinition(
            key="optimization_level",
            name="Optimization Level",
            description="Level of prompt optimization and enhancement",
            category=SettingCategory.GENERATION,
            type=SettingType.INTEGER,
            default_value=8,
            min_value=1,
            max_value=10
        )
        
        # Quality Settings
        definitions["minimum_relevance_score"] = SettingDefinition(
            key="minimum_relevance_score",
            name="Minimum Relevance Score",
            description="Minimum acceptable relevance score for generated prompts",
            category=SettingCategory.QUALITY,
            type=SettingType.FLOAT,
            default_value=0.7,
            min_value=0.0,
            max_value=1.0
        )
        
        definitions["quality_assurance_level"] = SettingDefinition(
            key="quality_assurance_level",
            name="Quality Assurance Level",
            description="Thoroughness of quality validation and checking",
            category=SettingCategory.QUALITY,
            type=SettingType.INTEGER,
            default_value=7,
            min_value=1,
            max_value=10
        )
        
        # Personalization Settings
        definitions["learning_rate"] = SettingDefinition(
            key="learning_rate",
            name="Learning Rate",
            description="How quickly the system adapts to user preferences",
            category=SettingCategory.PERSONALIZATION,
            type=SettingType.FLOAT,
            default_value=0.1,
            min_value=0.0,
            max_value=1.0
        )
        
        definitions["personalization_depth"] = SettingDefinition(
            key="personalization_depth",
            name="Personalization Depth",
            description="Level of personalization and user adaptation",
            category=SettingCategory.PERSONALIZATION,
            type=SettingType.INTEGER,
            default_value=6,
            min_value=1,
            max_value=10
        )
        
        # Advanced Settings
        definitions["enable_experimental_features"] = SettingDefinition(
            key="enable_experimental_features",
            name="Enable Experimental Features",
            description="Enable cutting-edge experimental functionality",
            category=SettingCategory.ADVANCED,
            type=SettingType.BOOLEAN,
            default_value=False,
            experimental=True,
            restart_required=True
        )
        
        definitions["enable_neural_enhancement"] = SettingDefinition(
            key="enable_neural_enhancement",
            name="Enable Neural Enhancement",
            description="Use neural networks for advanced prompt optimization",
            category=SettingCategory.EXPERIMENTAL,
            type=SettingType.BOOLEAN,
            default_value=False,
            experimental=True,
            dependencies={"enable_experimental_features": True}
        )
        
        return definitions
    
    def _load_settings(self) -> AdvancedSettings:
        """Load settings from file or create defaults."""
        os.makedirs(self.config_dir, exist_ok=True)
        
        if os.path.exists(self.settings_file):
            try:
                with open(self.settings_file, 'r') as f:
                    settings_data = json.load(f)
                
                # Create settings object with loaded data
                settings = AdvancedSettings()
                for key, value in settings_data.items():
                    if hasattr(settings, key):
                        setattr(settings, key, value)
                
                return settings
            except Exception as e:
                print(f"Error loading settings: {e}. Using defaults.")
        
        return AdvancedSettings()
    
    def _load_profiles(self) -> Dict[str, Dict[str, Any]]:
        """Load settings profiles."""
        if os.path.exists(self.profiles_file):
            try:
                with open(self.profiles_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error loading profiles: {e}")
        
        return self._create_default_profiles()
    
    def _create_default_profiles(self) -> Dict[str, Dict[str, Any]]:
        """Create default settings profiles for different use cases."""
        profiles = {
            "beginner": {
                "name": "Beginner Mode",
                "description": "Simplified settings for new users",
                "settings": {
                    "system_mode": "enhanced",
                    "semantic_analysis_depth": 5,
                    "context_awareness_level": 6,
                    "optimization_level": 6,
                    "quality_assurance_level": 5,
                    "enable_experimental_features": False
                }
            },
            "professional": {
                "name": "Professional Mode",
                "description": "Optimized for professional and business use",
                "settings": {
                    "system_mode": "intelligent",
                    "semantic_analysis_depth": 8,
                    "context_awareness_level": 9,
                    "optimization_level": 8,
                    "quality_assurance_level": 8,
                    "include_quality_standards": True,
                    "technical_precision": True
                }
            },
            "researcher": {
                "name": "Research Mode",
                "description": "Optimized for academic and research work",
                "settings": {
                    "system_mode": "expert",
                    "semantic_analysis_depth": 10,
                    "context_awareness_level": 10,
                    "optimization_level": 9,
                    "quality_assurance_level": 9,
                    "include_methodology_frameworks": True,
                    "include_validation_steps": True
                }
            },
            "creative": {
                "name": "Creative Mode",
                "description": "Optimized for creative and artistic work",
                "settings": {
                    "system_mode": "intelligent",
                    "semantic_analysis_depth": 7,
                    "creativity_enhancement": True,
                    "optimization_level": 7,
                    "technical_precision": False,
                    "prompt_expansion_ratio": "comprehensive"
                }
            },
            "developer": {
                "name": "Developer Mode",
                "description": "Optimized for software development",
                "settings": {
                    "system_mode": "expert",
                    "semantic_analysis_depth": 9,
                    "technical_precision": True,
                    "optimization_level": 9,
                    "include_quality_standards": True,
                    "include_validation_steps": True,
                    "enable_experimental_features": True
                }
            },
            "performance": {
                "name": "Performance Mode",
                "description": "Optimized for speed and efficiency",
                "settings": {
                    "performance_mode": "fast",
                    "semantic_analysis_depth": 6,
                    "context_awareness_level": 7,
                    "optimization_level": 6,
                    "cache_analysis_results": True,
                    "timeout_seconds": 15
                }
            }
        }
        
        self._save_profiles(profiles)
        return profiles
    
    def get_setting(self, key: str) -> Any:
        """Get a setting value."""
        return getattr(self.current_settings, key, None)
    
    def set_setting(self, key: str, value: Any, validate: bool = True) -> bool:
        """Set a setting value with optional validation."""
        if validate and not self._validate_setting(key, value):
            return False
        
        # Check dependencies
        if not self._check_dependencies(key, value):
            return False
        
        # Set the value
        old_value = getattr(self.current_settings, key, None)
        setattr(self.current_settings, key, value)
        
        # Track change
        self.pending_changes[key] = {"old": old_value, "new": value}
        
        # Call change callbacks
        if key in self.change_callbacks:
            for callback in self.change_callbacks[key]:
                callback(key, old_value, value)
        
        return True
    
    def _validate_setting(self, key: str, value: Any) -> bool:
        """Validate a setting value against its definition."""
        if key not in self.setting_definitions:
            self.validation_errors.append(f"Unknown setting: {key}")
            return False
        
        definition = self.setting_definitions[key]
        
        # Type validation
        if definition.type == SettingType.BOOLEAN and not isinstance(value, bool):
            self.validation_errors.append(f"{key}: Must be boolean")
            return False
        elif definition.type == SettingType.INTEGER and not isinstance(value, int):
            self.validation_errors.append(f"{key}: Must be integer")
            return False
        elif definition.type == SettingType.FLOAT and not isinstance(value, (int, float)):
            self.validation_errors.append(f"{key}: Must be number")
            return False
        elif definition.type == SettingType.STRING and not isinstance(value, str):
            self.validation_errors.append(f"{key}: Must be string")
            return False
        
        # Range validation
        if definition.min_value is not None and value < definition.min_value:
            self.validation_errors.append(f"{key}: Must be >= {definition.min_value}")
            return False
        if definition.max_value is not None and value > definition.max_value:
            self.validation_errors.append(f"{key}: Must be <= {definition.max_value}")
            return False
        
        # Choice validation
        if definition.choices and value not in definition.choices:
            self.validation_errors.append(f"{key}: Must be one of {definition.choices}")
            return False
        
        return True
    
    def _check_dependencies(self, key: str, value: Any) -> bool:
        """Check if setting dependencies are satisfied."""
        if key not in self.setting_definitions:
            return True
        
        definition = self.setting_definitions[key]
        if not definition.dependencies:
            return True
        
        for dep_key, dep_value in definition.dependencies.items():
            current_dep_value = getattr(self.current_settings, dep_key, None)
            if current_dep_value != dep_value:
                self.validation_errors.append(
                    f"{key}: Requires {dep_key} to be {dep_value}"
                )
                return False
        
        return True
    
    def apply_profile(self, profile_name: str) -> bool:
        """Apply a settings profile."""
        if profile_name not in self.settings_profiles:
            self.validation_errors.append(f"Unknown profile: {profile_name}")
            return False
        
        profile = self.settings_profiles[profile_name]
        profile_settings = profile.get("settings", {})
        
        # Validate all settings in profile
        for key, value in profile_settings.items():
            if not self._validate_setting(key, value):
                return False
        
        # Apply all settings
        for key, value in profile_settings.items():
            setattr(self.current_settings, key, value)
        
        return True
    
    def create_custom_profile(self, name: str, description: str, 
                            settings: Dict[str, Any]) -> bool:
        """Create a custom settings profile."""
        # Validate all settings
        for key, value in settings.items():
            if not self._validate_setting(key, value):
                return False
        
        # Create profile
        self.settings_profiles[name] = {
            "name": name,
            "description": description,
            "settings": settings,
            "custom": True
        }
        
        self._save_profiles(self.settings_profiles)
        return True
    
    def get_settings_by_category(self, category: SettingCategory) -> Dict[str, Any]:
        """Get all settings in a specific category."""
        category_settings = {}
        
        for key, definition in self.setting_definitions.items():
            if definition.category == category:
                category_settings[key] = {
                    "definition": definition,
                    "value": getattr(self.current_settings, key, definition.default_value)
                }
        
        return category_settings
    
    def get_advanced_settings(self) -> Dict[str, Any]:
        """Get all advanced/experimental settings."""
        advanced_settings = {}
        
        for key, definition in self.setting_definitions.items():
            if definition.advanced or definition.experimental:
                advanced_settings[key] = {
                    "definition": definition,
                    "value": getattr(self.current_settings, key, definition.default_value)
                }
        
        return advanced_settings
    
    def export_settings(self, include_defaults: bool = False) -> Dict[str, Any]:
        """Export current settings to dictionary."""
        settings_dict = asdict(self.current_settings)
        
        if not include_defaults:
            # Only include non-default values
            default_settings = AdvancedSettings()
            default_dict = asdict(default_settings)
            
            filtered_dict = {}
            for key, value in settings_dict.items():
                if key not in default_dict or value != default_dict[key]:
                    filtered_dict[key] = value
            
            return filtered_dict
        
        return settings_dict
    
    def import_settings(self, settings_dict: Dict[str, Any], 
                       validate: bool = True) -> bool:
        """Import settings from dictionary."""
        if validate:
            # Validate all settings first
            for key, value in settings_dict.items():
                if hasattr(self.current_settings, key):
                    if not self._validate_setting(key, value):
                        return False
        
        # Apply all settings
        for key, value in settings_dict.items():
            if hasattr(self.current_settings, key):
                setattr(self.current_settings, key, value)
        
        return True
    
    def reset_to_defaults(self, category: SettingCategory = None):
        """Reset settings to defaults, optionally for a specific category."""
        default_settings = AdvancedSettings()
        
        if category:
            # Reset only settings in the specified category
            for key, definition in self.setting_definitions.items():
                if definition.category == category:
                    setattr(self.current_settings, key, 
                           getattr(default_settings, key))
        else:
            # Reset all settings
            self.current_settings = default_settings
    
    def save_settings(self) -> bool:
        """Save current settings to file."""
        try:
            os.makedirs(self.config_dir, exist_ok=True)
            
            settings_dict = asdict(self.current_settings)
            with open(self.settings_file, 'w') as f:
                json.dump(settings_dict, f, indent=2)
            
            return True
        except Exception as e:
            print(f"Error saving settings: {e}")
            return False
    
    def _save_profiles(self, profiles: Dict[str, Dict[str, Any]]):
        """Save profiles to file."""
        try:
            os.makedirs(self.config_dir, exist_ok=True)
            
            with open(self.profiles_file, 'w') as f:
                json.dump(profiles, f, indent=2)
        except Exception as e:
            print(f"Error saving profiles: {e}")
    
    def register_change_callback(self, setting_key: str, callback: callable):
        """Register a callback for when a setting changes."""
        if setting_key not in self.change_callbacks:
            self.change_callbacks[setting_key] = []
        self.change_callbacks[setting_key].append(callback)
    
    def get_validation_errors(self) -> List[str]:
        """Get current validation errors."""
        return self.validation_errors.copy()
    
    def clear_validation_errors(self):
        """Clear validation errors."""
        self.validation_errors.clear()
    
    def get_pending_changes(self) -> Dict[str, Dict[str, Any]]:
        """Get pending changes that haven't been saved."""
        return self.pending_changes.copy()
    
    def commit_changes(self) -> bool:
        """Commit pending changes and save to file."""
        if self.save_settings():
            self.pending_changes.clear()
            return True
        return False
    
    def rollback_changes(self):
        """Rollback pending changes."""
        for key, change in self.pending_changes.items():
            setattr(self.current_settings, key, change["old"])
        self.pending_changes.clear()
    
    def get_setting_definition(self, key: str) -> Optional[SettingDefinition]:
        """Get the definition for a setting."""
        return self.setting_definitions.get(key)
    
    def get_all_profiles(self) -> Dict[str, Dict[str, Any]]:
        """Get all available settings profiles."""
        return self.settings_profiles.copy()
    
    def delete_profile(self, profile_name: str) -> bool:
        """Delete a custom profile."""
        if profile_name not in self.settings_profiles:
            return False
        
        profile = self.settings_profiles[profile_name]
        if not profile.get("custom", False):
            return False  # Can't delete built-in profiles
        
        del self.settings_profiles[profile_name]
        self._save_profiles(self.settings_profiles)
        return True
    
    def optimize_for_performance(self):
        """Optimize settings for maximum performance."""
        performance_settings = {
            "performance_mode": "fast",
            "semantic_analysis_depth": 5,
            "context_awareness_level": 6,
            "optimization_level": 6,
            "cache_analysis_results": True,
            "timeout_seconds": 15,
            "enable_experimental_features": False
        }
        
        for key, value in performance_settings.items():
            self.set_setting(key, value, validate=False)
    
    def optimize_for_quality(self):
        """Optimize settings for maximum quality."""
        quality_settings = {
            "performance_mode": "thorough",
            "semantic_analysis_depth": 10,
            "context_awareness_level": 10,
            "optimization_level": 10,
            "quality_assurance_level": 10,
            "minimum_relevance_score": 0.8,
            "enable_quality_validation": True,
            "include_validation_steps": True
        }
        
        for key, value in quality_settings.items():
            self.set_setting(key, value, validate=False)
    
    def get_recommendations(self) -> List[Dict[str, Any]]:
        """Get setting recommendations based on current configuration."""
        recommendations = []
        
        # Performance recommendations
        if (self.get_setting("semantic_analysis_depth") > 8 and 
            self.get_setting("performance_mode") == "fast"):
            recommendations.append({
                "type": "performance",
                "message": "High analysis depth with fast mode may cause delays",
                "suggestion": "Reduce semantic_analysis_depth to 6 or change to balanced mode"
            })
        
        # Quality recommendations
        if (self.get_setting("minimum_relevance_score") < 0.6 and 
            self.get_setting("quality_assurance_level") > 7):
            recommendations.append({
                "type": "quality",
                "message": "Low relevance threshold with high QA level is inconsistent",
                "suggestion": "Increase minimum_relevance_score to 0.7 or higher"
            })
        
        # Feature recommendations
        if (not self.get_setting("enable_user_preferences") and 
            self.get_setting("personalization_depth") > 5):
            recommendations.append({
                "type": "feature",
                "message": "High personalization depth without user preferences",
                "suggestion": "Enable user preferences or reduce personalization depth"
            })
        
        return recommendations