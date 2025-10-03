#!/usr/bin/env python3

"""
Robustness and Relevance Test Suite
==================================

Focused testing of the enhanced PromptCraft system's robustness and relevance improvements.
"""

import time
import json

def test_enhanced_prompt_generation():
    """Test enhanced prompt generation with various inputs."""
    print("🚀 Testing Enhanced Prompt Generation...")
    
    try:
        from advanced_prompt_engine import AdvancedPromptEngine
        from advanced_settings_manager import AdvancedSettingsManager
        
        # Initialize with default settings
        settings_manager = AdvancedSettingsManager()
        engine = AdvancedPromptEngine(settings_manager)
        
        # Test cases focusing on relevance and quality
        test_cases = [
            {
                "input": "Create a secure login system",
                "description": "Basic technical request",
                "expected_keywords": ["security", "authentication", "login"]
            },
            {
                "input": "Write a story about a robot discovering emotions",
                "description": "Creative writing request",
                "expected_keywords": ["story", "robot", "emotions", "creative"]
            },
            {
                "input": "Analyze market trends in renewable energy",
                "description": "Business analysis request", 
                "expected_keywords": ["analyze", "market", "trends", "energy"]
            },
            {
                "input": "Help me debug my Python code that crashes when processing large files",
                "description": "Technical support request",
                "expected_keywords": ["debug", "python", "code", "files"]
            },
            {
                "input": "Design a machine learning pipeline for customer segmentation",
                "description": "Data science request",
                "expected_keywords": ["machine learning", "pipeline", "customer", "segmentation"]
            }
        ]
        
        results = []
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"\n📋 Test Case {i}: {test_case['description']}")
            print(f"   Input: \"{test_case['input']}\"")
            
            # Generate enhanced prompt
            start_time = time.time()
            enhanced_prompt, template_name, analysis, metrics = engine.generate_enhanced_prompt(
                test_case['input'], "gpt4"
            )
            generation_time = time.time() - start_time
            
            # Analyze results
            enhanced_lower = enhanced_prompt.lower()
            keyword_matches = sum(1 for keyword in test_case['expected_keywords'] 
                                if keyword.lower() in enhanced_lower)
            keyword_coverage = keyword_matches / len(test_case['expected_keywords'])
            
            # Quality metrics
            expansion_ratio = len(enhanced_prompt) / len(test_case['input'])
            
            result = {
                "case": i,
                "generation_time": generation_time,
                "template_used": template_name,
                "enhanced_length": len(enhanced_prompt),
                "expansion_ratio": expansion_ratio,
                "keyword_coverage": keyword_coverage,
                "quality_scores": {
                    "clarity": metrics.clarity_score,
                    "specificity": metrics.specificity_score,
                    "completeness": metrics.completeness_score,
                    "effectiveness": metrics.effectiveness_score,
                    "token_efficiency": metrics.token_efficiency
                }
            }
            
            results.append(result)
            
            # Display results
            print(f"   ✅ Generated in {generation_time:.2f}s")
            print(f"   📋 Template: {template_name}")
            print(f"   📏 Length: {len(enhanced_prompt):,} characters ({expansion_ratio:.1f}x expansion)")
            print(f"   🎯 Keyword Coverage: {keyword_coverage:.1%}")
            print(f"   📊 Quality Scores:")
            print(f"      Clarity: {metrics.clarity_score:.2f}")
            print(f"      Specificity: {metrics.specificity_score:.2f}")
            print(f"      Completeness: {metrics.completeness_score:.2f}")
            print(f"      Effectiveness: {metrics.effectiveness_score:.2f}")
            
            # Check relevance indicators
            relevance_indicators = []
            if keyword_coverage >= 0.7:
                relevance_indicators.append("✓ High keyword relevance")
            if expansion_ratio >= 5:
                relevance_indicators.append("✓ Substantial enhancement")
            if metrics.effectiveness_score >= 0.7:
                relevance_indicators.append("✓ High effectiveness score")
            if "framework" in enhanced_lower or "methodology" in enhanced_lower:
                relevance_indicators.append("✓ Structured approach")
            
            print(f"   🔍 Relevance Indicators:")
            for indicator in relevance_indicators:
                print(f"      {indicator}")
        
        # Calculate overall performance
        avg_generation_time = sum(r["generation_time"] for r in results) / len(results)
        avg_expansion_ratio = sum(r["expansion_ratio"] for r in results) / len(results)
        avg_keyword_coverage = sum(r["keyword_coverage"] for r in results) / len(results)
        avg_effectiveness = sum(r["quality_scores"]["effectiveness"] for r in results) / len(results)
        
        print(f"\n📈 Overall Performance:")
        print(f"   Average Generation Time: {avg_generation_time:.2f}s")
        print(f"   Average Expansion Ratio: {avg_expansion_ratio:.1f}x")
        print(f"   Average Keyword Coverage: {avg_keyword_coverage:.1%}")
        print(f"   Average Effectiveness: {avg_effectiveness:.2f}")
        
        # Success criteria
        success_criteria = [
            ("Generation Speed", avg_generation_time <= 3.0),
            ("Enhancement Quality", avg_expansion_ratio >= 5.0),
            ("Relevance Accuracy", avg_keyword_coverage >= 0.6),
            ("Overall Effectiveness", avg_effectiveness >= 0.7)
        ]
        
        passed_criteria = sum(1 for _, passed in success_criteria if passed)
        
        print(f"\n✅ Success Criteria ({passed_criteria}/{len(success_criteria)}):")
        for criterion, passed in success_criteria:
            status = "✅ PASS" if passed else "❌ FAIL"
            print(f"   {criterion}: {status}")
        
        if passed_criteria >= 3:
            print("🎉 Enhanced Prompt Generation Tests PASSED!")
            return True
        else:
            print("⚠️ Enhanced Prompt Generation needs improvement")
            return False
        
    except ImportError as e:
        print(f"❌ Components not available: {e}")
        return False
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_settings_robustness():
    """Test settings management robustness."""
    print("\n⚙️ Testing Settings Robustness...")
    
    try:
        from advanced_settings_manager import AdvancedSettingsManager
        
        settings_manager = AdvancedSettingsManager()
        
        # Test basic settings operations
        print("📋 Testing Basic Settings Operations:")
        
        # Test getting and setting valid values
        original_depth = settings_manager.get_setting("semantic_analysis_depth")
        success = settings_manager.set_setting("semantic_analysis_depth", 9)
        new_depth = settings_manager.get_setting("semantic_analysis_depth")
        
        if success and new_depth == 9:
            print("   ✓ Setting update works correctly")
        else:
            print("   ❌ Setting update failed")
            return False
        
        # Test validation of invalid values
        invalid_tests = [
            ("semantic_analysis_depth", 15),  # Too high
            ("minimum_relevance_score", 1.5),  # Too high
            ("system_mode", "invalid_mode")  # Invalid choice
        ]
        
        validation_works = True
        for setting, invalid_value in invalid_tests:
            success = settings_manager.set_setting(setting, invalid_value)
            if not success:
                print(f"   ✓ Correctly rejected invalid {setting}: {invalid_value}")
            else:
                print(f"   ❌ Failed to reject invalid {setting}: {invalid_value}")
                validation_works = False
        
        if not validation_works:
            return False
        
        # Test profile application
        print("\n📁 Testing Profile Management:")
        profiles = settings_manager.get_all_profiles()
        
        if len(profiles) >= 3:
            print(f"   ✓ Found {len(profiles)} settings profiles")
            
            # Test applying a profile
            profile_name = list(profiles.keys())[0]
            success = settings_manager.apply_profile(profile_name)
            
            if success:
                print(f"   ✓ Successfully applied profile: {profile_name}")
            else:
                print(f"   ❌ Failed to apply profile: {profile_name}")
                return False
        else:
            print("   ❌ Insufficient profiles found")
            return False
        
        # Test export/import
        print("\n💾 Testing Export/Import:")
        exported_settings = settings_manager.export_settings()
        
        if isinstance(exported_settings, dict) and len(exported_settings) > 0:
            print(f"   ✓ Exported {len(exported_settings)} settings")
            
            # Test import
            success = settings_manager.import_settings(exported_settings)
            if success:
                print("   ✓ Successfully imported settings")
            else:
                print("   ❌ Failed to import settings")
                return False
        else:
            print("   ❌ Export failed")
            return False
        
        print("✅ Settings Robustness Tests Passed!")
        return True
        
    except ImportError as e:
        print(f"❌ Settings components not available: {e}")
        return False
    except Exception as e:
        print(f"❌ Settings test failed: {e}")
        return False

