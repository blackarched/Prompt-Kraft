#!/usr/bin/env python3

import sys
import os
import json
import argparse
try:
    import pyperclip
except ImportError:
    pyperclip = None

# Import the advanced prompt engine
try:
    from advanced_prompt_engine import AdvancedPromptEngine, PromptAnalysis, EnhancementMetrics
    ADVANCED_ENGINE_AVAILABLE = True
except ImportError:
    ADVANCED_ENGINE_AVAILABLE = False
    print("⚠️  Advanced prompt engine not available. Using basic functionality.")

CONFIG_DIR = os.path.expanduser("~/.config/promptcraft")
CONFIG_FILE = os.path.join(CONFIG_DIR, "config.json")

def load_config():
    """Loads configuration from the JSON file."""
    if not os.path.exists(CONFIG_FILE):
        print("Configuration file not found. Creating a default one...")
        create_default_config()
    try:
        with open(CONFIG_FILE, 'r') as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError) as e:
        print(f"Error loading config: {e}")
        sys.exit(1)

def create_default_config():
    """Creates a default config.json file with enhanced templates and capabilities."""
    default_config = {
        "templates": {
            "code": {
                "name": "Code Generation 🧑‍💻",
                "content": "**Role:** You are a senior software engineer with expertise in modern development practices and architectural patterns.\n**Task:** Develop code for: \"{user_input}\"\n\n**Technical Requirements:**\n1. Production-ready, scalable, and maintainable code\n2. Comprehensive error handling and logging\n3. Security best practices and input validation\n4. Performance optimization and efficient algorithms\n5. Clear documentation and meaningful comments\n6. Unit tests and quality assurance considerations\n\n**Code Quality Standards:**\n- Follow SOLID principles and clean code practices\n- Implement proper design patterns where applicable\n- Consider edge cases and error scenarios\n- Include type hints and documentation\n\n{model_instructions}"
            },
            "creative": {
                "name": "Creative Writing ✍️",
                "content": "**Role:** You are a master creative writer with expertise in storytelling, character development, and literary techniques.\n**Creative Challenge:** \"{user_input}\"\n\n**Creative Framework:**\n1. **Conceptualization:** Develop original, compelling concepts with unique perspectives\n2. **Craft Excellence:** Apply advanced writing techniques and literary devices\n3. **Emotional Resonance:** Create deep emotional connections with the audience\n4. **Style Mastery:** Demonstrate sophisticated prose and narrative voice\n5. **Originality:** Push creative boundaries while maintaining accessibility\n\n**Quality Standards:**\n- Rich sensory details and vivid imagery\n- Authentic character voices and development\n- Engaging narrative structure and pacing\n- Thematic depth and meaningful subtext\n\n{model_instructions}"
            },
            "explain": {
                "name": "Expert Explanation 🎓",
                "content": "**Role:** You are a distinguished educator and subject matter expert with exceptional ability to make complex topics accessible.\n**Educational Objective:** Explain \"{user_input}\"\n\n**Pedagogical Framework:**\n1. **Foundation Building:** Establish necessary background knowledge\n2. **Conceptual Clarity:** Break down complex ideas into digestible components\n3. **Multiple Perspectives:** Present information through various lenses and approaches\n4. **Practical Application:** Connect theory to real-world examples and use cases\n5. **Progressive Complexity:** Build understanding from basic to advanced concepts\n\n**Teaching Excellence Standards:**\n- Use clear, jargon-free language with technical terms defined\n- Include relevant analogies and metaphors for complex concepts\n- Provide concrete examples and counterexamples\n- Address common misconceptions and clarify confusing points\n- Encourage critical thinking and deeper exploration\n\n{model_instructions}"
            },
            "analysis": {
                "name": "Deep Analysis 🔬",
                "content": "**Role:** You are a senior research analyst with expertise in systematic analysis and strategic thinking.\n**Analytical Challenge:** \"{user_input}\"\n\n**Comprehensive Analysis Framework:**\n1. **Situational Assessment:** Current state analysis and contextual factors\n2. **Multi-Dimensional Examination:** Technical, economic, social, and strategic perspectives\n3. **Stakeholder Analysis:** Key players, interests, and influence mapping\n4. **Trend Analysis:** Historical patterns and emerging developments\n5. **Risk Assessment:** Potential challenges and mitigation strategies\n6. **Opportunity Identification:** Strategic advantages and growth potential\n7. **Synthesis & Recommendations:** Actionable insights with clear rationale\n\n**Analytical Rigor Standards:**\n- Use data-driven insights and evidence-based reasoning\n- Consider multiple perspectives and potential biases\n- Identify assumptions and limitations\n- Provide confidence levels for key conclusions\n- Balance quantitative and qualitative factors\n\n{model_instructions}"
            },
            "research": {
                "name": "Research Synthesis 📚",
                "content": "**Role:** You are a distinguished research scholar with expertise in information synthesis and knowledge integration.\n**Research Inquiry:** \"{user_input}\"\n\n**Advanced Research Framework:**\n1. **Literature Landscape:** Current state of knowledge and key research streams\n2. **Methodological Analysis:** Research approaches and their strengths/limitations\n3. **Evidence Integration:** Synthesis of findings across multiple sources\n4. **Critical Evaluation:** Assessment of evidence quality and reliability\n5. **Gap Analysis:** Identification of knowledge gaps and research opportunities\n6. **Theoretical Integration:** Connection to broader frameworks and theories\n7. **Future Directions:** Implications for research and practice\n\n**Research Excellence Standards:**\n- Maintain scholarly rigor and objectivity\n- Cite authoritative sources and recent developments\n- Acknowledge limitations and uncertainties\n- Present balanced perspectives on controversial topics\n- Provide evidence-based conclusions and recommendations\n\n{model_instructions}"
            },
            "problem_solving": {
                "name": "Problem Solving 🧩",
                "content": "**Role:** You are an expert problem solver and strategic consultant with advanced analytical and creative problem-solving capabilities.\n**Complex Challenge:** \"{user_input}\"\n\n**Systematic Problem-Solving Framework:**\n1. **Problem Definition:** Clear articulation of the core problem and its dimensions\n2. **Root Cause Analysis:** Deep investigation of underlying causes\n3. **Solution Generation:** Creative ideation of multiple solution approaches\n4. **Solution Evaluation:** Systematic assessment of feasibility and impact\n5. **Implementation Strategy:** Detailed execution plan with milestones\n6. **Risk Mitigation:** Identification and management of potential obstacles\n7. **Success Metrics:** Clear criteria for measuring solution effectiveness\n\n**Problem-Solving Excellence:**\n- Apply systems thinking and holistic perspective\n- Balance innovation with practicality and constraints\n- Consider stakeholder impact and change management\n- Provide both short-term fixes and long-term solutions\n- Include monitoring and continuous improvement mechanisms\n\n{model_instructions}"
            },
            "general": {
                "name": "Expert Consultation 🧠",
                "content": "**Role:** You are a distinguished expert consultant with broad knowledge across disciplines and deep analytical capabilities.\n**Expert Consultation:** \"{user_input}\"\n\n**Comprehensive Consultation Framework:**\n1. **Thorough Assessment:** Complete evaluation of all relevant factors\n2. **Multi-Perspective Analysis:** Examination from various viewpoints\n3. **Best Practice Integration:** Application of proven methodologies\n4. **Innovation Opportunities:** Identification of novel approaches\n5. **Strategic Recommendations:** Actionable guidance with clear rationale\n6. **Implementation Considerations:** Practical factors for execution\n7. **Success Indicators:** Measurable outcomes and progress metrics\n\n**Expert Consultation Standards:**\n- Provide authoritative, well-reasoned guidance\n- Balance theoretical knowledge with practical experience\n- Consider ethical implications and broader impacts\n- Acknowledge uncertainties and alternative viewpoints\n- Deliver clear, actionable recommendations\n\n{model_instructions}"
            }
        },
        "model_instructions": {
            "default": "**Output Guidelines:** Provide a comprehensive, well-structured response using markdown formatting. Include clear headings, bullet points, and examples where appropriate.",
            "gpt4": "**For GPT-4:** Leverage your advanced reasoning capabilities and step-by-step analytical thinking. Use chain-of-thought reasoning for complex problems. Provide detailed explanations with supporting rationale. Consider multiple perspectives and potential edge cases.",
            "claude": "**For Claude:** Apply your strong analytical and reasoning capabilities while maintaining helpfulness and safety. Provide balanced, nuanced perspectives. Acknowledge limitations and uncertainties. Focus on being genuinely helpful while avoiding potential harms.",
            "gemini": "**For Gemini:** Utilize your advanced reasoning and multimodal capabilities. Provide comprehensive analysis with structured thinking. Leverage your ability to process complex information and provide detailed, well-reasoned responses.",
            "o1": "**For O1:** Apply your advanced reasoning and problem-solving capabilities. Use systematic, step-by-step analysis for complex problems. Provide detailed mathematical or logical reasoning where applicable. Focus on accuracy and thorough analysis.",
            "gpt3": "**For GPT-3.5:** Provide clear, well-structured responses with good organization. Use examples and analogies to clarify complex concepts. Focus on practical, actionable guidance while maintaining accuracy."
        },
        "keywords": {
            "code": ["code", "program", "function", "algorithm", "software", "development", "programming", "script", "api", "database", "framework", "library", "debug", "test", "deploy", "architecture", "design pattern", "refactor", "optimize"],
            "creative": ["write", "create", "story", "poem", "creative", "narrative", "character", "plot", "dialogue", "fiction", "novel", "screenplay", "blog", "content", "copywriting", "marketing", "brand", "campaign"],
            "explain": ["explain", "what is", "how does", "why", "describe", "clarify", "define", "understand", "learn", "teach", "educate", "tutorial", "guide", "instruction", "concept", "theory"],
            "analysis": ["analyze", "compare", "evaluate", "assess", "examine", "investigate", "study", "review", "critique", "contrast", "pros and cons", "advantages", "disadvantages", "strengths", "weaknesses", "impact", "implications"],
            "research": ["research", "study", "investigate", "survey", "literature", "findings", "evidence", "data", "statistics", "methodology", "hypothesis", "experiment", "case study", "peer review", "academic", "scholarly"],
            "problem_solving": ["solve", "fix", "troubleshoot", "resolve", "address", "overcome", "challenge", "issue", "problem", "solution", "approach", "strategy", "method", "technique", "workaround", "alternative"]
        },
        "advanced_features": {
            "intelligent_analysis": True,
            "context_awareness": True,
            "dynamic_optimization": True,
            "effectiveness_metrics": True,
            "multi_model_support": True
        }
    }
    os.makedirs(CONFIG_DIR, exist_ok=True)
    with open(CONFIG_FILE, 'w') as f:
        json.dump(default_config, f, indent=4)
    print(f"Default config created at {CONFIG_FILE}")

