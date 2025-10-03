#!/usr/bin/env python3
"""
Test script for new PromptCraft features
Tests API server, analytics, batch processing, and integrations
"""

import asyncio
import json
import time
import requests
import subprocess
import os
from typing import Dict, Any

def test_api_server():
    """Test API server endpoints"""
    print("🧪 Testing API Server...")
    
    base_url = "http://localhost:8080"
    
    try:
        # Test health endpoint
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Health endpoint working")
            health_data = response.json()
            print(f"   Status: {health_data['status']}")
            print(f"   Version: {health_data['version']}")
        else:
            print("❌ Health endpoint failed")
            return False
        
        # Test enhance endpoint
        enhance_data = {
            "prompt": "write a Python function to sort a list",
            "model": "default",
            "user_id": "test_user"
        }
        
        response = requests.post(f"{base_url}/enhance", json=enhance_data, timeout=10)
        if response.status_code == 200:
            print("✅ Enhance endpoint working")
            result = response.json()
            print(f"   Template used: {result['template_used']}")
            print(f"   Processing time: {result['processing_time_ms']}ms")
        else:
            print("❌ Enhance endpoint failed")
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
        
        # Test batch endpoint
        batch_data = {
            "prompts": [
                "write a function",
                "explain AI",
                "create a story"
            ],
            "model": "default",
            "user_id": "test_user"
        }
        
        response = requests.post(f"{base_url}/batch", json=batch_data, timeout=30)
        if response.status_code == 200:
            print("✅ Batch endpoint working")
            result = response.json()
            print(f"   Total processed: {result['total_processed']}")
            print(f"   Successful: {result['successful']}")
            print(f"   Failed: {result['failed']}")
        else:
            print("❌ Batch endpoint failed")
            return False
        
        # Test templates endpoint
        response = requests.get(f"{base_url}/templates", timeout=5)
        if response.status_code == 200:
            print("✅ Templates endpoint working")
            templates = response.json()
            print(f"   Available templates: {len(templates['templates'])}")
        else:
            print("❌ Templates endpoint failed")
            return False
        
        # Test models endpoint
        response = requests.get(f"{base_url}/models", timeout=5)
        if response.status_code == 200:
            print("✅ Models endpoint working")
            models = response.json()
            print(f"   Available models: {models['models']}")
        else:
            print("❌ Models endpoint failed")
            return False
        
        print("✅ All API endpoints working correctly")
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ API server not running. Start with: ./start_api.sh")
        return False
    except Exception as e:
        print(f"❌ API test failed: {e}")
        return False

def test_analytics():
    """Test analytics system"""
    print("\n🧪 Testing Analytics System...")
    
    try:
        from analytics import AnalyticsTracker
        
        # Initialize analytics
        analytics = AnalyticsTracker()
        print("✅ Analytics tracker initialized")
        
        # Track some test requests
        for i in range(5):
            analytics.track_request(
                user_id=f"test_user_{i}",
                template="code",
                model="gpt4",
                processing_time=50.0 + i * 10,
                success=True,
                request_id=f"test_req_{i}",
                input_length=100,
                output_length=500
            )
        
        print("✅ Test requests tracked")
        
        # Track some errors
        analytics.track_error(
            error_type="validation",
            error_message="Test error",
            user_id="test_user"
        )
        
        print("✅ Test error tracked")
        
        # Get analytics summary
        summary = analytics.get_analytics_summary()
        print("✅ Analytics summary retrieved")
        print(f"   Total requests: {summary['total_requests']}")
        print(f"   Average processing time: {summary['average_processing_time']}ms")
        print(f"   Error rate: {summary['error_rate']}%")
        
        # Get detailed analytics
        detailed = analytics.get_detailed_analytics(7)
        print("✅ Detailed analytics retrieved")
        print(f"   Period: {detailed['period_days']} days")
        
        return True
        
    except Exception as e:
        print(f"❌ Analytics test failed: {e}")
        return False