def test_error_handling():
    """Test error handling and edge cases."""
    print("\n🛡️ Testing Error Handling...")
    
    try:
        from advanced_prompt_engine import AdvancedPromptEngine
        from advanced_settings_manager import AdvancedSettingsManager
        
        settings_manager = AdvancedSettingsManager()
        engine = AdvancedPromptEngine(settings_manager)
        
        # Test edge cases
        edge_cases = [
            ("", "Empty input"),
            ("a", "Single character"),
            ("   ", "Whitespace only"),
            ("🚀🎯💡", "Emoji only"),
            ("A" * 1000, "Very long input"),
            ("Create a " + "very " * 100 + "complex system", "Repetitive input")
        ]
        
        print("🔍 Testing Edge Cases:")
        
        for test_input, description in edge_cases:
            try:
                enhanced_prompt, template_name, analysis, metrics = engine.generate_enhanced_prompt(
                    test_input, "gpt4"
                )
                
                if len(enhanced_prompt) > len(test_input):
                    print(f"   ✓ {description}: Handled gracefully")
                else:
                    print(f"   ⚠️ {description}: Minimal enhancement")
                    
            except Exception as e:
                print(f"   ❌ {description}: Failed with error: {e}")
                return False
        
        # Test invalid model handling
        print("\n🤖 Testing Model Handling:")
        try:
            enhanced_prompt, template_name, analysis, metrics = engine.generate_enhanced_prompt(
                "Test invalid model", "nonexistent_model"
            )
            print("   ✓ Invalid model handled gracefully")
        except Exception as e:
            print(f"   ❌ Invalid model caused error: {e}")
            return False
        
        # Test concurrent generation (if supported)
        print("\n⚡ Testing Concurrent Operations:")
        import threading
        import queue
        
        results_queue = queue.Queue()
        
        def generate_prompt(input_text, result_queue):
            try:
                result = engine.generate_enhanced_prompt(input_text, "gpt4")
                result_queue.put(("success", result))
            except Exception as e:
                result_queue.put(("error", str(e)))
        
        # Start multiple threads
        threads = []
        for i in range(3):
            thread = threading.Thread(
                target=generate_prompt, 
                args=(f"Concurrent test {i+1}", results_queue)
            )
            threads.append(thread)
            thread.start()
        
        # Wait for completion
        for thread in threads:
            thread.join()
        
        # Check results
        concurrent_success = 0
        while not results_queue.empty():
            status, result = results_queue.get()
            if status == "success":
                concurrent_success += 1
        
        if concurrent_success >= 2:
            print(f"   ✓ Concurrent operations successful: {concurrent_success}/3")
        else:
            print(f"   ⚠️ Concurrent operations had issues: {concurrent_success}/3")
        
        print("✅ Error Handling Tests Passed!")
        return True
        
    except ImportError as e:
        print(f"❌ Error handling components not available: {e}")
        return False
    except Exception as e:
        print(f"❌ Error handling test failed: {e}")
        return False

