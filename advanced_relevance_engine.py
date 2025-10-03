#!/usr/bin/env python3

import re
import json
import math
from typing import Dict, List, Tuple, Optional, Any, Set
from dataclasses import dataclass, field
from enum import Enum
import hashlib
from collections import defaultdict, Counter

class RelevanceLevel(Enum):
    PERFECT = "perfect"
    HIGH = "high"
    MODERATE = "moderate"
    LOW = "low"
    POOR = "poor"

class ContextType(Enum):
    TECHNICAL = "technical"
    BUSINESS = "business"
    ACADEMIC = "academic"
    CREATIVE = "creative"
    PERSONAL = "personal"
    PROFESSIONAL = "professional"

@dataclass
class SemanticContext:
    primary_concepts: List[str] = field(default_factory=list)
    secondary_concepts: List[str] = field(default_factory=list)
    technical_terms: List[str] = field(default_factory=list)
    action_verbs: List[str] = field(default_factory=list)
    domain_indicators: Dict[str, float] = field(default_factory=dict)
    context_type: ContextType = ContextType.PROFESSIONAL
    urgency_level: int = 0  # 0-10 scale
    formality_level: int = 5  # 0-10 scale (0=very casual, 10=very formal)
    specificity_requirements: List[str] = field(default_factory=list)
    technical_depth: int = 5  # 0-10 scale
    creativity_level: int = 5  # 0-10 scale

@dataclass
class RelevanceScore:
    overall_relevance: float
    semantic_match: float
    context_alignment: float
    intent_accuracy: float
    domain_specificity: float
    completeness_match: float
    tone_appropriateness: float
    technical_accuracy: float
    user_preference_match: float = 0.0

@dataclass
class UserPreferences:
    preferred_complexity: str = "adaptive"  # simple, moderate, complex, expert, adaptive
    preferred_length: str = "comprehensive"  # brief, moderate, comprehensive, extensive
    preferred_tone: str = "professional"  # casual, professional, academic, creative
    technical_depth: str = "adaptive"  # shallow, moderate, deep, expert, adaptive
    include_examples: bool = True
    include_step_by_step: bool = True
    include_best_practices: bool = True
    include_alternatives: bool = True
    focus_areas: List[str] = field(default_factory=list)
    avoid_topics: List[str] = field(default_factory=list)
    custom_requirements: Dict[str, Any] = field(default_factory=dict)

