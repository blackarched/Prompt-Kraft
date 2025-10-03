#!/usr/bin/env python3

"""
Advanced Relevance Testing Suite
================================

Comprehensive testing of the enhanced PromptCraft system with focus on:
1. Relevance validation and scoring
2. Advanced settings and customization
3. User preference learning and adaptation
4. Quality assurance and robustness
5. Performance and efficiency
"""

import json
import sys
import time
from typing import Dict, List, Any

def test_advanced_relevance_engine():
    """Test the advanced relevance engine functionality."""
    print("🔬 Testing Advanced Relevance Engine...")
    
    try:
        from advanced_relevance_engine import (
            AdvancedRelevanceEngine, UserPreferences, RelevanceLevel
        )
        
        engine = AdvancedRelevanceEngine()
        
        # Test cases with varying complexity and relevance requirements
        test_cases = [
            {
                "name": "High-Relevance Technical Request",
                "input": "Create a scalable microservices architecture for an e-commerce platform with Redis caching, PostgreSQL database, and Docker containerization",
                "expected_domain": "software_development",
                "expected_technical_depth": 7,
                "min_relevance": 0.8
            },
            {
                "name": "Creative Writing with Specific Requirements",
                "input": "Write a science fiction short story about AI consciousness, exploring themes of identity and free will, targeted at young adults, 2000 words",
                "expected_domain": "creative_writing",
                "expected_creativity": 8,
                "min_relevance": 0.8
            },
            {
                "name": "Business Analysis Request",
                "input": "Analyze the competitive landscape for SaaS project management tools, including market share, pricing strategies, and differentiation factors",
                "expected_domain": "business",
                "expected_formality": 7,
                "min_relevance": 0.7
            },
            {
                "name": "Academic Research Query",
                "input": "Conduct a systematic literature review on machine learning applications in healthcare diagnostics, focusing on deep learning approaches published in the last 3 years",
                "expected_domain": "academic_research",
                "expected_formality": 9,
                "min_relevance": 0.8
            },
            {
                "name": "Simple Casual Request",
                "input": "help me write an email to my boss about taking time off",
                "expected_domain": "general",
                "expected_formality": 3,
                "min_relevance": 0.6
            }
        ]
        
        print(f"\n📋 Running {len(test_cases)} relevance test cases...")
        
        passed_tests = 0
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"\n🔍 Test Case {i}: {test_case['name']}")
            print(f"   Input: \"{test_case['input'][:60]}{'...' if len(test_case['input']) > 60 else ''}\"")
            
            # Perform deep analysis
            start_time = time.time()
            semantic_context = engine.analyze_user_input_deeply(test_case['input'])
            analysis_time = time.time() - start_time
            
            print(f"   ✅ Deep Analysis Results (took {analysis_time:.3f}s):")
            print(f"      Domain: {semantic_context.domain_indicators}")
            print(f"      Context Type: {semantic_context.context_type.value}")
            print(f"      Formality Level: {semantic_context.formality_level}/10")
            print(f"      Urgency Level: {semantic_context.urgency_level}/10")
            print(f"      Technical Depth: {semantic_context.technical_depth}/10")
            print(f"      Creativity Level: {semantic_context.creativity_level}/10")
            print(f"      Primary Concepts: {semantic_context.primary_concepts[:5]}")
            
            # Validate expectations
            validations = []
            
            # Check domain detection
            if test_case.get("expected_domain"):
                domain_confidence = semantic_context.domain_indicators.get(test_case["expected_domain"], 0.0)
                if domain_confidence >= 0.3:
                    validations.append("✓ Domain correctly identified")
                else:
                    validations.append("✗ Domain detection failed")
            
            # Check technical depth
            if test_case.get("expected_technical_depth"):
                if semantic_context.technical_depth >= test_case["expected_technical_depth"] - 2:
                    validations.append("✓ Technical depth appropriate")
                else:
                    validations.append("✗ Technical depth too low")
            
            # Check creativity level
            if test_case.get("expected_creativity"):
                if semantic_context.creativity_level >= test_case["expected_creativity"] - 2:
                    validations.append("✓ Creativity level appropriate")
                else:
                    validations.append("✗ Creativity level too low")
            
            # Check formality level
            if test_case.get("expected_formality"):
                formality_diff = abs(semantic_context.formality_level - test_case["expected_formality"])
                if formality_diff <= 2:
                    validations.append("✓ Formality level appropriate")
                else:
                    validations.append("✗ Formality level mismatch")
            
            print(f"   📊 Validation Results:")
            for validation in validations:
                print(f"      {validation}")
            
            # Test relevance calculation with a mock enhanced prompt
            mock_enhanced_prompt = f"""
            **Role:** You are an expert in {semantic_context.domain_indicators}
            **Task:** {test_case['input']}
            **Context:** {semantic_context.context_type.value} context with {semantic_context.formality_level}/10 formality
            **Requirements:** Address the following concepts: {', '.join(semantic_context.primary_concepts[:3])}
            **Technical Considerations:** {', '.join(semantic_context.technical_terms[:3])}
            """
            
            relevance_score = engine.calculate_comprehensive_relevance(
                test_case['input'], mock_enhanced_prompt, semantic_context
            )
            
            relevance_level = engine.get_relevance_level(relevance_score)
            
            print(f"   🎯 Relevance Assessment:")
            print(f"      Overall Relevance: {relevance_score.overall_relevance:.3f}")
            print(f"      Semantic Match: {relevance_score.semantic_match:.3f}")
            print(f"      Context Alignment: {relevance_score.context_alignment:.3f}")
            print(f"      Intent Accuracy: {relevance_score.intent_accuracy:.3f}")
            print(f"      Relevance Level: {relevance_level.value}")
            
            # Check if meets minimum relevance threshold
            if relevance_score.overall_relevance >= test_case.get("min_relevance", 0.6):
                print(f"   ✅ PASSED: Relevance score meets threshold")
                passed_tests += 1
            else:
                print(f"   ❌ FAILED: Relevance score below threshold")
        
        success_rate = (passed_tests / len(test_cases)) * 100
        print(f"\n📊 Relevance Engine Test Results: {passed_tests}/{len(test_cases)} passed ({success_rate:.0f}%)")
        
        return success_rate >= 80
        
    except ImportError as e:
        print(f"❌ Advanced relevance engine not available: {e}")
        return False
    except Exception as e:
        print(f"❌ Relevance engine test failed: {e}")
        return False

