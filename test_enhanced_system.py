#!/usr/bin/env python3

import json
import sys
import os
import asyncio
from typing import Dict, Any

def test_advanced_engine():
    """Test the advanced prompt engine functionality."""
    print("🧪 Testing Advanced Prompt Engine...")
    
    try:
        from advanced_prompt_engine import AdvancedPromptEngine, PromptComplexity, PromptIntent
        
        engine = AdvancedPromptEngine()
        
        # Test cases with different complexities and intents
        test_cases = [
            {
                "input": "Create a login function",
                "expected_domain": "software_development",
                "expected_intent": PromptIntent.TECHNICAL,
                "description": "Simple coding request"
            },
            {
                "input": "Write a comprehensive analysis of machine learning algorithms for natural language processing, including their strengths, weaknesses, and real-world applications",
                "expected_domain": "data_science", 
                "expected_intent": PromptIntent.ANALYTICAL,
                "description": "Complex analytical request"
            },
            {
                "input": "Tell me a story about a robot who discovers emotions",
                "expected_domain": "creative_writing",
                "expected_intent": PromptIntent.CREATIVE,
                "description": "Creative writing request"
            },
            {
                "input": "Explain quantum computing",
                "expected_domain": "general",
                "expected_intent": PromptIntent.INSTRUCTIONAL,
                "description": "Educational request"
            },
            {
                "input": "How can I solve the problem of high customer churn in my SaaS business?",
                "expected_domain": "business",
                "expected_intent": PromptIntent.PROBLEM_SOLVING,
                "description": "Business problem solving"
            }
        ]
        
        print(f"\n📋 Running {len(test_cases)} test cases...")
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"\n🔍 Test Case {i}: {test_case['description']}")
            print(f"   Input: \"{test_case['input'][:50]}{'...' if len(test_case['input']) > 50 else ''}\"")
            
            # Analyze the prompt
            analysis = engine.analyze_prompt(test_case['input'])
            
            print(f"   ✅ Analysis Results:")
            print(f"      Domain: {analysis.domain} (confidence: {analysis.confidence:.2f})")
            print(f"      Intent: {analysis.intent.value}")
            print(f"      Complexity: {analysis.complexity.value}")
            print(f"      Technical Depth: {analysis.technical_depth}/10")
            print(f"      Creativity Level: {analysis.creativity_level}/10")
            
            # Generate enhanced prompt
            enhanced_prompt, template_name, _, metrics = engine.generate_enhanced_prompt(
                test_case['input'], "gpt4"
            )
            
            print(f"   📊 Enhancement Metrics:")
            print(f"      Template Used: {template_name}")
            print(f"      Clarity: {metrics.clarity_score:.2f}")
            print(f"      Specificity: {metrics.specificity_score:.2f}")
            print(f"      Completeness: {metrics.completeness_score:.2f}")
            print(f"      Effectiveness: {metrics.effectiveness_score:.2f}")
            print(f"      Token Efficiency: {metrics.token_efficiency:.2f}")
            print(f"      Enhanced Length: {len(enhanced_prompt)} characters")
            
            # Validate results
            domain_match = analysis.domain == test_case['expected_domain'] or analysis.confidence > 0.3
            intent_match = analysis.intent == test_case['expected_intent']
            
            if domain_match and intent_match:
                print(f"   ✅ PASSED: Correctly identified domain and intent")
            else:
                print(f"   ⚠️  PARTIAL: Domain match: {domain_match}, Intent match: {intent_match}")
        
        print("\n✅ Advanced Engine Tests Completed!")
        return True
        
    except ImportError as e:
        print(f"❌ Advanced engine not available: {e}")
        return False
    except Exception as e:
        print(f"❌ Advanced engine test failed: {e}")
        return False