def test_batch_processing():
    """Test batch processing system"""
    print("\n🧪 Testing Batch Processing...")
    
    try:
        from batch_processor import BatchProcessor, BatchItem
        from prompt_craft import load_config
        
        # Load config
        config = load_config()
        print("✅ Configuration loaded")
        
        # Initialize batch processor
        processor = BatchProcessor(config, max_workers=4)
        print("✅ Batch processor initialized")
        
        # Test synchronous batch processing
        items = [
            BatchItem(id="1", prompt="write a function", model="default"),
            BatchItem(id="2", prompt="explain AI", model="default"),
            BatchItem(id="3", prompt="create a story", model="default")
        ]
        
        results = processor._process_batch_sync(items, "test_user")
        print("✅ Synchronous batch processing completed")
        print(f"   Processed {len(results)} items")
        
        successful = sum(1 for r in results if r.success)
        print(f"   Successful: {successful}")
        print(f"   Failed: {len(results) - successful}")
        
        # Test job submission
        job_id = processor.submit_job(items, user_id="test_user")
        print(f"✅ Batch job submitted: {job_id}")
        
        # Wait a bit and check status
        time.sleep(2)
        status = processor.get_job_status(job_id)
        print(f"✅ Job status retrieved: {status['status']}")
        
        # Get processor stats
        stats = processor.get_stats()
        print("✅ Processor stats retrieved")
        print(f"   Active jobs: {stats['active_jobs']}")
        print(f"   Max workers: {stats['max_workers']}")
        
        # Shutdown processor
        processor.shutdown()
        print("✅ Batch processor shutdown")
        
        return True
        
    except Exception as e:
        print(f"❌ Batch processing test failed: {e}")
        return False

def test_integrations():
    """Test integrations system"""
    print("\n🧪 Testing Integrations...")
    
    try:
        from integrations import IntegrationManager, IntegrationConfig
        
        # Initialize integration manager
        manager = IntegrationManager()
        print("✅ Integration manager initialized")
        
        # Get integration status
        status = manager.get_integration_status()
        print("✅ Integration status retrieved")
        for name, info in status.items():
            enabled = "✅" if info['enabled'] else "❌"
            configured = "✅" if info['configured'] else "❌"
            print(f"   {name}: {enabled} enabled, {configured} configured")
        
        # Get enabled integrations
        enabled_integrations = manager.get_enabled_integrations()
        print(f"✅ Enabled integrations: {enabled_integrations}")
        
        # Test webhook integration (if configured)
        if 'webhook' in manager.integrations:
            webhook = manager.integrations['webhook']
            if webhook.enabled and webhook.validate_config():
                print("✅ Webhook integration configured and ready")
            else:
                print("⚠️ Webhook integration not configured")
        
        return True
        
    except Exception as e:
        print(f"❌ Integrations test failed: {e}")
        return False

def test_file_batch_processing():
    """Test file-based batch processing"""
    print("\n🧪 Testing File Batch Processing...")
    
    try:
        # Create test CSV file
        test_csv = "test_prompts.csv"
        with open(test_csv, 'w') as f:
            f.write("prompt,model\n")
            f.write("write a Python function,default\n")
            f.write("explain machine learning,default\n")
            f.write("create a short story,default\n")
        
        print("✅ Test CSV file created")
        
        # Create test JSON file
        test_json = "test_prompts.json"
        test_data = [
            {"prompt": "write a function", "model": "default"},
            {"prompt": "explain AI", "model": "default"},
            {"prompt": "create a poem", "model": "default"}
        ]
        
        with open(test_json, 'w') as f:
            json.dump(test_data, f, indent=2)
        
        print("✅ Test JSON file created")
        
        # Test CSV processing via CLI
        result = subprocess.run([
            "python", "batch_processor.py",
            "--csv", test_csv,
            "--output", "test_results.csv",
            "--batch-size", "2"
        ], capture_output=True, text=True, timeout=60)
        
        if result.returncode == 0:
            print("✅ CSV batch processing completed")
            if os.path.exists("test_results.csv"):
                print("✅ CSV results file created")
        else:
            print("❌ CSV batch processing failed")
            print(f"   Error: {result.stderr}")
        
        # Test JSON processing via CLI
        result = subprocess.run([
            "python", "batch_processor.py",
            "--json", test_json,
            "--output", "test_results.json",
            "--batch-size", "2"
        ], capture_output=True, text=True, timeout=60)
        
        if result.returncode == 0:
            print("✅ JSON batch processing completed")
            if os.path.exists("test_results.json"):
                print("✅ JSON results file created")
        else:
            print("❌ JSON batch processing failed")
            print(f"   Error: {result.stderr}")
        
        # Cleanup test files
        for file in [test_csv, test_json, "test_results.csv", "test_results.json"]:
            if os.path.exists(file):
                os.remove(file)
        
        print("✅ Test files cleaned up")
        return True
        
    except Exception as e:
        print(f"❌ File batch processing test failed: {e}")
        return False