class AdvancedRelevanceEngine:
    """
    Advanced relevance engine with sophisticated semantic analysis, context understanding,
    and user preference tracking to ensure extremely relevant prompt generation.
    """
    
    def __init__(self):
        self.semantic_networks = self._initialize_semantic_networks()
        self.context_patterns = self._initialize_context_patterns()
        self.relevance_algorithms = self._initialize_relevance_algorithms()
        self.quality_validators = self._initialize_quality_validators()
        self.user_preferences_db = {}  # In production, this would be a proper database
        self.learning_patterns = defaultdict(list)
        
    def _initialize_semantic_networks(self) -> Dict[str, Dict[str, Any]]:
        """Initialize comprehensive semantic networks for concept understanding."""
        return {
            "software_development": {
                "core_concepts": {
                    "programming": ["code", "coding", "program", "script", "development", "software"],
                    "architecture": ["design", "pattern", "structure", "framework", "system", "architecture"],
                    "data": ["database", "data", "storage", "query", "sql", "nosql", "api"],
                    "security": ["secure", "security", "auth", "authentication", "encryption", "vulnerability"],
                    "performance": ["optimize", "performance", "speed", "efficiency", "scalable", "load"],
                    "testing": ["test", "testing", "unit", "integration", "qa", "quality", "bug"],
                    "deployment": ["deploy", "deployment", "ci", "cd", "docker", "kubernetes", "cloud"]
                },
                "action_verbs": ["create", "build", "develop", "implement", "design", "optimize", "debug", "test", "deploy"],
                "technical_indicators": ["function", "class", "method", "variable", "algorithm", "protocol", "interface"],
                "complexity_markers": {
                    "simple": ["basic", "simple", "quick", "easy", "straightforward"],
                    "moderate": ["standard", "typical", "regular", "normal", "intermediate"],
                    "complex": ["advanced", "complex", "sophisticated", "comprehensive", "enterprise"],
                    "expert": ["expert", "master", "professional", "production", "scalable", "distributed"]
                }
            },
            "data_science": {
                "core_concepts": {
                    "machine_learning": ["ml", "machine learning", "model", "algorithm", "training", "prediction"],
                    "statistics": ["statistics", "statistical", "analysis", "correlation", "regression", "hypothesis"],
                    "data_processing": ["data", "dataset", "preprocessing", "cleaning", "transformation", "etl"],
                    "visualization": ["visualization", "chart", "graph", "plot", "dashboard", "report"],
                    "deep_learning": ["neural", "network", "deep", "learning", "ai", "artificial intelligence"],
                    "analytics": ["analytics", "insights", "metrics", "kpi", "business intelligence", "bi"]
                },
                "action_verbs": ["analyze", "predict", "classify", "cluster", "visualize", "model", "train"],
                "technical_indicators": ["feature", "target", "label", "tensor", "gradient", "optimization"],
                "tools": ["python", "r", "pandas", "numpy", "tensorflow", "pytorch", "sklearn", "jupyter"]
            },
            "business": {
                "core_concepts": {
                    "strategy": ["strategy", "strategic", "planning", "vision", "mission", "goals", "objectives"],
                    "operations": ["operations", "process", "workflow", "efficiency", "productivity", "optimization"],
                    "finance": ["revenue", "profit", "cost", "budget", "roi", "financial", "investment"],
                    "marketing": ["marketing", "brand", "customer", "market", "campaign", "promotion", "sales"],
                    "management": ["management", "leadership", "team", "organization", "culture", "performance"],
                    "growth": ["growth", "expansion", "scaling", "development", "innovation", "transformation"]
                },
                "action_verbs": ["analyze", "develop", "implement", "manage", "optimize", "grow", "scale"],
                "context_indicators": ["company", "business", "enterprise", "organization", "corporate", "startup"],
                "metrics": ["kpi", "metrics", "performance", "results", "outcomes", "success", "impact"]
            },
            "creative_writing": {
                "core_concepts": {
                    "narrative": ["story", "narrative", "plot", "character", "dialogue", "scene", "setting"],
                    "style": ["style", "tone", "voice", "mood", "atmosphere", "theme", "genre"],
                    "structure": ["structure", "pacing", "flow", "rhythm", "tension", "climax", "resolution"],
                    "creativity": ["creative", "original", "unique", "innovative", "imaginative", "artistic"],
                    "emotion": ["emotion", "feeling", "empathy", "connection", "impact", "resonance"]
                },
                "action_verbs": ["write", "create", "craft", "develop", "express", "tell", "narrate"],
                "genres": ["fiction", "non-fiction", "poetry", "screenplay", "novel", "short story", "essay"],
                "techniques": ["metaphor", "symbolism", "foreshadowing", "irony", "imagery", "allegory"]
            },
            "academic_research": {
                "core_concepts": {
                    "methodology": ["methodology", "method", "approach", "framework", "systematic", "rigorous"],
                    "evidence": ["evidence", "data", "findings", "results", "proof", "validation", "verification"],
                    "analysis": ["analysis", "examination", "investigation", "study", "research", "inquiry"],
                    "theory": ["theory", "theoretical", "conceptual", "model", "paradigm", "framework"],
                    "literature": ["literature", "sources", "references", "citations", "bibliography", "review"]
                },
                "action_verbs": ["research", "investigate", "analyze", "examine", "study", "explore", "evaluate"],
                "quality_indicators": ["peer-reviewed", "scholarly", "academic", "empirical", "systematic"],
                "output_types": ["paper", "thesis", "dissertation", "journal", "conference", "publication"]
            }
        }
    
    def _initialize_context_patterns(self) -> Dict[str, Dict[str, Any]]:
        """Initialize context pattern recognition for better understanding."""
        return {
            "urgency_indicators": {
                "high": ["urgent", "asap", "immediately", "quickly", "fast", "rush", "deadline", "emergency"],
                "medium": ["soon", "timely", "prompt", "expedite", "priority"],
                "low": ["eventually", "when possible", "no rush", "flexible", "whenever"]
            },
            "formality_indicators": {
                "formal": ["please", "kindly", "would you", "could you", "formal", "professional", "business"],
                "casual": ["hey", "hi", "can you", "help me", "casual", "friendly", "simple"],
                "academic": ["analyze", "examine", "investigate", "scholarly", "research", "academic"],
                "technical": ["implement", "configure", "optimize", "technical", "specification", "requirement"]
            },
            "scope_indicators": {
                "comprehensive": ["comprehensive", "complete", "thorough", "detailed", "extensive", "full"],
                "focused": ["specific", "targeted", "focused", "particular", "narrow", "precise"],
                "overview": ["overview", "summary", "brief", "general", "high-level", "outline"],
                "deep_dive": ["deep", "in-depth", "detailed", "comprehensive", "thorough", "extensive"]
            },
            "audience_indicators": {
                "beginner": ["beginner", "new", "novice", "basic", "simple", "easy", "introductory"],
                "intermediate": ["intermediate", "moderate", "standard", "typical", "regular"],
                "advanced": ["advanced", "expert", "professional", "sophisticated", "complex"],
                "mixed": ["all levels", "various", "different", "mixed", "diverse", "broad"]
            }
        }
    
    def _initialize_relevance_algorithms(self) -> Dict[str, callable]:
        """Initialize relevance scoring algorithms."""
        return {
            "semantic_similarity": self._calculate_semantic_similarity,
            "context_alignment": self._calculate_context_alignment,
            "intent_accuracy": self._calculate_intent_accuracy,
            "domain_specificity": self._calculate_domain_specificity,
            "completeness_match": self._calculate_completeness_match,
            "tone_appropriateness": self._calculate_tone_appropriateness,
            "technical_accuracy": self._calculate_technical_accuracy
        }
    
    def _initialize_quality_validators(self) -> Dict[str, callable]:
        """Initialize quality validation functions."""
        return {
            "relevance_validator": self._validate_relevance,
            "completeness_validator": self._validate_completeness,
            "accuracy_validator": self._validate_accuracy,
            "appropriateness_validator": self._validate_appropriateness
        }
    
    def analyze_user_input_deeply(self, user_input: str, user_id: str = None) -> SemanticContext:
        """Perform deep analysis of user input to understand context and requirements."""
        
        # Get user preferences if available
        user_prefs = self.user_preferences_db.get(user_id, UserPreferences())
        
        # Extract semantic context
        context = SemanticContext()
        
        # Analyze primary and secondary concepts
        context.primary_concepts = self._extract_primary_concepts(user_input)
        context.secondary_concepts = self._extract_secondary_concepts(user_input)
        
        # Extract technical terms and action verbs
        context.technical_terms = self._extract_technical_terms(user_input)
        context.action_verbs = self._extract_action_verbs(user_input)
        
        # Calculate domain indicators with confidence scores
        context.domain_indicators = self._calculate_domain_indicators(user_input)
        
        # Determine context type
        context.context_type = self._determine_context_type(user_input)
        
        # Assess urgency and formality levels
        context.urgency_level = self._assess_urgency_level(user_input)
        context.formality_level = self._assess_formality_level(user_input)
        
        # Extract specificity requirements
        context.specificity_requirements = self._extract_specificity_requirements(user_input)
        
        # Assess technical depth and creativity level
        context.technical_depth = self._assess_technical_depth(user_input)
        context.creativity_level = self._measure_creativity_level(user_input)
        
        return context
    
    def _extract_primary_concepts(self, text: str) -> List[str]:
        """Extract primary concepts from the text using semantic analysis."""
        concepts = []
        text_lower = text.lower()
        
        # Use TF-IDF-like approach for concept extraction
        words = re.findall(r'\b\w+\b', text_lower)
        word_freq = Counter(words)
        
        # Extract concepts based on semantic networks
        for domain, network in self.semantic_networks.items():
            for concept_category, concept_words in network.get("core_concepts", {}).items():
                matches = sum(word_freq.get(word, 0) for word in concept_words if word in text_lower)
                if matches > 0:
                    concepts.append(concept_category)
        
        # Add noun phrases as concepts
        noun_phrases = re.findall(r'\b(?:[A-Z][a-z]*\s*)+', text)
        concepts.extend([phrase.strip().lower() for phrase in noun_phrases if len(phrase.strip()) > 3])
        
        return list(set(concepts))[:10]  # Return top 10 unique concepts
    
    def _extract_secondary_concepts(self, text: str) -> List[str]:
        """Extract secondary/supporting concepts."""
        secondary = []
        text_lower = text.lower()
        
        # Look for modifiers and qualifiers
        modifiers = re.findall(r'\b(?:very|extremely|highly|quite|rather|somewhat|slightly)\s+(\w+)', text_lower)
        secondary.extend(modifiers)
        
        # Extract compound concepts
        compounds = re.findall(r'\b(\w+[-_]\w+)\b', text_lower)
        secondary.extend(compounds)
        
        # Extract contextual indicators
        context_words = ["for", "with", "using", "in", "on", "at", "by", "through", "via"]
        for word in context_words:
            pattern = rf'\b{word}\s+(\w+(?:\s+\w+)*?)(?:\s|$|[,.;])'
            matches = re.findall(pattern, text_lower)
            secondary.extend([match.strip() for match in matches if len(match.strip()) > 2])
        
        return list(set(secondary))[:8]  # Return top 8 unique secondary concepts
    
    def _extract_technical_terms(self, text: str) -> List[str]:
        """Extract technical terms and jargon."""
        technical_terms = []
        
        # Look for technical patterns
        patterns = [
            r'\b[A-Z]{2,}\b',  # Acronyms
            r'\b\w+\.\w+\b',   # Dotted notation (e.g., file.txt, api.endpoint)
            r'\b\w+_\w+\b',    # Snake_case
            r'\b[a-z]+[A-Z]\w*\b',  # camelCase
            r'\b\w+\(\)\b',    # Functions with parentheses
            r'\b\w+:\w+\b',    # Colon notation
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text)
            technical_terms.extend(matches)
        
        # Check against known technical vocabularies
        for domain, network in self.semantic_networks.items():
            technical_indicators = network.get("technical_indicators", [])
            for term in technical_indicators:
                if term.lower() in text.lower():
                    technical_terms.append(term)
        
        return list(set(technical_terms))[:10]
    
    def _extract_action_verbs(self, text: str) -> List[str]:
        """Extract action verbs to understand user intent."""
        action_verbs = []
        text_lower = text.lower()
        
        # Common action verb patterns
        verb_patterns = [
            r'\b(create|build|make|develop|design|implement)\b',
            r'\b(analyze|examine|study|investigate|research)\b',
            r'\b(explain|describe|clarify|define|outline)\b',
            r'\b(solve|fix|resolve|address|handle)\b',
            r'\b(optimize|improve|enhance|refine|upgrade)\b',
            r'\b(write|compose|draft|author|craft)\b',
            r'\b(plan|organize|structure|arrange|coordinate)\b',
            r'\b(test|validate|verify|check|evaluate)\b'
        ]
        
        for pattern in verb_patterns:
            matches = re.findall(pattern, text_lower)
            action_verbs.extend(matches)
        
        # Extract verbs from semantic networks
        for domain, network in self.semantic_networks.items():
            domain_verbs = network.get("action_verbs", [])
            for verb in domain_verbs:
                if verb in text_lower:
                    action_verbs.append(verb)
        
        return list(set(action_verbs))[:8]
    
    def _calculate_domain_indicators(self, text: str) -> Dict[str, float]:
        """Calculate confidence scores for different domains."""
        domain_scores = {}
        text_lower = text.lower()
        words = set(re.findall(r'\b\w+\b', text_lower))
        
        for domain, network in self.semantic_networks.items():
            score = 0.0
            total_possible = 0
            
            # Score based on core concepts
            for concept_category, concept_words in network.get("core_concepts", {}).items():
                concept_matches = sum(1 for word in concept_words if word in text_lower)
                if concept_matches > 0:
                    score += concept_matches * 2  # Higher weight for core concepts
                total_possible += len(concept_words)
            
            # Score based on technical indicators
            technical_indicators = network.get("technical_indicators", [])
            tech_matches = sum(1 for term in technical_indicators if term in text_lower)
            score += tech_matches * 1.5
            total_possible += len(technical_indicators)
            
            # Score based on action verbs
            action_verbs = network.get("action_verbs", [])
            verb_matches = sum(1 for verb in action_verbs if verb in text_lower)
            score += verb_matches
            total_possible += len(action_verbs)
            
            # Normalize score
            if total_possible > 0:
                domain_scores[domain] = min(score / total_possible, 1.0)
            else:
                domain_scores[domain] = 0.0
        
        return domain_scores
    
    def _determine_context_type(self, text: str) -> ContextType:
        """Determine the primary context type of the request."""
        text_lower = text.lower()
        
        # Technical context indicators
        technical_indicators = ["code", "program", "software", "system", "technical", "implementation"]
        if any(indicator in text_lower for indicator in technical_indicators):
            return ContextType.TECHNICAL
        
        # Business context indicators
        business_indicators = ["business", "company", "revenue", "strategy", "market", "customer"]
        if any(indicator in text_lower for indicator in business_indicators):
            return ContextType.BUSINESS
        
        # Academic context indicators
        academic_indicators = ["research", "study", "analysis", "academic", "scholarly", "thesis"]
        if any(indicator in text_lower for indicator in academic_indicators):
            return ContextType.ACADEMIC
        
        # Creative context indicators
        creative_indicators = ["creative", "story", "write", "design", "artistic", "narrative"]
        if any(indicator in text_lower for indicator in creative_indicators):
            return ContextType.CREATIVE
        
        # Personal context indicators
        personal_indicators = ["personal", "my", "i need", "help me", "for myself"]
        if any(indicator in text_lower for indicator in personal_indicators):
            return ContextType.PERSONAL
        
        return ContextType.PROFESSIONAL  # Default
    
    def _assess_urgency_level(self, text: str) -> int:
        """Assess urgency level (0-10 scale)."""
        text_lower = text.lower()
        urgency_score = 5  # Default medium urgency
        
        high_urgency = self.context_patterns["urgency_indicators"]["high"]
        medium_urgency = self.context_patterns["urgency_indicators"]["medium"]
        low_urgency = self.context_patterns["urgency_indicators"]["low"]
        
        if any(indicator in text_lower for indicator in high_urgency):
            urgency_score = 9
        elif any(indicator in text_lower for indicator in medium_urgency):
            urgency_score = 7
        elif any(indicator in text_lower for indicator in low_urgency):
            urgency_score = 3
        
        return urgency_score
    
    def _assess_formality_level(self, text: str) -> int:
        """Assess formality level (0-10 scale)."""
        text_lower = text.lower()
        formality_score = 5  # Default medium formality
        
        formal_indicators = self.context_patterns["formality_indicators"]["formal"]
        casual_indicators = self.context_patterns["formality_indicators"]["casual"]
        academic_indicators = self.context_patterns["formality_indicators"]["academic"]
        technical_indicators = self.context_patterns["formality_indicators"]["technical"]
        
        if any(indicator in text_lower for indicator in academic_indicators):
            formality_score = 9
        elif any(indicator in text_lower for indicator in formal_indicators):
            formality_score = 8
        elif any(indicator in text_lower for indicator in technical_indicators):
            formality_score = 7
        elif any(indicator in text_lower for indicator in casual_indicators):
            formality_score = 3
        
        return formality_score
    
    def _extract_specificity_requirements(self, text: str) -> List[str]:
        """Extract specific requirements and constraints from the text."""
        requirements = []
        text_lower = text.lower()
        
        # Look for explicit requirements
        requirement_patterns = [
            r'(?:must|should|need to|required to|have to)\s+([^.!?]+)',
            r'(?:requirements?|constraints?|specifications?):\s*([^.!?]+)',
            r'(?:include|with|using|for)\s+([^.!?]+)',
            r'(?:ensure|make sure|verify)\s+([^.!?]+)'
        ]
        
        for pattern in requirement_patterns:
            matches = re.findall(pattern, text_lower, re.IGNORECASE)
            requirements.extend([match.strip() for match in matches if len(match.strip()) > 5])
        
        # Look for quantitative requirements
        quantitative_patterns = [
            r'\b\d+\s*(?:users?|items?|records?|files?|pages?)\b',
            r'\b(?:less than|more than|at least|maximum|minimum)\s+\d+\b',
            r'\b\d+\s*(?:%|percent|percentage)\b'
        ]
        
        for pattern in quantitative_patterns:
            matches = re.findall(pattern, text_lower)
            requirements.extend(matches)
        
        return requirements[:10]  # Return top 10 requirements
    
    def _assess_technical_depth(self, text: str) -> int:
        """Assess the technical depth on a scale of 0-10."""
        technical_score = 0
        text_lower = text.lower()
        
        # Check for technical domains
        technical_domains = ["software_development", "data_science"]
        for domain in technical_domains:
            if domain in self.semantic_networks:
                keywords = []
                for concept_words in self.semantic_networks[domain].get("core_concepts", {}).values():
                    keywords.extend(concept_words)
                matches = sum(1 for keyword in keywords if keyword in text_lower)
                technical_score += matches
        
        # Check for technical indicators
        technical_indicators = ["algorithm", "implementation", "architecture", "framework", "api", "database", "system", "protocol", "methodology", "optimization"]
        technical_score += sum(1 for indicator in technical_indicators if indicator in text_lower)
        
        return min(technical_score, 10)
    
    def _measure_creativity_level(self, text: str) -> int:
        """Measure creativity level on a scale of 0-10."""
        creativity_score = 0
        text_lower = text.lower()
        
        creative_indicators = ["create", "design", "imagine", "invent", "brainstorm", "innovative", "original", "unique", "creative", "artistic", "story", "poem", "novel", "character", "plot"]
        creativity_score += sum(2 for indicator in creative_indicators if indicator in text_lower)
        
        # Check for creative domains
        if "creative_writing" in self.semantic_networks:
            creative_keywords = []
            for concept_words in self.semantic_networks["creative_writing"].get("core_concepts", {}).values():
                creative_keywords.extend(concept_words)
            matches = sum(1 for keyword in creative_keywords if keyword in text_lower)
            creativity_score += matches
        
        return min(creativity_score, 10)
    
    def calculate_comprehensive_relevance(self, user_input: str, enhanced_prompt: str, 
                                        semantic_context: SemanticContext, 
                                        user_id: str = None) -> RelevanceScore:
        """Calculate comprehensive relevance score for the enhanced prompt."""
        
        scores = {}
        
        # Calculate individual relevance components
        for algorithm_name, algorithm_func in self.relevance_algorithms.items():
            scores[algorithm_name] = algorithm_func(user_input, enhanced_prompt, semantic_context)
        
        # Calculate user preference match if user preferences available
        user_preference_match = 0.0
        if user_id and user_id in self.user_preferences_db:
            user_preference_match = self._calculate_user_preference_match(
                enhanced_prompt, semantic_context, self.user_preferences_db[user_id]
            )
        
        # Calculate overall relevance with weighted average
        weights = {
            "semantic_similarity": 0.25,
            "context_alignment": 0.20,
            "intent_accuracy": 0.20,
            "domain_specificity": 0.15,
            "completeness_match": 0.10,
            "tone_appropriateness": 0.05,
            "technical_accuracy": 0.05
        }
        
        overall_relevance = sum(scores[key] * weight for key, weight in weights.items())
        
        return RelevanceScore(
            overall_relevance=overall_relevance,
            semantic_match=scores["semantic_similarity"],
            context_alignment=scores["context_alignment"],
            intent_accuracy=scores["intent_accuracy"],
            domain_specificity=scores["domain_specificity"],
            completeness_match=scores["completeness_match"],
            tone_appropriateness=scores["tone_appropriateness"],
            technical_accuracy=scores["technical_accuracy"],
            user_preference_match=user_preference_match
        )
    
    def _calculate_semantic_similarity(self, user_input: str, enhanced_prompt: str, 
                                     semantic_context: SemanticContext) -> float:
        """Calculate semantic similarity between user input and enhanced prompt."""
        
        # Extract concepts from enhanced prompt
        enhanced_concepts = self._extract_primary_concepts(enhanced_prompt)
        enhanced_concepts.extend(self._extract_secondary_concepts(enhanced_prompt))
        
        # Calculate concept overlap
        user_concepts = set(semantic_context.primary_concepts + semantic_context.secondary_concepts)
        enhanced_concepts_set = set(enhanced_concepts)
        
        if not user_concepts:
            return 0.5  # Default if no concepts extracted
        
        # Jaccard similarity with weighted importance
        intersection = len(user_concepts.intersection(enhanced_concepts_set))
        union = len(user_concepts.union(enhanced_concepts_set))
        
        jaccard_similarity = intersection / union if union > 0 else 0.0
        
        # Boost score if primary concepts are well represented
        primary_concept_coverage = sum(1 for concept in semantic_context.primary_concepts 
                                     if concept in enhanced_concepts_set)
        primary_boost = primary_concept_coverage / max(len(semantic_context.primary_concepts), 1)
        
        # Calculate final semantic similarity
        semantic_score = (jaccard_similarity * 0.7) + (primary_boost * 0.3)
        
        return min(semantic_score, 1.0)
    
    def _calculate_context_alignment(self, user_input: str, enhanced_prompt: str, 
                                   semantic_context: SemanticContext) -> float:
        """Calculate how well the enhanced prompt aligns with the detected context."""
        
        alignment_score = 0.0
        
        # Check formality alignment
        enhanced_formality = self._assess_formality_level(enhanced_prompt)
        formality_diff = abs(enhanced_formality - semantic_context.formality_level)
        formality_alignment = max(0, 1 - (formality_diff / 10))
        alignment_score += formality_alignment * 0.3
        
        # Check urgency alignment
        enhanced_urgency = self._assess_urgency_level(enhanced_prompt)
        urgency_diff = abs(enhanced_urgency - semantic_context.urgency_level)
        urgency_alignment = max(0, 1 - (urgency_diff / 10))
        alignment_score += urgency_alignment * 0.2
        
        # Check context type alignment
        enhanced_context_type = self._determine_context_type(enhanced_prompt)
        context_type_match = 1.0 if enhanced_context_type == semantic_context.context_type else 0.7
        alignment_score += context_type_match * 0.3
        
        # Check technical term usage
        enhanced_technical_terms = set(self._extract_technical_terms(enhanced_prompt))
        user_technical_terms = set(semantic_context.technical_terms)
        
        if user_technical_terms:
            tech_term_overlap = len(enhanced_technical_terms.intersection(user_technical_terms))
            tech_term_coverage = tech_term_overlap / len(user_technical_terms)
            alignment_score += tech_term_coverage * 0.2
        else:
            alignment_score += 0.2  # No penalty if no technical terms in user input
        
        return min(alignment_score, 1.0)
    
    def _calculate_intent_accuracy(self, user_input: str, enhanced_prompt: str, 
                                 semantic_context: SemanticContext) -> float:
        """Calculate how accurately the enhanced prompt captures user intent."""
        
        # Extract action verbs from enhanced prompt
        enhanced_verbs = set(self._extract_action_verbs(enhanced_prompt))
        user_verbs = set(semantic_context.action_verbs)
        
        # Calculate verb overlap
        verb_overlap = 0.0
        if user_verbs:
            common_verbs = enhanced_verbs.intersection(user_verbs)
            verb_overlap = len(common_verbs) / len(user_verbs)
        
        # Check if the enhanced prompt addresses the user's specific requirements
        requirement_coverage = 0.0
        if semantic_context.specificity_requirements:
            enhanced_lower = enhanced_prompt.lower()
            covered_requirements = sum(1 for req in semantic_context.specificity_requirements 
                                     if any(word in enhanced_lower for word in req.split()[:3]))
            requirement_coverage = covered_requirements / len(semantic_context.specificity_requirements)
        
        # Check domain-specific intent preservation
        domain_intent_score = 0.0
        for domain, confidence in semantic_context.domain_indicators.items():
            if confidence > 0.3:  # Only consider domains with reasonable confidence
                enhanced_domain_score = self._calculate_domain_indicators(enhanced_prompt).get(domain, 0.0)
                domain_intent_score += min(enhanced_domain_score / confidence, 1.0) * confidence
        
        # Combine scores
        intent_score = (verb_overlap * 0.4) + (requirement_coverage * 0.4) + (domain_intent_score * 0.2)
        
        return min(intent_score, 1.0)
    
    def _calculate_domain_specificity(self, user_input: str, enhanced_prompt: str, 
                                    semantic_context: SemanticContext) -> float:
        """Calculate domain specificity match."""
        
        # Get domain indicators for enhanced prompt
        enhanced_domain_indicators = self._calculate_domain_indicators(enhanced_prompt)
        
        # Find the primary domain from user input
        primary_domain = max(semantic_context.domain_indicators.items(), 
                           key=lambda x: x[1], default=(None, 0.0))
        
        if primary_domain[0] is None or primary_domain[1] < 0.1:
            return 0.7  # Neutral score if no clear domain
        
        # Check if enhanced prompt maintains or improves domain specificity
        enhanced_domain_score = enhanced_domain_indicators.get(primary_domain[0], 0.0)
        
        # Score based on how well the domain is preserved and enhanced
        if enhanced_domain_score >= primary_domain[1]:
            return 1.0  # Domain specificity maintained or improved
        else:
            return enhanced_domain_score / primary_domain[1]  # Proportional to preservation
    
    def _calculate_completeness_match(self, user_input: str, enhanced_prompt: str, 
                                    semantic_context: SemanticContext) -> float:
        """Calculate how completely the enhanced prompt addresses the user's needs."""
        
        completeness_score = 0.0
        
        # Check if all primary concepts are addressed
        enhanced_concepts = set(self._extract_primary_concepts(enhanced_prompt))
        primary_concept_coverage = sum(1 for concept in semantic_context.primary_concepts 
                                     if concept in enhanced_concepts or 
                                     any(concept in enhanced_concept for enhanced_concept in enhanced_concepts))
        
        if semantic_context.primary_concepts:
            completeness_score += (primary_concept_coverage / len(semantic_context.primary_concepts)) * 0.4
        else:
            completeness_score += 0.4
        
        # Check if specificity requirements are addressed
        if semantic_context.specificity_requirements:
            enhanced_lower = enhanced_prompt.lower()
            addressed_requirements = 0
            for requirement in semantic_context.specificity_requirements:
                req_words = requirement.lower().split()
                if any(word in enhanced_lower for word in req_words):
                    addressed_requirements += 1
            
            completeness_score += (addressed_requirements / len(semantic_context.specificity_requirements)) * 0.3
        else:
            completeness_score += 0.3
        
        # Check for comprehensive structure indicators
        structure_indicators = [
            "framework", "methodology", "approach", "process", "steps", "requirements",
            "standards", "guidelines", "best practices", "considerations", "factors"
        ]
        
        enhanced_lower = enhanced_prompt.lower()
        structure_coverage = sum(1 for indicator in structure_indicators if indicator in enhanced_lower)
        structure_score = min(structure_coverage / 5, 1.0)  # Normalize to max 5 indicators
        completeness_score += structure_score * 0.3
        
        return min(completeness_score, 1.0)
    
    def _calculate_tone_appropriateness(self, user_input: str, enhanced_prompt: str, 
                                      semantic_context: SemanticContext) -> float:
        """Calculate tone appropriateness of the enhanced prompt."""
        
        # Assess tone consistency
        user_formality = semantic_context.formality_level
        enhanced_formality = self._assess_formality_level(enhanced_prompt)
        
        # Calculate formality alignment
        formality_diff = abs(user_formality - enhanced_formality)
        formality_score = max(0, 1 - (formality_diff / 10))
        
        # Check for appropriate professional language
        professional_indicators = [
            "expertise", "professional", "comprehensive", "systematic", "strategic",
            "effective", "efficient", "quality", "standards", "best practices"
        ]
        
        enhanced_lower = enhanced_prompt.lower()
        professional_score = sum(1 for indicator in professional_indicators if indicator in enhanced_lower)
        professional_score = min(professional_score / 5, 1.0)  # Normalize
        
        # Check context appropriateness
        context_appropriate_score = 1.0
        if semantic_context.context_type == ContextType.ACADEMIC:
            academic_terms = ["research", "analysis", "methodology", "evidence", "scholarly"]
            academic_presence = sum(1 for term in academic_terms if term in enhanced_lower)
            context_appropriate_score = min(academic_presence / 3, 1.0)
        elif semantic_context.context_type == ContextType.TECHNICAL:
            technical_terms = ["implementation", "architecture", "system", "technical", "specification"]
            technical_presence = sum(1 for term in technical_terms if term in enhanced_lower)
            context_appropriate_score = min(technical_presence / 3, 1.0)
        
        # Combine tone scores
        tone_score = (formality_score * 0.4) + (professional_score * 0.3) + (context_appropriate_score * 0.3)
        
        return min(tone_score, 1.0)
    
    def _calculate_technical_accuracy(self, user_input: str, enhanced_prompt: str, 
                                    semantic_context: SemanticContext) -> float:
        """Calculate technical accuracy and appropriateness."""
        
        # If no technical content detected, return neutral score
        if semantic_context.technical_depth < 3:
            return 0.8
        
        # Check for technical term consistency
        user_technical_terms = set(semantic_context.technical_terms)
        enhanced_technical_terms = set(self._extract_technical_terms(enhanced_prompt))
        
        # Calculate technical term preservation and enhancement
        if user_technical_terms:
            preserved_terms = user_technical_terms.intersection(enhanced_technical_terms)
            preservation_score = len(preserved_terms) / len(user_technical_terms)
        else:
            preservation_score = 1.0
        
        # Check for appropriate technical depth
        enhanced_technical_depth = len(enhanced_technical_terms)
        depth_appropriateness = min(enhanced_technical_depth / 10, 1.0)  # Normalize to 10 terms max
        
        # Check for technical structure and methodology
        technical_structure_indicators = [
            "architecture", "design", "implementation", "specification", "protocol",
            "algorithm", "framework", "system", "methodology", "approach"
        ]
        
        enhanced_lower = enhanced_prompt.lower()
        structure_score = sum(1 for indicator in technical_structure_indicators if indicator in enhanced_lower)
        structure_score = min(structure_score / 5, 1.0)
        
        # Combine technical accuracy scores
        technical_score = (preservation_score * 0.4) + (depth_appropriateness * 0.3) + (structure_score * 0.3)
        
        return min(technical_score, 1.0)
    
    def _calculate_user_preference_match(self, enhanced_prompt: str, semantic_context: SemanticContext, 
                                       user_prefs: UserPreferences) -> float:
        """Calculate how well the enhanced prompt matches user preferences."""
        
        preference_score = 0.0
        
        # Check complexity preference
        if user_prefs.preferred_complexity != "adaptive":
            # Implementation would check if complexity matches preference
            preference_score += 0.2  # Placeholder
        else:
            preference_score += 0.2  # Adaptive is always appropriate
        
        # Check length preference
        prompt_length = len(enhanced_prompt)
        length_scores = {
            "brief": 1.0 if prompt_length < 500 else 0.5,
            "moderate": 1.0 if 500 <= prompt_length < 1500 else 0.7,
            "comprehensive": 1.0 if 1500 <= prompt_length < 3000 else 0.8,
            "extensive": 1.0 if prompt_length >= 3000 else 0.6
        }
        preference_score += length_scores.get(user_prefs.preferred_length, 0.7) * 0.2
        
        # Check for required elements
        enhanced_lower = enhanced_prompt.lower()
        
        if user_prefs.include_examples and "example" in enhanced_lower:
            preference_score += 0.15
        if user_prefs.include_step_by_step and ("step" in enhanced_lower or "process" in enhanced_lower):
            preference_score += 0.15
        if user_prefs.include_best_practices and "best practice" in enhanced_lower:
            preference_score += 0.15
        if user_prefs.include_alternatives and ("alternative" in enhanced_lower or "option" in enhanced_lower):
            preference_score += 0.15
        
        return min(preference_score, 1.0)
    
    def _validate_relevance(self, user_input: str, enhanced_prompt: str, relevance_score: RelevanceScore) -> bool:
        """Validate that the enhanced prompt meets minimum relevance standards."""
        return relevance_score.overall_relevance >= 0.6
    
    def _validate_completeness(self, user_input: str, enhanced_prompt: str, semantic_context: SemanticContext) -> bool:
        """Validate completeness of the enhanced prompt."""
        # Check minimum length
        if len(enhanced_prompt) < len(user_input) * 3:
            return False
        
        # Check that primary concepts are addressed
        enhanced_concepts = self._extract_primary_concepts(enhanced_prompt)
        primary_coverage = sum(1 for concept in semantic_context.primary_concepts 
                             if concept in enhanced_concepts)
        
        return primary_coverage >= len(semantic_context.primary_concepts) * 0.7
    
    def _validate_accuracy(self, user_input: str, enhanced_prompt: str, semantic_context: SemanticContext) -> bool:
        """Validate accuracy and appropriateness of the enhanced prompt."""
        # Check that technical terms are used appropriately
        if semantic_context.technical_terms:
            enhanced_technical = self._extract_technical_terms(enhanced_prompt)
            # Should preserve at least 50% of original technical terms
            preserved = sum(1 for term in semantic_context.technical_terms if term in enhanced_technical)
            return preserved >= len(semantic_context.technical_terms) * 0.5
        
        return True
    
    def _validate_appropriateness(self, user_input: str, enhanced_prompt: str, semantic_context: SemanticContext) -> bool:
        """Validate appropriateness of tone and content."""
        # Check formality alignment
        user_formality = semantic_context.formality_level
        enhanced_formality = self._assess_formality_level(enhanced_prompt)
        formality_diff = abs(user_formality - enhanced_formality)
        
        return formality_diff <= 3  # Allow some variation but not extreme differences
    
    def update_user_preferences(self, user_id: str, preferences: UserPreferences):
        """Update user preferences for personalized prompt generation."""
        self.user_preferences_db[user_id] = preferences
    
    def learn_from_feedback(self, user_id: str, user_input: str, enhanced_prompt: str, 
                           feedback_score: float, feedback_comments: str = ""):
        """Learn from user feedback to improve future prompt generation."""
        learning_entry = {
            "user_input": user_input,
            "enhanced_prompt": enhanced_prompt,
            "feedback_score": feedback_score,
            "feedback_comments": feedback_comments,
            "timestamp": "now"  # In production, use actual timestamp
        }
        
        self.learning_patterns[user_id].append(learning_entry)
        
        # Analyze patterns and update preferences if needed
        if len(self.learning_patterns[user_id]) >= 5:
            self._analyze_learning_patterns(user_id)
    
    def _analyze_learning_patterns(self, user_id: str):
        """Analyze learning patterns to update user preferences automatically."""
        entries = self.learning_patterns[user_id]
        
        # Analyze feedback scores and adjust preferences
        avg_score = sum(entry["feedback_score"] for entry in entries[-10:]) / min(len(entries), 10)
        
        if avg_score < 0.7:  # If satisfaction is low, adjust preferences
            # This would implement machine learning to adjust preferences
            # For now, we'll use simple heuristics
            pass
    
    def get_relevance_level(self, relevance_score: RelevanceScore) -> RelevanceLevel:
        """Convert relevance score to categorical level."""
        overall = relevance_score.overall_relevance
        
        if overall >= 0.9:
            return RelevanceLevel.PERFECT
        elif overall >= 0.8:
            return RelevanceLevel.HIGH
        elif overall >= 0.6:
            return RelevanceLevel.MODERATE
        elif overall >= 0.4:
            return RelevanceLevel.LOW
        else:
            return RelevanceLevel.POOR