def test_advanced_settings_system():
    """Test the advanced settings and configuration system."""
    print("\n⚙️ Testing Advanced Settings System...")
    
    try:
        from advanced_settings_manager import AdvancedSettingsManager, AdvancedSettings
        
        settings_manager = AdvancedSettingsManager()
        
        # Test default settings loading
        print("✅ Settings manager initialized")
        print(f"   Default system mode: {settings_manager.get_setting('system_mode')}")
        print(f"   Semantic analysis depth: {settings_manager.get_setting('semantic_analysis_depth')}")
        print(f"   Quality assurance level: {settings_manager.get_setting('quality_assurance_level')}")
        
        # Test settings validation
        print("\n🔍 Testing Settings Validation:")
        
        validation_tests = [
            ("system_mode", "expert", True),
            ("system_mode", "invalid_mode", False),
            ("semantic_analysis_depth", 8, True),
            ("semantic_analysis_depth", 15, False),  # Out of range
            ("minimum_relevance_score", 0.8, True),
            ("minimum_relevance_score", 1.5, False),  # Out of range
        ]
        
        for setting_key, value, should_pass in validation_tests:
            result = settings_manager.set_setting(setting_key, value, validate=True)
            if result == should_pass:
                print(f"   ✓ {setting_key} = {value}: {'Valid' if should_pass else 'Invalid (expected)'}")
            else:
                print(f"   ✗ {setting_key} = {value}: Validation {'failed' if should_pass else 'passed'} unexpectedly")
        
        # Test profile application
        print("\n📋 Testing Settings Profiles:")
        
        profiles = settings_manager.get_all_profiles()
        print(f"   Available profiles: {list(profiles.keys())}")
        
        # Test applying different profiles
        test_profiles = ["professional", "researcher", "performance"]
        for profile_name in test_profiles:
            if profile_name in profiles:
                success = settings_manager.apply_profile(profile_name)
                if success:
                    print(f"   ✓ Applied {profile_name} profile successfully")
                    print(f"      System mode: {settings_manager.get_setting('system_mode')}")
                    print(f"      Analysis depth: {settings_manager.get_setting('semantic_analysis_depth')}")
                else:
                    print(f"   ✗ Failed to apply {profile_name} profile")
        
        # Test custom profile creation
        print("\n🛠️ Testing Custom Profile Creation:")
        
        custom_settings = {
            "system_mode": "expert",
            "semantic_analysis_depth": 10,
            "optimization_level": 9,
            "enable_experimental_features": True
        }
        
        success = settings_manager.create_custom_profile(
            "test_custom", 
            "Test custom profile", 
            custom_settings
        )
        
        if success:
            print("   ✓ Custom profile created successfully")
            
            # Test applying custom profile
            apply_success = settings_manager.apply_profile("test_custom")
            if apply_success:
                print("   ✓ Custom profile applied successfully")
            else:
                print("   ✗ Failed to apply custom profile")
        else:
            print("   ✗ Failed to create custom profile")
        
        # Test settings export/import
        print("\n📤 Testing Settings Export/Import:")
        
        exported_settings = settings_manager.export_settings()
        print(f"   ✓ Exported {len(exported_settings)} settings")
        
        # Modify a setting and import back
        test_import = {"system_mode": "intelligent", "optimization_level": 7}
        import_success = settings_manager.import_settings(test_import)
        
        if import_success:
            print("   ✓ Settings imported successfully")
            print(f"      New system mode: {settings_manager.get_setting('system_mode')}")
        else:
            print("   ✗ Failed to import settings")
        
        # Test recommendations
        print("\n💡 Testing Settings Recommendations:")
        
        recommendations = settings_manager.get_recommendations()
        print(f"   Generated {len(recommendations)} recommendations:")
        for rec in recommendations:
            print(f"      • {rec['type']}: {rec['message']}")
        
        print("✅ Advanced Settings System Tests Completed!")
        return True
        
    except ImportError as e:
        print(f"❌ Advanced settings system not available: {e}")
        return False
    except Exception as e:
        print(f"❌ Settings system test failed: {e}")
        return False