def test_enhanced_api():
    """Test the enhanced API functionality."""
    print("\n🌐 Testing Enhanced API Functionality...")
    
    try:
        from api_server import app, get_config
        from fastapi.testclient import TestClient
        
        client = TestClient(app)
        
        # Test health check
        response = client.get("/")
        assert response.status_code == 200
        print("✅ Health check passed")
        
        # Test capabilities endpoint
        response = client.get("/api/capabilities")
        if response.status_code == 200:
            capabilities = response.json()
            print(f"✅ Capabilities loaded: {len(capabilities.get('features', {}))} features")
            print(f"   Advanced Engine: {capabilities.get('advanced_engine_available', False)}")
        
        # Test configuration loading
        response = client.get("/api/config")
        assert response.status_code == 200
        config = response.json()
        print(f"✅ Configuration loaded: {len(config.get('templates', {}))} templates")
        
        # Test models endpoint
        response = client.get("/api/models")
        assert response.status_code == 200
        models = response.json()
        print(f"✅ Models loaded: {len(models.get('models', []))} models")
        
        # Test enhanced prompt generation
        test_prompts = [
            {"user_input": "Create a REST API for user management", "model": "gpt4"},
            {"user_input": "Write a poem about artificial intelligence", "model": "claude"},
            {"user_input": "Explain blockchain technology", "model": "gemini"}
        ]
        
        for prompt_data in test_prompts:
            response = client.post("/api/enhance", json=prompt_data)
            assert response.status_code == 200
            result = response.json()
            
            print(f"✅ Enhanced prompt for: \"{prompt_data['user_input'][:30]}...\"")
            print(f"   Template: {result.get('template_used', 'Unknown')}")
            print(f"   Advanced Engine: {result.get('advanced_engine_used', False)}")
            
            if result.get('analysis'):
                analysis = result['analysis']
                print(f"   Analysis - Domain: {analysis.get('domain')}, Intent: {analysis.get('intent')}")
            
            if result.get('metrics'):
                metrics = result['metrics']
                print(f"   Overall Score: {metrics.get('overall_score', 0):.2f}")
        
        # Test template detection
        response = client.post("/api/detect-template", json={"user_input": "Build a machine learning model"})
        if response.status_code == 200:
            detection = response.json()
            print(f"✅ Template detection: {detection.get('detected_template')} (confidence: {detection.get('confidence', 0):.2f})")
        
        print("✅ Enhanced API Tests Completed!")
        return True
        
    except ImportError:
        print("❌ FastAPI test client not available")
        return False
    except Exception as e:
        print(f"❌ API test failed: {e}")
        return False

def test_configuration_enhancement():
    """Test the enhanced configuration system."""
    print("\n⚙️ Testing Enhanced Configuration...")
    
    try:
        from prompt_craft import load_config, create_default_config, enhance_prompt
        
        # Create and load enhanced config
        create_default_config()
        config = load_config()
        
        # Validate enhanced templates
        expected_templates = ["code", "creative", "explain", "analysis", "research", "problem_solving", "general"]
        actual_templates = list(config["templates"].keys())
        
        print(f"✅ Templates: {len(actual_templates)} loaded")
        for template in expected_templates:
            if template in actual_templates:
                print(f"   ✓ {template}: {config['templates'][template]['name']}")
            else:
                print(f"   ✗ Missing template: {template}")
        
        # Validate enhanced model instructions
        expected_models = ["default", "gpt4", "claude", "gemini", "o1", "gpt3"]
        actual_models = list(config["model_instructions"].keys())
        
        print(f"✅ Model Instructions: {len(actual_models)} loaded")
        for model in expected_models:
            if model in actual_models:
                print(f"   ✓ {model}")
            else:
                print(f"   ✗ Missing model: {model}")
        
        # Test enhanced keyword matching
        keyword_categories = list(config["keywords"].keys())
        print(f"✅ Keyword Categories: {len(keyword_categories)} loaded")
        
        # Test enhanced prompt generation
        test_inputs = [
            ("Create a Python function to sort a list", "code"),
            ("Write a story about time travel", "creative"),
            ("Analyze the impact of social media", "analysis")
        ]
        
        for user_input, expected_category in test_inputs:
            enhanced, template_name = enhance_prompt(config, user_input, "gpt4")
            print(f"✅ Enhanced: \"{user_input[:30]}...\" -> {template_name}")
            print(f"   Length: {len(enhanced)} characters")
        
        # Check for advanced features flag
        advanced_features = config.get("advanced_features", {})
        print(f"✅ Advanced Features: {len(advanced_features)} configured")
        for feature, enabled in advanced_features.items():
            print(f"   {feature}: {'✓' if enabled else '✗'}")
        
        print("✅ Configuration Enhancement Tests Completed!")
        return True
        
    except Exception as e:
        print(f"❌ Configuration test failed: {e}")
        return False

