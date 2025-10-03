#!/usr/bin/env python3
"""
PromptCraft Batch Processing System
High-performance batch processing for multiple prompt enhancements
"""

import asyncio
import json
import time
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any, Union, Callable
from dataclasses import dataclass, asdict
from pathlib import Path
import logging
import concurrent.futures
from queue import Queue
import threading

from prompt_craft import (
    enhance_prompt,
    validate_input,
    PromptCraftError,
    ValidationError,
    ConfigurationError
)

logger = logging.getLogger('promptcraft.batch')

@dataclass
class BatchItem:
    """Individual item in a batch"""
    id: str
    prompt: str
    model: str = "default"
    template: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class BatchResult:
    """Result of processing a batch item"""
    id: str
    success: bool
    enhanced_prompt: Optional[str] = None
    template_used: Optional[str] = None
    error_message: Optional[str] = None
    processing_time_ms: float = 0
    timestamp: Optional[datetime] = None

@dataclass
class BatchJob:
    """Complete batch job specification"""
    job_id: str
    items: List[BatchItem]
    created_at: datetime
    user_id: Optional[str] = None
    priority: int = 0
    callback_url: Optional[str] = None
    max_retries: int = 3
    timeout_seconds: int = 300

class BatchProcessor:
    """High-performance batch processing engine"""
    
    def __init__(self, config: Dict[str, Any], max_workers: int = None, 
                 max_concurrent_batches: int = 5):
        """Initialize batch processor"""
        self.config = config
        self.max_workers = max_workers or min(32, (os.cpu_count() or 1) + 4)
        self.max_concurrent_batches = max_concurrent_batches
        
        # Job queue and tracking
        self.job_queue = Queue()
        self.active_jobs: Dict[str, BatchJob] = {}
        self.completed_jobs: Dict[str, Dict[str, Any]] = {}
        
        # Thread pool for CPU-bound tasks
        self.executor = concurrent.futures.ThreadPoolExecutor(
            max_workers=self.max_workers,
            thread_name_prefix="batch_worker"
        )
        
        # Background processing
        self.processing_thread = None
        self.shutdown_event = threading.Event()
        self.start_background_processing()
        
        logger.info(f"Batch processor initialized with {self.max_workers} workers")
    
    def start_background_processing(self):
        """Start background thread for processing jobs"""
        if self.processing_thread is None or not self.processing_thread.is_alive():
            self.processing_thread = threading.Thread(
                target=self._background_processor,
                name="batch_processor",
                daemon=True
            )
            self.processing_thread.start()
    
    def _background_processor(self):
        """Background thread that processes queued jobs"""
        while not self.shutdown_event.is_set():
            try:
                # Check for new jobs (non-blocking)
                if not self.job_queue.empty() and len(self.active_jobs) < self.max_concurrent_batches:
                    job = self.job_queue.get_nowait()
                    self._process_job_async(job)
                
                # Clean up completed jobs older than 1 hour
                self._cleanup_old_jobs()
                
                time.sleep(0.1)  # Small delay to prevent busy waiting
                
            except Exception as e:
                logger.error(f"Error in background processor: {e}")
                time.sleep(1)
    
    def _process_job_async(self, job: BatchJob):
        """Process a job asynchronously"""
        def job_wrapper():
            try:
                self.active_jobs[job.job_id] = job
                results = self._process_batch_sync(job.items, job.user_id)
                
                # Store completed job
                self.completed_jobs[job.job_id] = {
                    'job_id': job.job_id,
                    'results': [asdict(result) for result in results],
                    'completed_at': datetime.utcnow().isoformat(),
                    'total_items': len(job.items),
                    'successful': sum(1 for r in results if r.success),
                    'failed': sum(1 for r in results if not r.success)
                }
                
                # Send callback if specified
                if job.callback_url:
                    self._send_callback(job.callback_url, self.completed_jobs[job.job_id])
                
            except Exception as e:
                logger.error(f"Error processing job {job.job_id}: {e}")
                self.completed_jobs[job.job_id] = {
                    'job_id': job.job_id,
                    'error': str(e),
                    'completed_at': datetime.utcnow().isoformat(),
                    'failed': True
                }
            finally:
                # Remove from active jobs
                self.active_jobs.pop(job.job_id, None)
        
        # Submit to thread pool
        self.executor.submit(job_wrapper)
    
    async def process_batch(self, prompts: List[str], model: str = "default",
                          template: Optional[str] = None, user_id: Optional[str] = None,
                          max_concurrent: int = 10) -> List[BatchResult]:
        """Process a batch of prompts asynchronously"""
        # Create batch items
        items = [
            BatchItem(
                id=f"item_{i}",
                prompt=prompt,
                model=model,
                template=template
            )
            for i, prompt in enumerate(prompts)
        ]
        
        # Process with controlled concurrency
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def process_item(item: BatchItem) -> BatchResult:
            async with semaphore:
                return await self._process_single_item_async(item, user_id)
        
        # Process all items concurrently
        tasks = [process_item(item) for item in items]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Convert exceptions to error results
        final_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                final_results.append(BatchResult(
                    id=items[i].id,
                    success=False,
                    error_message=str(result),
                    timestamp=datetime.utcnow()
                ))
            else:
                final_results.append(result)
        
        return final_results
    
    async def _process_single_item_async(self, item: BatchItem, user_id: Optional[str]) -> BatchResult:
        """Process a single batch item asynchronously"""
        start_time = time.time() * 1000
        
        try:
            # Validate input
            validated_input = validate_input(item.prompt)
            
            # Run enhancement in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            enhanced, template_used = await loop.run_in_executor(
                self.executor,
                enhance_prompt,
                self.config,
                validated_input,
                item.model
            )
            
            processing_time = (time.time() * 1000) - start_time
            
            return BatchResult(
                id=item.id,
                success=True,
                enhanced_prompt=enhanced,
                template_used=template_used,
                processing_time_ms=processing_time,
                timestamp=datetime.utcnow()
            )
            
        except Exception as e:
            processing_time = (time.time() * 1000) - start_time
            
            return BatchResult(
                id=item.id,
                success=False,
                error_message=str(e),
                processing_time_ms=processing_time,
                timestamp=datetime.utcnow()
            )
    
    def _process_batch_sync(self, items: List[BatchItem], user_id: Optional[str]) -> List[BatchResult]:
        """Process batch synchronously (for background processing)"""
        results = []
        
        # Use thread pool for parallel processing
        def process_item(item: BatchItem) -> BatchResult:
            start_time = time.time() * 1000
            
            try:
                validated_input = validate_input(item.prompt)
                enhanced, template_used = enhance_prompt(
                    self.config, validated_input, item.model
                )
                
                processing_time = (time.time() * 1000) - start_time
                
                return BatchResult(
                    id=item.id,
                    success=True,
                    enhanced_prompt=enhanced,
                    template_used=template_used,
                    processing_time_ms=processing_time,
                    timestamp=datetime.utcnow()
                )
                
            except Exception as e:
                processing_time = (time.time() * 1000) - start_time
                
                return BatchResult(
                    id=item.id,
                    success=False,
                    error_message=str(e),
                    processing_time_ms=processing_time,
                    timestamp=datetime.utcnow()
                )
        
        # Process items in parallel
        with concurrent.futures.ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            future_to_item = {executor.submit(process_item, item): item for item in items}
            
            for future in concurrent.futures.as_completed(future_to_item):
                try:
                    result = future.result()
                    results.append(result)
                except Exception as e:
                    item = future_to_item[future]
                    results.append(BatchResult(
                        id=item.id,
                        success=False,
                        error_message=str(e),
                        timestamp=datetime.utcnow()
                    ))
        
        return results
    
    def submit_job(self, items: List[BatchItem], user_id: Optional[str] = None,
                   priority: int = 0, callback_url: Optional[str] = None) -> str:
        """Submit a batch job for background processing"""
        job_id = str(uuid.uuid4())
        
        job = BatchJob(
            job_id=job_id,
            items=items,
            created_at=datetime.utcnow(),
            user_id=user_id,
            priority=priority,
            callback_url=callback_url
        )
        
        # Add to queue (higher priority jobs first)
        self.job_queue.put(job)
        
        logger.info(f"Submitted batch job {job_id} with {len(items)} items")
        return job_id
    
    def get_job_status(self, job_id: str) -> Dict[str, Any]:
        """Get status of a batch job"""
        # Check if job is completed
        if job_id in self.completed_jobs:
            return {
                'status': 'completed',
                'job_id': job_id,
                **self.completed_jobs[job_id]
            }
        
        # Check if job is active
        if job_id in self.active_jobs:
            job = self.active_jobs[job_id]
            return {
                'status': 'processing',
                'job_id': job_id,
                'total_items': len(job.items),
                'created_at': job.created_at.isoformat(),
                'user_id': job.user_id
            }
        
        # Check if job is queued
        # Note: This is a simplified check - in production you might want a more sophisticated queue inspection
        return {
            'status': 'queued',
            'job_id': job_id
        }
    
    def cancel_job(self, job_id: str) -> bool:
        """Cancel a batch job"""
        # Remove from active jobs if present
        if job_id in self.active_jobs:
            # Note: This doesn't actually stop running threads, just marks as cancelled
            # In production, you'd want more sophisticated cancellation
            self.active_jobs.pop(job_id, None)
            logger.info(f"Cancelled active job {job_id}")
            return True
        
        return False
    
    def _send_callback(self, callback_url: str, result_data: Dict[str, Any]):
        """Send callback notification"""
        try:
            import requests
            response = requests.post(
                callback_url,
                json=result_data,
                timeout=30,
                headers={'Content-Type': 'application/json'}
            )
            response.raise_for_status()
            logger.info(f"Callback sent successfully to {callback_url}")
            
        except Exception as e:
            logger.error(f"Failed to send callback to {callback_url}: {e}")
    
    def _cleanup_old_jobs(self, max_age_hours: int = 1):
        """Clean up old completed jobs"""
        cutoff_time = datetime.utcnow() - timedelta(hours=max_age_hours)
        
        jobs_to_remove = []
        for job_id, job_data in self.completed_jobs.items():
            if 'completed_at' in job_data:
                completed_at = datetime.fromisoformat(job_data['completed_at'])
                if completed_at < cutoff_time:
                    jobs_to_remove.append(job_id)
        
        for job_id in jobs_to_remove:
            self.completed_jobs.pop(job_id, None)
        
        if jobs_to_remove:
            logger.debug(f"Cleaned up {len(jobs_to_remove)} old jobs")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get batch processor statistics"""
        return {
            'active_jobs': len(self.active_jobs),
            'completed_jobs': len(self.completed_jobs),
            'queue_size': self.job_queue.qsize(),
            'max_workers': self.max_workers,
            'max_concurrent_batches': self.max_concurrent_batches
        }
    
    def shutdown(self):
        """Shutdown the batch processor"""
        logger.info("Shutting down batch processor...")
        
        # Signal shutdown
        self.shutdown_event.set()
        
        # Wait for background thread
        if self.processing_thread and self.processing_thread.is_alive():
            self.processing_thread.join(timeout=5)
        
        # Shutdown executor
        self.executor.shutdown(wait=True)
        
        logger.info("Batch processor shutdown complete")

class BatchFileProcessor:
    """File-based batch processing for large datasets"""
    
    def __init__(self, batch_processor: BatchProcessor):
        self.batch_processor = batch_processor
    
    def process_csv_file(self, input_file: str, output_file: str,
                        prompt_column: str = 'prompt',
                        model_column: str = 'model',
                        batch_size: int = 100) -> str:
        """Process prompts from CSV file"""
        import pandas as pd
        
        try:
            # Read CSV file
            df = pd.read_csv(input_file)
            
            if prompt_column not in df.columns:
                raise ValueError(f"Column '{prompt_column}' not found in CSV")
            
            # Process in batches
            results = []
            total_rows = len(df)
            
            for i in range(0, total_rows, batch_size):
                batch_df = df.iloc[i:i+batch_size]
                
                # Create batch items
                items = []
                for _, row in batch_df.iterrows():
                    items.append(BatchItem(
                        id=f"row_{i + _}",
                        prompt=str(row[prompt_column]),
                        model=str(row.get(model_column, 'default')),
                        metadata={'row_index': i + _}
                    ))
                
                # Process batch synchronously
                batch_results = self.batch_processor._process_batch_sync(items, None)
                results.extend(batch_results)
                
                logger.info(f"Processed batch {i//batch_size + 1}/{(total_rows + batch_size - 1)//batch_size}")
            
            # Create output DataFrame
            output_data = []
            for i, result in enumerate(results):
                output_data.append({
                    'original_prompt': df.iloc[i][prompt_column],
                    'enhanced_prompt': result.enhanced_prompt if result.success else None,
                    'template_used': result.template_used if result.success else None,
                    'success': result.success,
                    'error_message': result.error_message,
                    'processing_time_ms': result.processing_time_ms
                })
            
            # Save to CSV
            output_df = pd.DataFrame(output_data)
            output_df.to_csv(output_file, index=False)
            
            logger.info(f"Batch processing complete. Results saved to {output_file}")
            return output_file
            
        except Exception as e:
            logger.error(f"Error processing CSV file: {e}")
            raise
    
    def process_json_file(self, input_file: str, output_file: str,
                         batch_size: int = 100) -> str:
        """Process prompts from JSON file"""
        try:
            with open(input_file, 'r') as f:
                data = json.load(f)
            
            if not isinstance(data, list):
                raise ValueError("JSON file must contain an array of objects")
            
            # Process in batches
            results = []
            total_items = len(data)
            
            for i in range(0, total_items, batch_size):
                batch_data = data[i:i+batch_size]
                
                # Create batch items
                items = []
                for j, item in enumerate(batch_data):
                    if isinstance(item, str):
                        prompt = item
                        model = "default"
                    elif isinstance(item, dict):
                        prompt = item.get('prompt', '')
                        model = item.get('model', 'default')
                    else:
                        raise ValueError(f"Invalid item format at index {i + j}")
                    
                    items.append(BatchItem(
                        id=f"item_{i + j}",
                        prompt=prompt,
                        model=model,
                        metadata={'original_index': i + j}
                    ))
                
                # Process batch
                batch_results = self.batch_processor._process_batch_sync(items, None)
                results.extend(batch_results)
                
                logger.info(f"Processed batch {i//batch_size + 1}/{(total_items + batch_size - 1)//batch_size}")
            
            # Create output data
            output_data = []
            for i, result in enumerate(results):
                original_item = data[i]
                output_item = {
                    'original': original_item,
                    'enhanced_prompt': result.enhanced_prompt if result.success else None,
                    'template_used': result.template_used if result.success else None,
                    'success': result.success,
                    'error_message': result.error_message,
                    'processing_time_ms': result.processing_time_ms,
                    'timestamp': result.timestamp.isoformat() if result.timestamp else None
                }
                output_data.append(output_item)
            
            # Save to JSON
            with open(output_file, 'w') as f:
                json.dump(output_data, f, indent=2, default=str)
            
            logger.info(f"Batch processing complete. Results saved to {output_file}")
            return output_file
            
        except Exception as e:
            logger.error(f"Error processing JSON file: {e}")
            raise

def main():
    """CLI interface for batch processing"""
    import argparse
    from prompt_craft import load_config
    
    parser = argparse.ArgumentParser(description="PromptCraft Batch Processor")
    parser.add_argument('--csv', type=str, help='Process CSV file')
    parser.add_argument('--json', type=str, help='Process JSON file')
    parser.add_argument('--output', type=str, required=True, help='Output file')
    parser.add_argument('--batch-size', type=int, default=100, help='Batch size')
    parser.add_argument('--prompt-column', type=str, default='prompt', help='CSV prompt column name')
    parser.add_argument('--model-column', type=str, default='model', help='CSV model column name')
    
    args = parser.parse_args()
    
    # Load configuration
    config = load_config()
    
    # Initialize batch processor
    batch_processor = BatchProcessor(config)
    file_processor = BatchFileProcessor(batch_processor)
    
    try:
        if args.csv:
            file_processor.process_csv_file(
                args.csv, args.output, args.prompt_column, args.model_column, args.batch_size
            )
        elif args.json:
            file_processor.process_json_file(args.json, args.output, args.batch_size)
        else:
            print("Error: Specify either --csv or --json input file")
            return 1
        
        print(f"✅ Batch processing completed. Results saved to {args.output}")
        return 0
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1
    finally:
        batch_processor.shutdown()

if __name__ == "__main__":
    import sys
    import os
    from datetime import timedelta
    
    sys.exit(main())