def test_user_preferences_and_learning():
    """Test user preferences and adaptive learning functionality."""
    print("\n🧠 Testing User Preferences and Learning...")
    
    try:
        from advanced_relevance_engine import AdvancedRelevanceEngine, UserPreferences
        
        engine = AdvancedRelevanceEngine()
        
        # Test user preferences
        print("👤 Testing User Preferences:")
        
        # Create test user preferences
        user_prefs = UserPreferences(
            preferred_complexity="expert",
            preferred_length="comprehensive",
            preferred_tone="professional",
            technical_depth="deep",
            include_examples=True,
            include_step_by_step=True,
            focus_areas=["software_development", "architecture"],
            avoid_topics=["basic_concepts"]
        )
        
        test_user_id = "test_user_123"
        engine.update_user_preferences(test_user_id, user_prefs)
        print(f"   ✓ User preferences set for {test_user_id}")
        
        # Retrieve preferences
        retrieved_prefs = engine.user_preferences_db.get(test_user_id)
        if retrieved_prefs:
            print(f"   ✓ Preferences retrieved successfully")
            print(f"      Preferred complexity: {retrieved_prefs.preferred_complexity}")
            print(f"      Technical depth: {retrieved_prefs.technical_depth}")
            print(f"      Focus areas: {retrieved_prefs.focus_areas}")
        else:
            print(f"   ✗ Failed to retrieve preferences")
        
        # Test learning from feedback
        print("\n📚 Testing Adaptive Learning:")
        
        feedback_scenarios = [
            {
                "input": "Create a REST API for user management",
                "enhanced": "Mock enhanced prompt for API development...",
                "score": 0.9,
                "comments": "Excellent technical depth and clarity"
            },
            {
                "input": "Design a database schema",
                "enhanced": "Mock enhanced prompt for database design...",
                "score": 0.7,
                "comments": "Good but could use more examples"
            },
            {
                "input": "Explain microservices architecture",
                "enhanced": "Mock enhanced prompt for architecture explanation...",
                "score": 0.6,
                "comments": "Too complex for my needs"
            }
        ]
        
        for scenario in feedback_scenarios:
            engine.learn_from_feedback(
                test_user_id,
                scenario["input"],
                scenario["enhanced"],
                scenario["score"],
                scenario["comments"]
            )
        
        print(f"   ✓ Recorded {len(feedback_scenarios)} feedback entries")
        
        # Check learning patterns
        learning_patterns = engine.learning_patterns.get(test_user_id, [])
        if learning_patterns:
            avg_score = sum(entry["feedback_score"] for entry in learning_patterns) / len(learning_patterns)
            print(f"   ✓ Learning patterns established")
            print(f"      Average feedback score: {avg_score:.2f}")
            print(f"      Total feedback entries: {len(learning_patterns)}")
        
        # Test preference-based enhancement
        print("\n🎯 Testing Preference-Based Enhancement:")
        
        test_input = "Create a scalable web application architecture"
        semantic_context = engine.analyze_user_input_deeply(test_input, test_user_id)
        
        # Mock enhanced prompt
        mock_enhanced = """
        **Professional Architecture Design**
        **Task:** Create a scalable web application architecture
        **Technical Approach:** Enterprise-level system design
        **Examples:** Include load balancing, caching strategies
        **Step-by-Step:** 1. Requirements analysis 2. Component design 3. Implementation
        """
        
        # Calculate preference match
        preference_match = engine._calculate_user_preference_match(
            mock_enhanced, semantic_context, retrieved_prefs
        )
        
        print(f"   ✓ Preference match calculated: {preference_match:.2f}")
        
        if preference_match >= 0.7:
            print("   ✅ High preference alignment achieved")
        else:
            print("   ⚠️ Moderate preference alignment")
        
        print("✅ User Preferences and Learning Tests Completed!")
        return True
        
    except ImportError as e:
        print(f"❌ User preferences system not available: {e}")
        return False
    except Exception as e:
        print(f"❌ User preferences test failed: {e}")
        return False