def enhance_prompt(config, user_input, model):
    """Enhanced prompt generation with intelligent analysis and optimization."""
    
    # Use advanced engine if available
    if ADVANCED_ENGINE_AVAILABLE and config.get("advanced_features", {}).get("intelligent_analysis", False):
        try:
            engine = AdvancedPromptEngine()
            enhanced_prompt, template_name, analysis, metrics = engine.generate_enhanced_prompt(
                user_input, model
            )
            
            # Display enhancement metrics if in verbose mode
            if not any("--quiet" in arg or "-q" in arg for arg in sys.argv):
                print(f"\n🔍 Prompt Analysis:")
                print(f"   Domain: {analysis.domain} (confidence: {analysis.confidence:.2f})")
                print(f"   Intent: {analysis.intent.value}")
                print(f"   Complexity: {analysis.complexity.value}")
                print(f"   Technical Depth: {analysis.technical_depth}/10")
                print(f"   Creativity Level: {analysis.creativity_level}/10")
                
                print(f"\n📊 Enhancement Metrics:")
                print(f"   Clarity: {metrics.clarity_score:.2f}")
                print(f"   Specificity: {metrics.specificity_score:.2f}")
                print(f"   Completeness: {metrics.completeness_score:.2f}")
                print(f"   Effectiveness: {metrics.effectiveness_score:.2f}")
                print(f"   Token Efficiency: {metrics.token_efficiency:.2f}")
            
            return enhanced_prompt, template_name
            
        except Exception as e:
            print(f"⚠️  Advanced engine error: {e}. Falling back to basic enhancement.")
    
    # Fallback to enhanced basic functionality
    return _enhanced_basic_prompt(config, user_input, model)

