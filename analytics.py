#!/usr/bin/env python3
"""
PromptCraft Analytics System
Comprehensive usage tracking and analytics for PromptCraft
"""

import os
import json
import sqlite3
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from pathlib import Path
from dataclasses import dataclass, asdict
from collections import defaultdict, Counter
import threading
import logging

logger = logging.getLogger('promptcraft.analytics')

@dataclass
class RequestEvent:
    """Data class for request events"""
    timestamp: datetime
    user_id: str
    template: str
    model: str
    processing_time: float
    success: bool
    request_id: str
    input_length: int
    output_length: int

@dataclass
class ErrorEvent:
    """Data class for error events"""
    timestamp: datetime
    user_id: Optional[str]
    error_type: str
    error_message: str
    request_id: Optional[str]

@dataclass
class BatchEvent:
    """Data class for batch processing events"""
    timestamp: datetime
    user_id: Optional[str]
    batch_size: int
    successful: int
    failed: int
    processing_time: float
    batch_id: str

class AnalyticsTracker:
    """Comprehensive analytics tracking system"""
    
    def __init__(self, db_path: Optional[str] = None):
        """Initialize analytics tracker"""
        self.db_path = db_path or os.path.join(
            os.path.expanduser(os.getenv('PROMPTCRAFT_CONFIG_DIR', '~/.config/promptcraft')),
            'analytics.db'
        )
        self.lock = threading.Lock()
        self._init_database()
        
        # In-memory cache for fast access
        self._cache = {
            'total_requests': 0,
            'requests_today': 0,
            'popular_templates': Counter(),
            'popular_models': Counter(),
            'processing_times': [],
            'error_count': 0,
            'last_cache_update': 0
        }
        self._update_cache()
    
    def _init_database(self):
        """Initialize SQLite database with required tables"""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        with sqlite3.connect(self.db_path) as conn:
            # Requests table
            conn.execute('''
                CREATE TABLE IF NOT EXISTS requests (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    user_id TEXT,
                    template TEXT NOT NULL,
                    model TEXT NOT NULL,
                    processing_time REAL NOT NULL,
                    success BOOLEAN NOT NULL,
                    request_id TEXT UNIQUE,
                    input_length INTEGER,
                    output_length INTEGER
                )
            ''')
            
            # Errors table
            conn.execute('''
                CREATE TABLE IF NOT EXISTS errors (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    user_id TEXT,
                    error_type TEXT NOT NULL,
                    error_message TEXT NOT NULL,
                    request_id TEXT
                )
            ''')
            
            # Batch processing table
            conn.execute('''
                CREATE TABLE IF NOT EXISTS batch_requests (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    user_id TEXT,
                    batch_size INTEGER NOT NULL,
                    successful INTEGER NOT NULL,
                    failed INTEGER NOT NULL,
                    processing_time REAL NOT NULL,
                    batch_id TEXT UNIQUE
                )
            ''')
            
            # User sessions table
            conn.execute('''
                CREATE TABLE IF NOT EXISTS user_sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    session_start TEXT NOT NULL,
                    session_end TEXT,
                    requests_count INTEGER DEFAULT 0,
                    total_processing_time REAL DEFAULT 0
                )
            ''')
            
            # Create indexes for better performance
            conn.execute('CREATE INDEX IF NOT EXISTS idx_requests_timestamp ON requests(timestamp)')
            conn.execute('CREATE INDEX IF NOT EXISTS idx_requests_user_id ON requests(user_id)')
            conn.execute('CREATE INDEX IF NOT EXISTS idx_requests_template ON requests(template)')
            conn.execute('CREATE INDEX IF NOT EXISTS idx_requests_model ON requests(model)')
            conn.execute('CREATE INDEX IF NOT EXISTS idx_errors_timestamp ON errors(timestamp)')
            conn.execute('CREATE INDEX IF NOT EXISTS idx_batch_timestamp ON batch_requests(timestamp)')
            
            conn.commit()
    
    def track_request(self, user_id: str, template: str, model: str, 
                     processing_time: float, success: bool, request_id: str = None,
                     input_length: int = 0, output_length: int = 0):
        """Track a prompt enhancement request"""
        event = RequestEvent(
            timestamp=datetime.utcnow(),
            user_id=user_id,
            template=template,
            model=model,
            processing_time=processing_time,
            success=success,
            request_id=request_id or f"req_{int(time.time() * 1000)}",
            input_length=input_length,
            output_length=output_length
        )
        
        with self.lock:
            try:
                with sqlite3.connect(self.db_path) as conn:
                    conn.execute('''
                        INSERT INTO requests 
                        (timestamp, user_id, template, model, processing_time, success, 
                         request_id, input_length, output_length)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        event.timestamp.isoformat(),
                        event.user_id,
                        event.template,
                        event.model,
                        event.processing_time,
                        event.success,
                        event.request_id,
                        event.input_length,
                        event.output_length
                    ))
                    conn.commit()
                
                # Update cache
                self._update_cache_incremental(event)
                
                logger.debug(f"Tracked request: {event.request_id}")
                
            except Exception as e:
                logger.error(f"Failed to track request: {e}")
    
    def track_error(self, error_type: str, error_message: str, 
                   user_id: Optional[str] = None, request_id: Optional[str] = None):
        """Track an error event"""
        event = ErrorEvent(
            timestamp=datetime.utcnow(),
            user_id=user_id,
            error_type=error_type,
            error_message=error_message,
            request_id=request_id
        )
        
        with self.lock:
            try:
                with sqlite3.connect(self.db_path) as conn:
                    conn.execute('''
                        INSERT INTO errors (timestamp, user_id, error_type, error_message, request_id)
                        VALUES (?, ?, ?, ?, ?)
                    ''', (
                        event.timestamp.isoformat(),
                        event.user_id,
                        event.error_type,
                        event.error_message,
                        event.request_id
                    ))
                    conn.commit()
                
                # Update error count in cache
                self._cache['error_count'] += 1
                
                logger.debug(f"Tracked error: {event.error_type}")
                
            except Exception as e:
                logger.error(f"Failed to track error: {e}")
    
    def track_batch_request(self, batch_size: int, successful: int, failed: int,
                           processing_time: float, user_id: Optional[str] = None,
                           batch_id: str = None):
        """Track a batch processing request"""
        event = BatchEvent(
            timestamp=datetime.utcnow(),
            user_id=user_id,
            batch_size=batch_size,
            successful=successful,
            failed=failed,
            processing_time=processing_time,
            batch_id=batch_id or f"batch_{int(time.time() * 1000)}"
        )
        
        with self.lock:
            try:
                with sqlite3.connect(self.db_path) as conn:
                    conn.execute('''
                        INSERT INTO batch_requests 
                        (timestamp, user_id, batch_size, successful, failed, processing_time, batch_id)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        event.timestamp.isoformat(),
                        event.user_id,
                        event.batch_size,
                        event.successful,
                        event.failed,
                        event.processing_time,
                        event.batch_id
                    ))
                    conn.commit()
                
                logger.debug(f"Tracked batch request: {event.batch_id}")
                
            except Exception as e:
                logger.error(f"Failed to track batch request: {e}")
    
    def _update_cache(self):
        """Update the in-memory cache with latest data"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Total requests
                cursor.execute('SELECT COUNT(*) FROM requests WHERE success = 1')
                self._cache['total_requests'] = cursor.fetchone()[0]
                
                # Requests today
                today = datetime.utcnow().date().isoformat()
                cursor.execute('SELECT COUNT(*) FROM requests WHERE DATE(timestamp) = ? AND success = 1', (today,))
                self._cache['requests_today'] = cursor.fetchone()[0]
                
                # Popular templates
                cursor.execute('SELECT template, COUNT(*) FROM requests WHERE success = 1 GROUP BY template')
                self._cache['popular_templates'] = Counter(dict(cursor.fetchall()))
                
                # Popular models
                cursor.execute('SELECT model, COUNT(*) FROM requests WHERE success = 1 GROUP BY model')
                self._cache['popular_models'] = Counter(dict(cursor.fetchall()))
                
                # Processing times (last 1000 requests)
                cursor.execute('SELECT processing_time FROM requests WHERE success = 1 ORDER BY timestamp DESC LIMIT 1000')
                self._cache['processing_times'] = [row[0] for row in cursor.fetchall()]
                
                # Error count
                cursor.execute('SELECT COUNT(*) FROM errors')
                self._cache['error_count'] = cursor.fetchone()[0]
                
                self._cache['last_cache_update'] = time.time()
                
        except Exception as e:
            logger.error(f"Failed to update cache: {e}")
    
    def _update_cache_incremental(self, event: RequestEvent):
        """Incrementally update cache with new event"""
        if event.success:
            self._cache['total_requests'] += 1
            
            # Check if today
            if event.timestamp.date() == datetime.utcnow().date():
                self._cache['requests_today'] += 1
            
            self._cache['popular_templates'][event.template] += 1
            self._cache['popular_models'][event.model] += 1
            
            # Add to processing times (keep last 1000)
            self._cache['processing_times'].append(event.processing_time)
            if len(self._cache['processing_times']) > 1000:
                self._cache['processing_times'].pop(0)
    
    def get_total_requests(self) -> int:
        """Get total number of successful requests"""
        return self._cache['total_requests']
    
    def get_analytics_summary(self) -> Dict[str, Any]:
        """Get comprehensive analytics summary"""
        # Update cache if it's older than 5 minutes
        if time.time() - self._cache['last_cache_update'] > 300:
            self._update_cache()
        
        # Calculate average processing time
        processing_times = self._cache['processing_times']
        avg_processing_time = sum(processing_times) / len(processing_times) if processing_times else 0
        
        # Calculate error rate
        total_events = self._cache['total_requests'] + self._cache['error_count']
        error_rate = (self._cache['error_count'] / total_events) if total_events > 0 else 0
        
        return {
            'total_requests': self._cache['total_requests'],
            'requests_today': self._cache['requests_today'],
            'popular_templates': dict(self._cache['popular_templates'].most_common(10)),
            'popular_models': dict(self._cache['popular_models'].most_common(10)),
            'average_processing_time': round(avg_processing_time, 2),
            'error_rate': round(error_rate * 100, 2),
            'total_errors': self._cache['error_count']
        }
    
    def get_detailed_analytics(self, days: int = 30) -> Dict[str, Any]:
        """Get detailed analytics for specified time period"""
        cutoff_date = (datetime.utcnow() - timedelta(days=days)).isoformat()
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Requests over time
                cursor.execute('''
                    SELECT DATE(timestamp) as date, COUNT(*) as count
                    FROM requests 
                    WHERE timestamp >= ? AND success = 1
                    GROUP BY DATE(timestamp)
                    ORDER BY date
                ''', (cutoff_date,))
                requests_over_time = dict(cursor.fetchall())
                
                # Template usage
                cursor.execute('''
                    SELECT template, COUNT(*) as count
                    FROM requests 
                    WHERE timestamp >= ? AND success = 1
                    GROUP BY template
                    ORDER BY count DESC
                ''', (cutoff_date,))
                template_usage = dict(cursor.fetchall())
                
                # Model usage
                cursor.execute('''
                    SELECT model, COUNT(*) as count
                    FROM requests 
                    WHERE timestamp >= ? AND success = 1
                    GROUP BY model
                    ORDER BY count DESC
                ''', (cutoff_date,))
                model_usage = dict(cursor.fetchall())
                
                # Error breakdown
                cursor.execute('''
                    SELECT error_type, COUNT(*) as count
                    FROM errors 
                    WHERE timestamp >= ?
                    GROUP BY error_type
                    ORDER BY count DESC
                ''', (cutoff_date,))
                error_breakdown = dict(cursor.fetchall())
                
                # Performance metrics
                cursor.execute('''
                    SELECT 
                        AVG(processing_time) as avg_time,
                        MIN(processing_time) as min_time,
                        MAX(processing_time) as max_time,
                        AVG(input_length) as avg_input_length,
                        AVG(output_length) as avg_output_length
                    FROM requests 
                    WHERE timestamp >= ? AND success = 1
                ''', (cutoff_date,))
                performance = cursor.fetchone()
                
                # User activity
                cursor.execute('''
                    SELECT 
                        COUNT(DISTINCT user_id) as unique_users,
                        COUNT(*) as total_requests
                    FROM requests 
                    WHERE timestamp >= ? AND success = 1
                ''', (cutoff_date,))
                user_stats = cursor.fetchone()
                
                return {
                    'period_days': days,
                    'requests_over_time': requests_over_time,
                    'template_usage': template_usage,
                    'model_usage': model_usage,
                    'error_breakdown': error_breakdown,
                    'performance': {
                        'average_processing_time': round(performance[0] or 0, 2),
                        'min_processing_time': round(performance[1] or 0, 2),
                        'max_processing_time': round(performance[2] or 0, 2),
                        'average_input_length': round(performance[3] or 0, 1),
                        'average_output_length': round(performance[4] or 0, 1)
                    },
                    'user_activity': {
                        'unique_users': user_stats[0],
                        'total_requests': user_stats[1]
                    }
                }
                
        except Exception as e:
            logger.error(f"Failed to get detailed analytics: {e}")
            return {}
    
    def export_analytics(self, output_file: str, format: str = 'json'):
        """Export analytics data to file"""
        try:
            data = {
                'summary': self.get_analytics_summary(),
                'detailed': self.get_detailed_analytics(30),
                'export_timestamp': datetime.utcnow().isoformat()
            }
            
            if format.lower() == 'json':
                with open(output_file, 'w') as f:
                    json.dump(data, f, indent=2, default=str)
            else:
                raise ValueError(f"Unsupported format: {format}")
            
            logger.info(f"Analytics exported to {output_file}")
            
        except Exception as e:
            logger.error(f"Failed to export analytics: {e}")
            raise
    
    def cleanup_old_data(self, days_to_keep: int = 90):
        """Clean up old analytics data"""
        cutoff_date = (datetime.utcnow() - timedelta(days=days_to_keep)).isoformat()
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                # Delete old requests
                cursor = conn.execute('DELETE FROM requests WHERE timestamp < ?', (cutoff_date,))
                requests_deleted = cursor.rowcount
                
                # Delete old errors
                cursor = conn.execute('DELETE FROM errors WHERE timestamp < ?', (cutoff_date,))
                errors_deleted = cursor.rowcount
                
                # Delete old batch requests
                cursor = conn.execute('DELETE FROM batch_requests WHERE timestamp < ?', (cutoff_date,))
                batch_deleted = cursor.rowcount
                
                conn.commit()
                
                logger.info(f"Cleaned up old data: {requests_deleted} requests, {errors_deleted} errors, {batch_deleted} batch requests")
                
                # Update cache after cleanup
                self._update_cache()
                
        except Exception as e:
            logger.error(f"Failed to cleanup old data: {e}")

def main():
    """CLI interface for analytics"""
    import argparse
    
    parser = argparse.ArgumentParser(description="PromptCraft Analytics")
    parser.add_argument('--summary', action='store_true', help='Show analytics summary')
    parser.add_argument('--detailed', type=int, default=30, help='Show detailed analytics for N days')
    parser.add_argument('--export', type=str, help='Export analytics to file')
    parser.add_argument('--cleanup', type=int, help='Cleanup data older than N days')
    
    args = parser.parse_args()
    
    analytics = AnalyticsTracker()
    
    if args.summary:
        summary = analytics.get_analytics_summary()
        print(json.dumps(summary, indent=2))
    
    if args.detailed:
        detailed = analytics.get_detailed_analytics(args.detailed)
        print(json.dumps(detailed, indent=2, default=str))
    
    if args.export:
        analytics.export_analytics(args.export)
        print(f"Analytics exported to {args.export}")
    
    if args.cleanup:
        analytics.cleanup_old_data(args.cleanup)
        print(f"Cleaned up data older than {args.cleanup} days")

if __name__ == "__main__":
    main()