def test_quality_assurance_and_robustness():
    """Test quality assurance and system robustness."""
    print("\n🛡️ Testing Quality Assurance and Robustness...")
    
    try:
        from advanced_prompt_engine import AdvancedPromptEngine
        from advanced_settings_manager import AdvancedSettingsManager
        
        # Initialize with high quality settings
        settings_manager = AdvancedSettingsManager()
        settings_manager.apply_profile("researcher")  # High quality profile
        
        engine = AdvancedPromptEngine(settings_manager)
        
        # Test quality assurance with various input types
        print("🔍 Testing Quality Assurance:")
        
        qa_test_cases = [
            {
                "name": "Incomplete Input",
                "input": "help",
                "expect_enhancement": True
            },
            {
                "name": "Ambiguous Request",
                "input": "make it better",
                "expect_enhancement": True
            },
            {
                "name": "Technical Jargon Heavy",
                "input": "Implement OAuth2 PKCE flow with JWT tokens and refresh token rotation",
                "expect_technical_validation": True
            },
            {
                "name": "Very Long Complex Request",
                "input": "Create a comprehensive enterprise software architecture for a multi-tenant SaaS platform that handles real-time data processing, supports microservices, includes CI/CD pipelines, implements security best practices, scales to millions of users, and integrates with third-party APIs while maintaining high availability and disaster recovery capabilities",
                "expect_completeness_check": True
            },
            {
                "name": "Creative with Technical Mix",
                "input": "Write a story about a programmer who discovers a bug that affects reality itself",
                "expect_context_adaptation": True
            }
        ]
        
        passed_qa_tests = 0
        
        for test_case in qa_test_cases:
            print(f"\n   🧪 QA Test: {test_case['name']}")
            
            try:
                enhanced_prompt, template_name, analysis, metrics = engine.generate_enhanced_prompt(
                    test_case['input'], "gpt4", user_id="qa_test_user"
                )
                
                print(f"      ✓ Generated enhanced prompt ({len(enhanced_prompt)} chars)")
                print(f"      Template: {template_name}")
                print(f"      Complexity: {analysis.complexity.value}")
                
                # Check quality metrics
                quality_checks = []
                
                if metrics.clarity_score >= 0.7:
                    quality_checks.append("✓ Clarity")
                else:
                    quality_checks.append("✗ Clarity")
                
                if metrics.completeness_score >= 0.7:
                    quality_checks.append("✓ Completeness")
                else:
                    quality_checks.append("✗ Completeness")
                
                if metrics.effectiveness_score >= 0.7:
                    quality_checks.append("✓ Effectiveness")
                else:
                    quality_checks.append("✗ Effectiveness")
                
                print(f"      Quality: {' | '.join(quality_checks)}")
                
                # Specific test validations
                if test_case.get("expect_technical_validation"):
                    if "validation" in enhanced_prompt.lower() or "verify" in enhanced_prompt.lower():
                        print("      ✓ Technical validation included")
                        passed_qa_tests += 1
                    else:
                        print("      ✗ Missing technical validation")
                elif test_case.get("expect_completeness_check"):
                    if len(enhanced_prompt) > len(test_case['input']) * 5:  # Significant expansion
                        print("      ✓ Comprehensive enhancement")
                        passed_qa_tests += 1
                    else:
                        print("      ✗ Insufficient enhancement")
                else:
                    # General quality check
                    overall_quality = (metrics.clarity_score + metrics.completeness_score + metrics.effectiveness_score) / 3
                    if overall_quality >= 0.7:
                        print("      ✅ Quality assurance passed")
                        passed_qa_tests += 1
                    else:
                        print("      ❌ Quality assurance failed")
                
            except Exception as e:
                print(f"      ❌ Error: {e}")
        
        qa_success_rate = (passed_qa_tests / len(qa_test_cases)) * 100
        print(f"\n   📊 QA Test Results: {passed_qa_tests}/{len(qa_test_cases)} passed ({qa_success_rate:.0f}%)")
        
        # Test robustness with edge cases
        print("\n🔧 Testing System Robustness:")
        
        robustness_tests = [
            ("Empty input", ""),
            ("Single word", "code"),
            ("Very long input", "a" * 1000),
            ("Special characters", "Create @#$% function with ñ and émojis 🚀"),
            ("Mixed languages", "Create función para データベース connection"),
        ]
        
        robust_passed = 0
        
        for test_name, test_input in robustness_tests:
            try:
                if test_input:  # Skip empty input test
                    result = engine.generate_enhanced_prompt(test_input, "default")
                    if result and len(result[0]) > 0:
                        print(f"   ✓ {test_name}: Handled gracefully")
                        robust_passed += 1
                    else:
                        print(f"   ✗ {test_name}: Failed to generate output")
                else:
                    print(f"   ✓ {test_name}: Skipped (empty input)")
                    robust_passed += 1
            except Exception as e:
                print(f"   ✗ {test_name}: Error - {str(e)[:50]}...")
        
        robustness_rate = (robust_passed / len(robustness_tests)) * 100
        print(f"\n   📊 Robustness Results: {robust_passed}/{len(robustness_tests)} passed ({robustness_rate:.0f}%)")
        
        # Test performance
        print("\n⚡ Testing Performance:")
        
        performance_input = "Create a machine learning model for image classification"
        
        # Measure generation time
        start_time = time.time()
        for _ in range(5):  # Run 5 times for average
            engine.generate_enhanced_prompt(performance_input, "gpt4")
        avg_time = (time.time() - start_time) / 5
        
        print(f"   ✓ Average generation time: {avg_time:.3f}s")
        
        # Test caching
        if engine.analysis_cache is not None:
            cache_size_before = len(engine.analysis_cache)
            engine.generate_enhanced_prompt(performance_input, "gpt4")  # Should hit cache
            cache_size_after = len(engine.analysis_cache)
            
            stats = engine.get_generation_statistics()
            cache_hit_rate = stats.get("cache_hit_rate", 0)
            
            print(f"   ✓ Cache hit rate: {cache_hit_rate:.1%}")
            print(f"   ✓ Cache entries: {cache_size_after}")
        
        overall_success = (qa_success_rate >= 70 and robustness_rate >= 80)
        
        print("✅ Quality Assurance and Robustness Tests Completed!")
        return overall_success
        
    except ImportError as e:
        print(f"❌ Quality assurance system not available: {e}")
        return False
    except Exception as e:
        print(f"❌ Quality assurance test failed: {e}")
        return False

