#!/usr/bin/env python3

import re
import json
import math
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
from enum import Enum
import hashlib

class PromptComplexity(Enum):
    SIMPLE = "simple"
    MODERATE = "moderate"
    COMPLEX = "complex"
    EXPERT = "expert"

class PromptIntent(Enum):
    CREATIVE = "creative"
    ANALYTICAL = "analytical"
    INSTRUCTIONAL = "instructional"
    CONVERSATIONAL = "conversational"
    TECHNICAL = "technical"
    RESEARCH = "research"
    PROBLEM_SOLVING = "problem_solving"
    SYNTHESIS = "synthesis"

@dataclass
class PromptAnalysis:
    complexity: PromptComplexity
    intent: PromptIntent
    domain: str
    confidence: float
    keywords: List[str]
    entities: List[str]
    sentiment: str
    length_category: str
    technical_depth: int
    creativity_level: int

@dataclass
class EnhancementMetrics:
    clarity_score: float
    specificity_score: float
    completeness_score: float
    effectiveness_score: float
    token_efficiency: float

class AdvancedPromptEngine:
    """
    Advanced prompt enhancement engine with sophisticated analysis and optimization capabilities.
    """
    
    def __init__(self):
        self.domain_patterns = self._initialize_domain_patterns()
        self.intent_patterns = self._initialize_intent_patterns()
        self.complexity_indicators = self._initialize_complexity_indicators()
        self.enhancement_strategies = self._initialize_enhancement_strategies()
        self.model_capabilities = self._initialize_model_capabilities()
        
    def _initialize_domain_patterns(self) -> Dict[str, List[str]]:
        """Initialize domain-specific pattern recognition."""
        return {
            "software_development": [
                "code", "function", "algorithm", "debug", "api", "database", "framework",
                "programming", "software", "application", "system", "architecture", "design pattern",
                "testing", "deployment", "version control", "git", "docker", "kubernetes",
                "microservices", "backend", "frontend", "fullstack", "devops", "ci/cd"
            ],
            "data_science": [
                "data", "analysis", "machine learning", "ai", "model", "dataset", "statistics",
                "visualization", "pandas", "numpy", "tensorflow", "pytorch", "sklearn",
                "regression", "classification", "clustering", "neural network", "deep learning",
                "feature engineering", "data mining", "predictive", "analytics"
            ],
            "business": [
                "strategy", "market", "revenue", "profit", "customer", "sales", "marketing",
                "growth", "roi", "kpi", "business model", "competitive analysis", "swot",
                "stakeholder", "budget", "forecast", "planning", "operations", "management"
            ],
            "creative_writing": [
                "story", "character", "plot", "narrative", "dialogue", "scene", "theme",
                "poetry", "novel", "screenplay", "creative", "fiction", "non-fiction",
                "memoir", "essay", "blog", "content", "copywriting", "marketing copy"
            ],
            "academic_research": [
                "research", "study", "analysis", "hypothesis", "methodology", "literature review",
                "citation", "peer review", "academic", "scholarly", "thesis", "dissertation",
                "journal", "publication", "experiment", "survey", "case study", "theory"
            ],
            "education": [
                "teach", "learn", "student", "curriculum", "lesson", "course", "training",
                "instruction", "pedagogy", "assessment", "evaluation", "educational",
                "classroom", "online learning", "e-learning", "tutorial", "workshop"
            ],
            "healthcare": [
                "medical", "health", "patient", "diagnosis", "treatment", "clinical",
                "healthcare", "medicine", "therapy", "symptoms", "disease", "condition",
                "pharmaceutical", "research", "epidemiology", "public health"
            ],
            "finance": [
                "investment", "portfolio", "trading", "financial", "banking", "insurance",
                "risk", "return", "valuation", "accounting", "audit", "compliance",
                "cryptocurrency", "blockchain", "fintech", "economics", "market analysis"
            ]
        }
    
    def _initialize_intent_patterns(self) -> Dict[PromptIntent, Dict[str, Any]]:
        """Initialize intent recognition patterns."""
        return {
            PromptIntent.CREATIVE: {
                "indicators": ["create", "write", "design", "imagine", "invent", "brainstorm", "generate"],
                "question_patterns": ["how can i create", "help me write", "design a"],
                "output_types": ["story", "poem", "design", "concept", "idea"]
            },
            PromptIntent.ANALYTICAL: {
                "indicators": ["analyze", "compare", "evaluate", "assess", "examine", "investigate"],
                "question_patterns": ["what are the differences", "compare and contrast", "analyze the"],
                "output_types": ["analysis", "comparison", "evaluation", "report"]
            },
            PromptIntent.INSTRUCTIONAL: {
                "indicators": ["explain", "teach", "show", "demonstrate", "guide", "instruct"],
                "question_patterns": ["how to", "explain how", "what is", "show me how"],
                "output_types": ["tutorial", "explanation", "guide", "instructions"]
            },
            PromptIntent.CONVERSATIONAL: {
                "indicators": ["discuss", "chat", "talk", "conversation", "dialogue"],
                "question_patterns": ["let's discuss", "what do you think", "can we talk about"],
                "output_types": ["discussion", "dialogue", "conversation"]
            },
            PromptIntent.TECHNICAL: {
                "indicators": ["implement", "code", "build", "develop", "configure", "optimize"],
                "question_patterns": ["how do i implement", "write code for", "build a system"],
                "output_types": ["code", "implementation", "technical solution", "architecture"]
            },
            PromptIntent.RESEARCH: {
                "indicators": ["research", "find", "investigate", "study", "explore", "survey"],
                "question_patterns": ["research on", "find information about", "what does research say"],
                "output_types": ["research summary", "literature review", "findings", "data"]
            },
            PromptIntent.PROBLEM_SOLVING: {
                "indicators": ["solve", "fix", "troubleshoot", "resolve", "debug", "address"],
                "question_patterns": ["how to solve", "fix this problem", "troubleshoot"],
                "output_types": ["solution", "fix", "resolution", "workaround"]
            },
            PromptIntent.SYNTHESIS: {
                "indicators": ["combine", "integrate", "synthesize", "merge", "consolidate"],
                "question_patterns": ["combine these ideas", "synthesize information", "integrate"],
                "output_types": ["synthesis", "integration", "consolidated view", "summary"]
            }
        }
    
    def _initialize_complexity_indicators(self) -> Dict[str, int]:
        """Initialize complexity scoring indicators."""
        return {
            # High complexity indicators
            "multi-step": 3, "complex": 3, "advanced": 3, "sophisticated": 3,
            "comprehensive": 3, "detailed": 2, "thorough": 2, "in-depth": 3,
            "enterprise": 3, "scalable": 2, "production": 2, "optimization": 2,
            
            # Medium complexity indicators
            "intermediate": 2, "moderate": 1, "standard": 1, "typical": 1,
            "regular": 1, "normal": 1, "basic": 0, "simple": 0,
            
            # Technical complexity indicators
            "algorithm": 2, "architecture": 2, "framework": 2, "system": 2,
            "integration": 2, "api": 1, "database": 2, "security": 2,
            
            # Domain complexity indicators
            "machine learning": 3, "artificial intelligence": 3, "blockchain": 3,
            "quantum": 3, "distributed": 3, "microservices": 2, "cloud": 2
        }
    
    def _initialize_enhancement_strategies(self) -> Dict[str, Dict[str, Any]]:
        """Initialize prompt enhancement strategies."""
        return {
            "clarity_enhancement": {
                "techniques": [
                    "Add specific context and background information",
                    "Define key terms and concepts clearly",
                    "Break down complex requests into steps",
                    "Provide concrete examples when helpful",
                    "Specify desired output format and structure"
                ]
            },
            "specificity_enhancement": {
                "techniques": [
                    "Add quantitative requirements (length, number, scope)",
                    "Specify target audience and expertise level",
                    "Include relevant constraints and limitations",
                    "Define success criteria and evaluation metrics",
                    "Provide domain-specific context and terminology"
                ]
            },
            "completeness_enhancement": {
                "techniques": [
                    "Include all necessary background information",
                    "Address potential edge cases and scenarios",
                    "Specify handling of ambiguous situations",
                    "Include relevant examples and counterexamples",
                    "Add quality assurance and validation requirements"
                ]
            },
            "effectiveness_enhancement": {
                "techniques": [
                    "Structure prompt for optimal AI processing",
                    "Use proven prompt engineering patterns",
                    "Include chain-of-thought reasoning triggers",
                    "Add role-playing and perspective elements",
                    "Incorporate iterative refinement instructions"
                ]
            }
        }
    
    def _initialize_model_capabilities(self) -> Dict[str, Dict[str, Any]]:
        """Initialize model-specific capabilities and optimization strategies."""
        return {
            "gpt4": {
                "strengths": ["reasoning", "analysis", "code", "math", "creative_writing"],
                "optimization_techniques": [
                    "Use step-by-step reasoning prompts",
                    "Leverage advanced reasoning capabilities",
                    "Include chain-of-thought instructions",
                    "Utilize few-shot learning examples",
                    "Request explicit reasoning process"
                ],
                "token_limit": 128000,
                "best_practices": [
                    "Break complex tasks into subtasks",
                    "Use structured output formats",
                    "Include verification steps",
                    "Request confidence levels"
                ]
            },
            "claude": {
                "strengths": ["safety", "analysis", "writing", "reasoning", "helpfulness"],
                "optimization_techniques": [
                    "Emphasize ethical considerations",
                    "Include safety and harm prevention",
                    "Use constitutional AI principles",
                    "Request balanced perspectives",
                    "Include uncertainty acknowledgment"
                ],
                "token_limit": 200000,
                "best_practices": [
                    "Frame requests positively",
                    "Include ethical guidelines",
                    "Request nuanced analysis",
                    "Encourage helpful responses"
                ]
            },
            "gemini": {
                "strengths": ["multimodal", "reasoning", "code", "math", "analysis"],
                "optimization_techniques": [
                    "Leverage multimodal capabilities",
                    "Use structured reasoning approaches",
                    "Include visual thinking when applicable",
                    "Request comprehensive analysis",
                    "Utilize advanced reasoning patterns"
                ],
                "token_limit": 1000000,
                "best_practices": [
                    "Use clear, structured prompts",
                    "Include context and examples",
                    "Request detailed explanations",
                    "Leverage long context capabilities"
                ]
            },
            "o1": {
                "strengths": ["reasoning", "math", "science", "problem_solving", "analysis"],
                "optimization_techniques": [
                    "Focus on complex reasoning tasks",
                    "Include mathematical and logical problems",
                    "Request step-by-step solutions",
                    "Leverage advanced problem-solving",
                    "Use scientific methodology prompts"
                ],
                "token_limit": 128000,
                "best_practices": [
                    "Present clear problem statements",
                    "Request detailed reasoning",
                    "Include verification steps",
                    "Use structured approaches"
                ]
            },
            "default": {
                "strengths": ["general", "helpful", "informative"],
                "optimization_techniques": [
                    "Use clear, structured prompts",
                    "Include relevant context",
                    "Request specific outputs",
                    "Provide examples when helpful"
                ],
                "token_limit": 4096,
                "best_practices": [
                    "Keep prompts concise but complete",
                    "Use simple, clear language",
                    "Include specific requirements"
                ]
            }
        }
    
    def analyze_prompt(self, user_input: str) -> PromptAnalysis:
        """Perform comprehensive analysis of the user's prompt."""
        # Normalize input
        text = user_input.lower().strip()
        words = text.split()
        
        # Analyze complexity
        complexity = self._analyze_complexity(text, words)
        
        # Detect intent
        intent = self._detect_intent(text, words)
        
        # Identify domain
        domain, domain_confidence = self._identify_domain(text, words)
        
        # Extract keywords and entities
        keywords = self._extract_keywords(text, words)
        entities = self._extract_entities(text)
        
        # Analyze sentiment and tone
        sentiment = self._analyze_sentiment(text)
        
        # Categorize length
        length_category = self._categorize_length(len(words))
        
        # Assess technical depth
        technical_depth = self._assess_technical_depth(text, words)
        
        # Measure creativity level
        creativity_level = self._measure_creativity_level(text, words)
        
        return PromptAnalysis(
            complexity=complexity,
            intent=intent,
            domain=domain,
            confidence=domain_confidence,
            keywords=keywords,
            entities=entities,
            sentiment=sentiment,
            length_category=length_category,
            technical_depth=technical_depth,
            creativity_level=creativity_level
        )
    
    def _analyze_complexity(self, text: str, words: List[str]) -> PromptComplexity:
        """Analyze the complexity level of the prompt."""
        complexity_score = 0
        
        # Check for complexity indicators
        for indicator, score in self.complexity_indicators.items():
            if indicator in text:
                complexity_score += score
        
        # Analyze sentence structure
        sentences = re.split(r'[.!?]+', text)
        avg_sentence_length = sum(len(s.split()) for s in sentences if s.strip()) / max(len(sentences), 1)
        
        if avg_sentence_length > 20:
            complexity_score += 2
        elif avg_sentence_length > 15:
            complexity_score += 1
        
        # Check for technical terms and jargon
        technical_terms = sum(1 for word in words if len(word) > 8 and word.isalpha())
        complexity_score += min(technical_terms // 3, 3)
        
        # Check for multiple requirements or conditions
        condition_words = ["if", "when", "unless", "provided", "assuming", "given"]
        complexity_score += sum(1 for word in condition_words if word in text)
        
        # Determine complexity level
        if complexity_score >= 8:
            return PromptComplexity.EXPERT
        elif complexity_score >= 5:
            return PromptComplexity.COMPLEX
        elif complexity_score >= 2:
            return PromptComplexity.MODERATE
        else:
            return PromptComplexity.SIMPLE
    
    def _detect_intent(self, text: str, words: List[str]) -> PromptIntent:
        """Detect the primary intent of the prompt."""
        intent_scores = {}
        
        for intent, patterns in self.intent_patterns.items():
            score = 0
            
            # Check for direct indicators
            for indicator in patterns["indicators"]:
                if indicator in text:
                    score += 2
            
            # Check for question patterns
            for pattern in patterns["question_patterns"]:
                if pattern in text:
                    score += 3
            
            # Check for output type mentions
            for output_type in patterns["output_types"]:
                if output_type in text:
                    score += 1
            
            intent_scores[intent] = score
        
        # Return the intent with the highest score
        if intent_scores:
            return max(intent_scores, key=intent_scores.get)
        else:
            return PromptIntent.CONVERSATIONAL
    
    def _identify_domain(self, text: str, words: List[str]) -> Tuple[str, float]:
        """Identify the domain and confidence level."""
        domain_scores = {}
        
        for domain, keywords in self.domain_patterns.items():
            score = sum(1 for keyword in keywords if keyword in text)
            if score > 0:
                domain_scores[domain] = score
        
        if not domain_scores:
            return "general", 0.5
        
        best_domain = max(domain_scores, key=domain_scores.get)
        max_score = domain_scores[best_domain]
        confidence = min(max_score / 5.0, 1.0)  # Normalize to 0-1
        
        return best_domain, confidence
    
    def _extract_keywords(self, text: str, words: List[str]) -> List[str]:
        """Extract important keywords from the prompt."""
        # Simple keyword extraction based on word frequency and importance
        stop_words = {"the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "can", "must"}
        
        keywords = []
        for word in words:
            if (len(word) > 3 and 
                word.isalpha() and 
                word not in stop_words and
                word not in keywords):
                keywords.append(word)
        
        return keywords[:10]  # Return top 10 keywords
    
    def _extract_entities(self, text: str) -> List[str]:
        """Extract named entities and important concepts."""
        # Simple entity extraction using patterns
        entities = []
        
        # Extract capitalized words (potential proper nouns)
        capitalized = re.findall(r'\b[A-Z][a-z]+\b', text)
        entities.extend(capitalized)
        
        # Extract technical terms and acronyms
        acronyms = re.findall(r'\b[A-Z]{2,}\b', text)
        entities.extend(acronyms)
        
        # Extract quoted terms
        quoted = re.findall(r'"([^"]*)"', text)
        entities.extend(quoted)
        
        return list(set(entities))[:10]  # Return unique entities, max 10
    
    def _analyze_sentiment(self, text: str) -> str:
        """Analyze the sentiment/tone of the prompt."""
        positive_words = ["good", "great", "excellent", "amazing", "wonderful", "fantastic", "love", "like", "enjoy", "happy", "excited"]
        negative_words = ["bad", "terrible", "awful", "hate", "dislike", "sad", "angry", "frustrated", "difficult", "problem", "issue"]
        urgent_words = ["urgent", "quickly", "asap", "immediately", "fast", "rush", "deadline", "emergency"]
        
        positive_count = sum(1 for word in positive_words if word in text)
        negative_count = sum(1 for word in negative_words if word in text)
        urgent_count = sum(1 for word in urgent_words if word in text)
        
        if urgent_count > 0:
            return "urgent"
        elif positive_count > negative_count:
            return "positive"
        elif negative_count > positive_count:
            return "negative"
        else:
            return "neutral"
    
    def _categorize_length(self, word_count: int) -> str:
        """Categorize the prompt length."""
        if word_count < 5:
            return "very_short"
        elif word_count < 15:
            return "short"
        elif word_count < 50:
            return "medium"
        elif word_count < 100:
            return "long"
        else:
            return "very_long"
    
    def _assess_technical_depth(self, text: str, words: List[str]) -> int:
        """Assess the technical depth on a scale of 0-10."""
        technical_score = 0
        
        # Check for technical domains
        for domain, keywords in self.domain_patterns.items():
            if domain in ["software_development", "data_science", "healthcare", "finance"]:
                matches = sum(1 for keyword in keywords if keyword in text)
                technical_score += matches
        
        # Check for technical indicators
        technical_indicators = ["algorithm", "implementation", "architecture", "framework", "api", "database", "system", "protocol", "methodology", "optimization"]
        technical_score += sum(1 for indicator in technical_indicators if indicator in text)
        
        return min(technical_score, 10)
    
    def _measure_creativity_level(self, text: str, words: List[str]) -> int:
        """Measure creativity level on a scale of 0-10."""
        creativity_score = 0
        
        creative_indicators = ["create", "design", "imagine", "invent", "brainstorm", "innovative", "original", "unique", "creative", "artistic", "story", "poem", "novel", "character", "plot"]
        creativity_score += sum(2 for indicator in creative_indicators if indicator in text)
        
        # Check for creative domains
        creative_domains = ["creative_writing", "design", "art", "marketing"]
        for domain in creative_domains:
            if domain in self.domain_patterns:
                matches = sum(1 for keyword in self.domain_patterns[domain] if keyword in text)
                creativity_score += matches
        
        return min(creativity_score, 10)
    
    def generate_enhanced_prompt(self, user_input: str, model: str = "default", template_override: str = None) -> Tuple[str, str, PromptAnalysis, EnhancementMetrics]:
        """Generate an enhanced prompt with sophisticated optimization."""
        # Analyze the input prompt
        analysis = self.analyze_prompt(user_input)
        
        # Select or override template based on analysis
        if template_override:
            template_key = template_override
        else:
            template_key = self._select_optimal_template(analysis)
        
        # Get model capabilities
        model_caps = self.model_capabilities.get(model, self.model_capabilities["default"])
        
        # Generate the enhanced prompt
        enhanced_prompt = self._build_enhanced_prompt(user_input, analysis, template_key, model_caps)
        
        # Calculate enhancement metrics
        metrics = self._calculate_enhancement_metrics(user_input, enhanced_prompt, analysis)
        
        # Get template name
        template_name = self._get_template_name(template_key, analysis)
        
        return enhanced_prompt, template_name, analysis, metrics
    
    def _select_optimal_template(self, analysis: PromptAnalysis) -> str:
        """Select the optimal template based on comprehensive analysis."""
        # Advanced template selection logic
        if analysis.intent == PromptIntent.CREATIVE:
            if analysis.creativity_level >= 7:
                return "advanced_creative"
            else:
                return "creative"
        elif analysis.intent == PromptIntent.TECHNICAL:
            if analysis.technical_depth >= 7:
                return "expert_technical"
            elif analysis.complexity == PromptComplexity.COMPLEX:
                return "advanced_technical"
            else:
                return "technical"
        elif analysis.intent == PromptIntent.ANALYTICAL:
            if analysis.complexity in [PromptComplexity.COMPLEX, PromptComplexity.EXPERT]:
                return "deep_analysis"
            else:
                return "analysis"
        elif analysis.intent == PromptIntent.RESEARCH:
            return "research_synthesis"
        elif analysis.intent == PromptIntent.PROBLEM_SOLVING:
            if analysis.complexity == PromptComplexity.EXPERT:
                return "expert_problem_solving"
            else:
                return "problem_solving"
        elif analysis.intent == PromptIntent.INSTRUCTIONAL:
            return "educational"
        else:
            return "general_expert"
    
    def _build_enhanced_prompt(self, user_input: str, analysis: PromptAnalysis, template_key: str, model_caps: Dict[str, Any]) -> str:
        """Build the enhanced prompt using advanced techniques."""
        # Get the base template
        template = self._get_advanced_template(template_key, analysis)
        
        # Apply model-specific optimizations
        model_instructions = self._generate_model_instructions(model_caps, analysis)
        
        # Add context and enhancement layers
        context_layer = self._generate_context_layer(analysis)
        optimization_layer = self._generate_optimization_layer(analysis, model_caps)
        validation_layer = self._generate_validation_layer(analysis)
        
        # Assemble the enhanced prompt
        enhanced_prompt = template.format(
            user_input=user_input,
            context_layer=context_layer,
            model_instructions=model_instructions,
            optimization_layer=optimization_layer,
            validation_layer=validation_layer,
            domain=analysis.domain,
            complexity=analysis.complexity.value,
            intent=analysis.intent.value
        )
        
        return enhanced_prompt
    
    def _get_advanced_template(self, template_key: str, analysis: PromptAnalysis) -> str:
        """Get advanced, context-aware templates."""
        templates = {
            "advanced_creative": """**🎨 ADVANCED CREATIVE SYNTHESIS**

**Role & Expertise:** You are a master creative professional with deep expertise in {domain} and advanced creative methodologies. You combine artistic vision with technical precision to produce exceptional creative work.

**Creative Challenge:** {user_input}

**Context & Framework:**
{context_layer}

**Creative Process Requirements:**
1. **Ideation Phase**: Begin with divergent thinking, exploring multiple creative angles and unconventional approaches
2. **Development Phase**: Refine and develop the most promising concepts with attention to craft and technique
3. **Synthesis Phase**: Integrate elements into a cohesive, polished creative output
4. **Innovation Layer**: Push creative boundaries while maintaining accessibility and impact

**Quality Standards:**
- Demonstrate originality and creative depth
- Show mastery of relevant creative techniques and principles
- Balance innovation with practical considerations
- Include rich sensory details and emotional resonance

{model_instructions}

{optimization_layer}

{validation_layer}""",

            "expert_technical": """**⚡ EXPERT TECHNICAL ARCHITECTURE**

**Role & Authority:** You are a distinguished technical architect and subject matter expert in {domain} with extensive experience in complex system design and implementation.

**Technical Challenge:** {user_input}

**Technical Context:**
{context_layer}

**Architecture & Implementation Framework:**
1. **Requirements Analysis**: Comprehensive analysis of functional and non-functional requirements
2. **System Design**: Scalable, maintainable architecture with proper separation of concerns
3. **Implementation Strategy**: Best practices, design patterns, and industry standards
4. **Quality Assurance**: Testing strategies, error handling, and performance optimization
5. **Documentation**: Clear technical documentation and code comments

**Technical Excellence Standards:**
- Follow SOLID principles and clean code practices
- Implement comprehensive error handling and logging
- Consider security, performance, and scalability implications
- Include proper testing and validation strategies
- Provide production-ready, enterprise-grade solutions

{model_instructions}

{optimization_layer}

{validation_layer}""",

            "deep_analysis": """**🔬 COMPREHENSIVE ANALYTICAL FRAMEWORK**

**Role & Methodology:** You are a senior research analyst and strategic thinker with expertise in {domain}. You employ rigorous analytical methodologies to provide deep, actionable insights.

**Analytical Objective:** {user_input}

**Analytical Context:**
{context_layer}

**Multi-Dimensional Analysis Framework:**
1. **Situational Analysis**: Current state assessment and contextual factors
2. **Stakeholder Analysis**: Key players, interests, and influence mapping
3. **Trend Analysis**: Historical patterns and emerging developments
4. **Comparative Analysis**: Benchmarking and best practice identification
5. **Risk Assessment**: Potential challenges and mitigation strategies
6. **Opportunity Identification**: Strategic advantages and growth potential
7. **Synthesis & Recommendations**: Actionable insights and strategic guidance

**Analytical Rigor Standards:**
- Use data-driven insights and evidence-based reasoning
- Consider multiple perspectives and potential biases
- Identify assumptions and limitations in the analysis
- Provide confidence levels for key conclusions
- Include both quantitative and qualitative factors

{model_instructions}

{optimization_layer}

{validation_layer}""",

            "research_synthesis": """**📚 ADVANCED RESEARCH SYNTHESIS**

**Role & Expertise:** You are a distinguished research scholar and information synthesis expert with deep knowledge in {domain} and advanced research methodologies.

**Research Inquiry:** {user_input}

**Research Context:**
{context_layer}

**Comprehensive Research Framework:**
1. **Literature Landscape**: Current state of knowledge and key research streams
2. **Methodological Considerations**: Research approaches and their strengths/limitations
3. **Evidence Synthesis**: Integration of findings across multiple sources and studies
4. **Gap Analysis**: Identification of knowledge gaps and research opportunities
5. **Critical Evaluation**: Assessment of evidence quality and reliability
6. **Theoretical Integration**: Connection to broader theoretical frameworks
7. **Future Directions**: Implications for future research and practice

**Research Excellence Standards:**
- Maintain scholarly rigor and objectivity
- Cite authoritative sources and recent developments
- Acknowledge limitations and uncertainties
- Present balanced perspectives on controversial topics
- Provide clear, evidence-based conclusions

{model_instructions}

{optimization_layer}

{validation_layer}""",

            "expert_problem_solving": """**🧩 EXPERT PROBLEM SOLVING METHODOLOGY**

**Role & Capability:** You are a master problem solver and strategic consultant with expertise in {domain} and advanced problem-solving methodologies.

**Complex Challenge:** {user_input}

**Problem Context:**
{context_layer}

**Systematic Problem-Solving Framework:**
1. **Problem Definition**: Clear articulation of the core problem and its dimensions
2. **Root Cause Analysis**: Deep investigation of underlying causes and contributing factors
3. **Solution Generation**: Creative ideation of multiple solution approaches
4. **Solution Evaluation**: Systematic assessment of feasibility, impact, and trade-offs
5. **Implementation Strategy**: Detailed execution plan with milestones and success metrics
6. **Risk Mitigation**: Identification and management of potential obstacles
7. **Monitoring & Adaptation**: Feedback loops and continuous improvement mechanisms

**Problem-Solving Excellence:**
- Apply systems thinking and holistic perspective
- Consider both short-term fixes and long-term solutions
- Balance innovation with practicality and constraints
- Include stakeholder impact and change management considerations
- Provide clear decision criteria and success metrics

{model_instructions}

{optimization_layer}

{validation_layer}""",

            "educational": """**🎓 ADVANCED EDUCATIONAL DESIGN**

**Role & Pedagogy:** You are a master educator and instructional designer with expertise in {domain} and advanced pedagogical methodologies.

**Learning Objective:** {user_input}

**Educational Context:**
{context_layer}

**Comprehensive Learning Framework:**
1. **Learning Analysis**: Understanding of learner needs, prior knowledge, and learning styles
2. **Objective Setting**: Clear, measurable learning outcomes and success criteria
3. **Content Structuring**: Logical progression from foundational to advanced concepts
4. **Engagement Strategies**: Interactive elements, real-world applications, and active learning
5. **Assessment Design**: Formative and summative evaluation methods
6. **Differentiation**: Adaptation for diverse learning needs and preferences
7. **Reflection & Transfer**: Connection to broader contexts and future applications

**Educational Excellence Standards:**
- Use evidence-based pedagogical approaches
- Include multiple learning modalities and representations
- Provide clear explanations with relevant examples and analogies
- Incorporate opportunities for practice and application
- Foster critical thinking and deep understanding

{model_instructions}

{optimization_layer}

{validation_layer}""",

            "general_expert": """**🧠 COMPREHENSIVE EXPERT CONSULTATION**

**Role & Authority:** You are a distinguished expert consultant with broad knowledge across disciplines and deep expertise in {domain}.

**Expert Consultation:** {user_input}

**Consultation Context:**
{context_layer}

**Expert Analysis Framework:**
1. **Comprehensive Assessment**: Thorough evaluation of all relevant factors and considerations
2. **Multi-Perspective Analysis**: Examination from various stakeholder and disciplinary viewpoints
3. **Best Practice Integration**: Application of proven methodologies and industry standards
4. **Innovation Opportunities**: Identification of novel approaches and emerging trends
5. **Strategic Recommendations**: Actionable guidance with clear rationale and expected outcomes
6. **Implementation Considerations**: Practical factors for successful execution
7. **Success Metrics**: Measurable indicators of progress and achievement

**Expert Consultation Standards:**
- Provide authoritative, well-reasoned guidance
- Balance theoretical knowledge with practical experience
- Consider ethical implications and broader impacts
- Acknowledge uncertainties and alternative viewpoints
- Deliver clear, actionable recommendations

{model_instructions}

{optimization_layer}

{validation_layer}"""
        }
        
        return templates.get(template_key, templates["general_expert"])
    
    def _generate_context_layer(self, analysis: PromptAnalysis) -> str:
        """Generate contextual information layer."""
        context_elements = []
        
        # Domain context
        if analysis.domain != "general":
            context_elements.append(f"**Domain Focus:** {analysis.domain.replace('_', ' ').title()}")
        
        # Complexity context
        if analysis.complexity in [PromptComplexity.COMPLEX, PromptComplexity.EXPERT]:
            context_elements.append(f"**Complexity Level:** {analysis.complexity.value.title()} - requiring advanced expertise and sophisticated approaches")
        
        # Intent context
        context_elements.append(f"**Primary Intent:** {analysis.intent.value.replace('_', ' ').title()}")
        
        # Technical depth
        if analysis.technical_depth >= 5:
            context_elements.append(f"**Technical Depth:** High ({analysis.technical_depth}/10) - requiring deep technical knowledge")
        
        # Creativity level
        if analysis.creativity_level >= 5:
            context_elements.append(f"**Creativity Level:** High ({analysis.creativity_level}/10) - requiring innovative and original thinking")
        
        # Keywords context
        if analysis.keywords:
            context_elements.append(f"**Key Concepts:** {', '.join(analysis.keywords[:5])}")
        
        return "\n".join(context_elements) if context_elements else "**Context:** General consultation requiring comprehensive expertise"
    
    def _generate_model_instructions(self, model_caps: Dict[str, Any], analysis: PromptAnalysis) -> str:
        """Generate model-specific optimization instructions."""
        instructions = []
        
        # Base model instructions
        instructions.extend(model_caps.get("optimization_techniques", []))
        
        # Complexity-based instructions
        if analysis.complexity == PromptComplexity.EXPERT:
            instructions.extend([
                "Apply your most advanced reasoning capabilities",
                "Consider multiple levels of abstraction and complexity",
                "Provide expert-level insights and nuanced analysis"
            ])
        elif analysis.complexity == PromptComplexity.COMPLEX:
            instructions.extend([
                "Use systematic, step-by-step reasoning",
                "Consider multiple perspectives and approaches",
                "Provide detailed explanations and rationale"
            ])
        
        # Intent-based instructions
        if analysis.intent == PromptIntent.CREATIVE:
            instructions.extend([
                "Embrace creative and innovative thinking",
                "Explore unconventional approaches and perspectives",
                "Balance creativity with practical considerations"
            ])
        elif analysis.intent == PromptIntent.ANALYTICAL:
            instructions.extend([
                "Apply rigorous analytical frameworks",
                "Use data-driven reasoning and evidence",
                "Provide balanced, objective analysis"
            ])
        
        formatted_instructions = "\n".join(f"- {instruction}" for instruction in instructions[:8])
        return f"**Model Optimization Guidelines:**\n{formatted_instructions}"
    
    def _generate_optimization_layer(self, analysis: PromptAnalysis, model_caps: Dict[str, Any]) -> str:
        """Generate optimization instructions layer."""
        optimizations = []
        
        # Token efficiency optimization
        token_limit = model_caps.get("token_limit", 4096)
        if token_limit > 50000:
            optimizations.append("**Comprehensive Detail:** Provide extensive detail and thorough coverage of all aspects")
        elif token_limit > 10000:
            optimizations.append("**Balanced Detail:** Provide substantial detail while maintaining focus on key points")
        else:
            optimizations.append("**Focused Efficiency:** Provide concise but complete responses within token constraints")
        
        # Complexity-based optimization
        if analysis.complexity == PromptComplexity.EXPERT:
            optimizations.append("**Expert Processing:** Engage your highest-level reasoning and most sophisticated analysis capabilities")
        
        # Domain-specific optimization
        if analysis.domain in ["software_development", "data_science"]:
            optimizations.append("**Technical Precision:** Ensure technical accuracy and follow industry best practices")
        elif analysis.domain == "creative_writing":
            optimizations.append("**Creative Excellence:** Prioritize originality, style, and artistic merit")
        
        return "\n".join(optimizations)
    
    def _generate_validation_layer(self, analysis: PromptAnalysis) -> str:
        """Generate validation and quality assurance layer."""
        validations = []
        
        # Universal validations
        validations.extend([
            "**Quality Assurance:** Ensure accuracy, completeness, and professional quality",
            "**Relevance Check:** Verify all content directly addresses the stated requirements"
        ])
        
        # Complexity-based validations
        if analysis.complexity in [PromptComplexity.COMPLEX, PromptComplexity.EXPERT]:
            validations.append("**Expert Review:** Apply expert-level scrutiny and validation to all recommendations")
        
        # Intent-based validations
        if analysis.intent == PromptIntent.TECHNICAL:
            validations.append("**Technical Validation:** Verify technical accuracy and feasibility of all solutions")
        elif analysis.intent == PromptIntent.CREATIVE:
            validations.append("**Creative Validation:** Ensure originality and creative merit while maintaining quality")
        
        # Domain-specific validations
        if analysis.domain in ["healthcare", "finance"]:
            validations.append("**Compliance Check:** Consider relevant regulations and ethical guidelines")
        
        return "\n".join(validations)
    
    def _calculate_enhancement_metrics(self, original: str, enhanced: str, analysis: PromptAnalysis) -> EnhancementMetrics:
        """Calculate metrics for prompt enhancement quality."""
        # Clarity score based on structure and specificity
        clarity_score = self._calculate_clarity_score(enhanced)
        
        # Specificity score based on detailed requirements
        specificity_score = self._calculate_specificity_score(enhanced, analysis)
        
        # Completeness score based on comprehensive coverage
        completeness_score = self._calculate_completeness_score(enhanced, analysis)
        
        # Effectiveness score based on prompt engineering best practices
        effectiveness_score = self._calculate_effectiveness_score(enhanced)
        
        # Token efficiency score
        token_efficiency = self._calculate_token_efficiency(original, enhanced)
        
        return EnhancementMetrics(
            clarity_score=clarity_score,
            specificity_score=specificity_score,
            completeness_score=completeness_score,
            effectiveness_score=effectiveness_score,
            token_efficiency=token_efficiency
        )
    
    def _calculate_clarity_score(self, prompt: str) -> float:
        """Calculate clarity score (0-1)."""
        score = 0.0
        
        # Structure indicators
        if "**" in prompt:  # Has structured sections
            score += 0.2
        if re.search(r'\d+\.', prompt):  # Has numbered lists
            score += 0.2
        if "Framework:" in prompt or "Requirements:" in prompt:
            score += 0.2
        
        # Clarity indicators
        clear_words = ["clear", "specific", "detailed", "comprehensive", "systematic"]
        score += min(sum(1 for word in clear_words if word in prompt.lower()) * 0.1, 0.4)
        
        return min(score, 1.0)
    
    def _calculate_specificity_score(self, prompt: str, analysis: PromptAnalysis) -> float:
        """Calculate specificity score (0-1)."""
        score = 0.0
        
        # Domain-specific terms
        if analysis.domain in self.domain_patterns:
            domain_terms = sum(1 for term in self.domain_patterns[analysis.domain] if term in prompt.lower())
            score += min(domain_terms * 0.05, 0.3)
        
        # Specific requirements
        requirement_indicators = ["requirements:", "standards:", "criteria:", "specifications:"]
        score += min(sum(0.1 for indicator in requirement_indicators if indicator.lower() in prompt.lower()), 0.3)
        
        # Quantitative elements
        if re.search(r'\d+', prompt):
            score += 0.2
        
        # Examples and constraints
        if "example" in prompt.lower() or "constraint" in prompt.lower():
            score += 0.2
        
        return min(score, 1.0)
    
    def _calculate_completeness_score(self, prompt: str, analysis: PromptAnalysis) -> float:
        """Calculate completeness score (0-1)."""
        score = 0.0
        
        # Essential components
        components = ["role", "task", "context", "requirements", "framework", "standards"]
        score += sum(0.15 for component in components if component.lower() in prompt.lower())
        
        # Comprehensive coverage
        if len(prompt.split()) > 200:  # Substantial content
            score += 0.1
        
        return min(score, 1.0)
    
    def _calculate_effectiveness_score(self, prompt: str) -> float:
        """Calculate effectiveness score based on prompt engineering best practices (0-1)."""
        score = 0.0
        
        # Role definition
        if "role" in prompt.lower() or "you are" in prompt.lower():
            score += 0.2
        
        # Clear task definition
        if any(word in prompt.lower() for word in ["task:", "objective:", "challenge:", "goal:"]):
            score += 0.2
        
        # Structured approach
        if re.search(r'framework|methodology|approach|process', prompt.lower()):
            score += 0.2
        
        # Quality standards
        if any(word in prompt.lower() for word in ["standards:", "excellence:", "quality:", "best practices"]):
            score += 0.2
        
        # Validation layer
        if any(word in prompt.lower() for word in ["validation:", "verification:", "quality assurance:"]):
            score += 0.2
        
        return min(score, 1.0)
    
    def _calculate_token_efficiency(self, original: str, enhanced: str) -> float:
        """Calculate token efficiency score (0-1)."""
        original_length = len(original.split())
        enhanced_length = len(enhanced.split())
        
        if original_length == 0:
            return 0.0
        
        expansion_ratio = enhanced_length / original_length
        
        # Optimal expansion is 3-8x for most prompts
        if 3 <= expansion_ratio <= 8:
            return 1.0
        elif 2 <= expansion_ratio < 3 or 8 < expansion_ratio <= 12:
            return 0.8
        elif 1.5 <= expansion_ratio < 2 or 12 < expansion_ratio <= 20:
            return 0.6
        else:
            return 0.4
    
    def _get_template_name(self, template_key: str, analysis: PromptAnalysis) -> str:
        """Get human-readable template name."""
        template_names = {
            "advanced_creative": "🎨 Advanced Creative Synthesis",
            "expert_technical": "⚡ Expert Technical Architecture", 
            "deep_analysis": "🔬 Comprehensive Analytical Framework",
            "research_synthesis": "📚 Advanced Research Synthesis",
            "expert_problem_solving": "🧩 Expert Problem Solving Methodology",
            "educational": "🎓 Advanced Educational Design",
            "general_expert": "🧠 Comprehensive Expert Consultation"
        }
        
        base_name = template_names.get(template_key, "🧠 Expert Consultation")
        
        # Add complexity indicator
        if analysis.complexity == PromptComplexity.EXPERT:
            return f"{base_name} (Expert Level)"
        elif analysis.complexity == PromptComplexity.COMPLEX:
            return f"{base_name} (Advanced)"
        else:
            return base_name