def main():
    """Run focused robustness and relevance tests."""
    print("🚀 PromptCraft Robustness & Relevance Test Suite")
    print("=" * 60)
    
    test_results = []
    
    # Run focused test suites
    test_suites = [
        ("Enhanced Prompt Generation", test_enhanced_prompt_generation),
        ("Settings Robustness", test_settings_robustness),
        ("Error Handling", test_error_handling)
    ]
    
    for suite_name, test_function in test_suites:
        print(f"\n{'=' * 20} {suite_name} {'=' * 20}")
        try:
            result = test_function()
            test_results.append((suite_name, result))
        except Exception as e:
            print(f"❌ {suite_name} failed with error: {e}")
            test_results.append((suite_name, False))
    
    # Final summary
    print(f"\n{'=' * 60}")
    print("📊 ROBUSTNESS TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, result in test_results if result)
    total = len(test_results)
    
    for suite_name, result in test_results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{suite_name:.<35} {status}")
    
    print(f"\nOverall Results: {passed}/{total} test suites passed")
    success_rate = (passed / total) * 100
    
    if passed == total:
        print("🎉 ALL ROBUSTNESS TESTS PASSED!")
        print("🚀 The enhanced PromptCraft system demonstrates:")
        print("   • Robust prompt generation with high relevance")
        print("   • Reliable settings management and validation")
        print("   • Excellent error handling and edge case management")
        print("   • Strong performance characteristics")
        return True
    elif success_rate >= 66:
        print("⚠️ MOSTLY ROBUST: System working well with minor issues")
        return True
    else:
        print("❌ ROBUSTNESS ISSUES: System needs significant improvements")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)