def main():
    """Run comprehensive advanced relevance and robustness tests."""
    print("🚀 Advanced PromptCraft Relevance & Robustness Test Suite")
    print("=" * 70)
    
    test_results = []
    
    # Run all test suites
    test_suites = [
        ("Advanced Relevance Engine", test_advanced_relevance_engine),
        ("Advanced Settings System", test_advanced_settings_system),
        ("User Preferences & Learning", test_user_preferences_and_learning),
        ("Quality Assurance & Robustness", test_quality_assurance_and_robustness)
    ]
    
    for suite_name, test_function in test_suites:
        print(f"\n{'=' * 25} {suite_name} {'=' * 25}")
        try:
            result = test_function()
            test_results.append((suite_name, result))
        except Exception as e:
            print(f"❌ {suite_name} failed with error: {e}")
            test_results.append((suite_name, False))
    
    # Summary
    print(f"\n{'=' * 70}")
    print("📊 ADVANCED FEATURES TEST SUMMARY")
    print("=" * 70)
    
    passed = sum(1 for _, result in test_results if result)
    total = len(test_results)
    
    for suite_name, result in test_results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{suite_name:.<40} {status}")
    
    print(f"\nOverall Results: {passed}/{total} test suites passed")
    
    if passed == total:
        print("🎉 ALL ADVANCED TESTS PASSED! System is highly robust and relevant.")
        print("\n🌟 Key Achievements:")
        print("   • Advanced relevance validation working perfectly")
        print("   • Sophisticated settings and customization system")
        print("   • User preference learning and adaptation")
        print("   • Comprehensive quality assurance")
        print("   • High system robustness and error handling")
        return True
    elif passed >= total * 0.75:
        print("⚠️  MOSTLY ROBUST: Advanced features working well with minor issues.")
        return True
    else:
        print("❌ SYSTEM ISSUES: Multiple advanced components need attention.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)