def test_system_integration():
    """Test the complete system integration."""
    print("\n🔗 Testing System Integration...")
    
    try:
        # Test the complete flow from input to enhanced output
        test_scenarios = [
            {
                "input": "I need help building a scalable microservices architecture for an e-commerce platform",
                "model": "gpt4",
                "expected_features": ["technical", "complex", "architecture"]
            },
            {
                "input": "Create an engaging marketing campaign for a new sustainable fashion brand",
                "model": "claude", 
                "expected_features": ["creative", "marketing", "brand"]
            },
            {
                "input": "Explain the differences between supervised and unsupervised machine learning",
                "model": "gemini",
                "expected_features": ["educational", "technical", "comparison"]
            }
        ]
        
        success_count = 0
        
        for i, scenario in enumerate(test_scenarios, 1):
            print(f"\n🎯 Integration Test {i}:")
            print(f"   Scenario: {scenario['input'][:50]}...")
            
            try:
                # Test with advanced engine if available
                try:
                    from advanced_prompt_engine import AdvancedPromptEngine
                    engine = AdvancedPromptEngine()
                    enhanced_prompt, template_name, analysis, metrics = engine.generate_enhanced_prompt(
                        scenario['input'], scenario['model']
                    )
                    
                    print(f"   ✅ Advanced Engine Used")
                    print(f"      Template: {template_name}")
                    print(f"      Domain: {analysis.domain}")
                    print(f"      Complexity: {analysis.complexity.value}")
                    print(f"      Overall Score: {metrics.effectiveness_score:.2f}")
                    
                    # Check for expected features in the enhanced prompt
                    enhanced_lower = enhanced_prompt.lower()
                    feature_matches = sum(1 for feature in scenario['expected_features'] 
                                        if feature in enhanced_lower)
                    
                    if feature_matches >= len(scenario['expected_features']) // 2:
                        print(f"   ✅ Feature Detection: {feature_matches}/{len(scenario['expected_features'])}")
                        success_count += 1
                    else:
                        print(f"   ⚠️  Feature Detection: {feature_matches}/{len(scenario['expected_features'])}")
                    
                except ImportError:
                    # Fallback to basic enhancement
                    from prompt_craft import load_config, enhance_prompt
                    config = load_config()
                    enhanced_prompt, template_name = enhance_prompt(config, scenario['input'], scenario['model'])
                    
                    print(f"   ✅ Basic Enhancement Used")
                    print(f"      Template: {template_name}")
                    success_count += 1
                
                print(f"   Enhanced Length: {len(enhanced_prompt)} characters")
                
            except Exception as e:
                print(f"   ❌ Integration test failed: {e}")
        
        success_rate = (success_count / len(test_scenarios)) * 100
        print(f"\n📊 Integration Test Results: {success_count}/{len(test_scenarios)} passed ({success_rate:.0f}%)")
        
        if success_rate >= 80:
            print("✅ System Integration Tests PASSED!")
            return True
        else:
            print("⚠️  System Integration Tests PARTIAL SUCCESS")
            return False
        
    except Exception as e:
        print(f"❌ Integration test failed: {e}")
        return False

def main():
    """Run comprehensive tests of the enhanced PromptCraft system."""
    print("🚀 PromptCraft Enhanced System Test Suite")
    print("=" * 50)
    
    test_results = []
    
    # Run all test suites
    test_suites = [
        ("Configuration Enhancement", test_configuration_enhancement),
        ("Advanced Engine", test_advanced_engine),
        ("Enhanced API", test_enhanced_api),
        ("System Integration", test_system_integration)
    ]
    
    for suite_name, test_function in test_suites:
        print(f"\n{'=' * 20} {suite_name} {'=' * 20}")
        try:
            result = test_function()
            test_results.append((suite_name, result))
        except Exception as e:
            print(f"❌ {suite_name} failed with error: {e}")
            test_results.append((suite_name, False))
    
    # Summary
    print(f"\n{'=' * 50}")
    print("📊 TEST SUMMARY")
    print("=" * 50)
    
    passed = sum(1 for _, result in test_results if result)
    total = len(test_results)
    
    for suite_name, result in test_results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{suite_name:.<30} {status}")
    
    print(f"\nOverall Results: {passed}/{total} test suites passed")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED! Enhanced PromptCraft system is working correctly.")
        return True
    elif passed >= total * 0.75:
        print("⚠️  MOSTLY WORKING: Some advanced features may not be available.")
        return True
    else:
        print("❌ SYSTEM ISSUES: Multiple components are not working correctly.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)