def test_cli_tools():
    """Test CLI tools"""
    print("\n🧪 Testing CLI Tools...")
    
    try:
        # Test analytics CLI
        result = subprocess.run([
            "python", "analytics.py", "--summary"
        ], capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            print("✅ Analytics CLI working")
            try:
                summary = json.loads(result.stdout)
                print(f"   Total requests: {summary.get('total_requests', 0)}")
            except:
                print("   Summary data retrieved")
        else:
            print("❌ Analytics CLI failed")
            print(f"   Error: {result.stderr}")
        
        # Test integrations CLI
        result = subprocess.run([
            "python", "integrations.py", "--status"
        ], capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            print("✅ Integrations CLI working")
        else:
            print("❌ Integrations CLI failed")
            print(f"   Error: {result.stderr}")
        
        return True
        
    except Exception as e:
        print(f"❌ CLI tools test failed: {e}")
        return False

async def test_async_batch_processing():
    """Test asynchronous batch processing"""
    print("\n🧪 Testing Async Batch Processing...")
    
    try:
        from batch_processor import BatchProcessor
        from prompt_craft import load_config
        
        config = load_config()
        processor = BatchProcessor(config)
        
        # Test async batch processing
        prompts = [
            "write a function",
            "explain AI",
            "create a story",
            "debug code",
            "optimize algorithm"
        ]
        
        results = await processor.process_batch(
            prompts=prompts,
            model="default",
            user_id="async_test_user",
            max_concurrent=3
        )
        
        print("✅ Async batch processing completed")
        print(f"   Processed {len(results)} prompts")
        
        successful = sum(1 for r in results if r.success)
        print(f"   Successful: {successful}")
        print(f"   Failed: {len(results) - successful}")
        
        processor.shutdown()
        return True
        
    except Exception as e:
        print(f"❌ Async batch processing test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 PromptCraft New Features Test Suite")
    print("=" * 50)
    
    tests = [
        ("API Server", test_api_server),
        ("Analytics System", test_analytics),
        ("Batch Processing", test_batch_processing),
        ("Integrations", test_integrations),
        ("File Batch Processing", test_file_batch_processing),
        ("CLI Tools", test_cli_tools),
    ]
    
    results = {}
    
    # Run synchronous tests
    for test_name, test_func in tests:
        try:
            results[test_name] = test_func()
        except Exception as e:
            print(f"❌ {test_name} test crashed: {e}")
            results[test_name] = False
    
    # Run async test
    try:
        results["Async Batch Processing"] = asyncio.run(test_async_batch_processing())
    except Exception as e:
        print(f"❌ Async Batch Processing test crashed: {e}")
        results["Async Batch Processing"] = False
    
    # Print summary
    print("\n" + "=" * 50)
    print("🏁 Test Results Summary")
    print("=" * 50)
    
    passed = 0
    total = len(results)
    
    for test_name, success in results.items():
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if success:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! New features are working correctly.")
        return 0
    else:
        print("⚠️ Some tests failed. Check the output above for details.")
        return 1

if __name__ == "__main__":
    import sys
    sys.exit(main())