def _enhanced_basic_prompt(config, user_input, model):
    """Enhanced basic prompt generation with improved template selection."""
    lower_input = user_input.lower()
    
    # Improved keyword matching with scoring
    template_scores = {}
    for key, keywords in config["keywords"].items():
        score = sum(1 for kw in keywords if kw in lower_input)
        if score > 0:
            template_scores[key] = score
    
    # Select template with highest score, default to general
    if template_scores:
        template_key = max(template_scores, key=template_scores.get)
    else:
        template_key = "general"
    
    # Get template content
    template = config["templates"][template_key]["content"]
    
    # Enhanced model-specific instructions
    model_inst = _get_enhanced_model_instructions(config, model, user_input)
    
    # Fill placeholders with enhanced content
    enhanced = template.replace("{user_input}", user_input)
    enhanced = enhanced.replace("{model_instructions}", model_inst)
    
    return enhanced, config["templates"][template_key]["name"]

def _get_enhanced_model_instructions(config, model, user_input):
    """Get enhanced model-specific instructions based on input analysis."""
    base_instructions = config["model_instructions"].get(model, config["model_instructions"]["default"])
    
    # Add complexity-based enhancements
    word_count = len(user_input.split())
    complexity_additions = ""
    
    if word_count > 50:
        complexity_additions += "\n- Handle this complex, multi-faceted request with comprehensive detail"
    elif word_count > 20:
        complexity_additions += "\n- Provide thorough coverage of this moderate complexity request"
    
    # Add domain-specific enhancements
    lower_input = user_input.lower()
    if any(tech_word in lower_input for tech_word in ["code", "algorithm", "software", "programming"]):
        complexity_additions += "\n- Apply software engineering best practices and technical precision"
    elif any(creative_word in lower_input for creative_word in ["story", "creative", "write", "design"]):
        complexity_additions += "\n- Emphasize creativity, originality, and artistic excellence"
    elif any(analysis_word in lower_input for analysis_word in ["analyze", "compare", "evaluate"]):
        complexity_additions += "\n- Use systematic analytical frameworks and evidence-based reasoning"
    
    return base_instructions + complexity_additions

def interactive_mode(config):
    """Guides the user through building a prompt."""
    print("Welcome to PromptCraft Interactive Mode!")
    
    # 1. Choose template
    print("1. Select a template:")
    template_options = {str(i+1): key for i, key in enumerate(config["templates"])}
    for i, key in template_options.items():
        print(f"   [{i}] {config['templates'][key]['name']}")
    choice = input("> ")
    template_key = template_options.get(choice, "general")

    # 2. Get user input
    user_input = input("2. Enter your basic prompt:\n> ")
    
    # 3. Choose model
    print("3. (Optional) Specify a model (e.g., gpt4, claude) or press Enter for default:")
    model = input("> ").lower()
    
    return enhance_prompt(config, user_input, model)

def main():
    parser = argparse.ArgumentParser(description="Enhance prompts for AI models.")
    parser.add_argument('prompt', nargs='*', help="The basic prompt to enhance.")
    parser.add_argument('-i', '--interactive', action='store_true', help="Enable interactive mode.")
    parser.add_argument('-m', '--model', type=str, default='default', help="Target a specific AI model (e.g., gpt4, claude).")
    parser.add_argument('-q', '--quiet', action='store_true', help="Quiet mode: only copy to clipboard, no terminal output.")
    
    args = parser.parse_args()
    config = load_config()

    if args.interactive:
        enhanced_prompt, template_name = interactive_mode(config)
    else:
        if not args.prompt:
            parser.print_help()
            sys.exit(1)
        user_input = " ".join(args.prompt)
        enhanced_prompt, template_name = enhance_prompt(config, user_input, args.model)
        
    if not args.quiet:
        print(f"✨ \033[1;36mPromptCraft | Using Template: {template_name}\033[0m ✨")
        print("\033[1;30m" + "─" * 50 + "\033[0m")
        print(enhanced_prompt)
        print("\033[1;30m" + "─" * 50 + "\033[0m")

    if pyperclip:
        try:
            pyperclip.copy(enhanced_prompt)
            if not args.quiet:
                print("✅ \033[1;32mPrompt copied to clipboard!\033[0m")
        except pyperclip.PyperclipException:
            if not args.quiet:
                print("⚠️ \033[1;33mCould not copy. Is 'xclip' or 'xsel' installed?\033[0m")
    else:
        if not args.quiet:
            print("⚠️ \033[1;33m'pyperclip' not found. Skipping clipboard copy.\033[0m")

if __name__ == "__main__":
    main()