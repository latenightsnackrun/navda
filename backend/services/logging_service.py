"""
Comprehensive Logging and Monitoring Service
Provides structured logging, metrics collection, and monitoring for AI agents
"""

import logging
import logging.handlers
import json
import os
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import threading
import time

class LogLevel(Enum):
    """Log levels for the system"""
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"

class MetricType(Enum):
    """Types of metrics that can be collected"""
    COUNTER = "counter"
    GAUGE = "gauge"
    HISTOGRAM = "histogram"
    TIMER = "timer"

@dataclass
class LogEntry:
    """Represents a log entry"""
    timestamp: datetime
    level: LogLevel
    component: str
    message: str
    data: Dict[str, Any] = None
    correlation_id: str = None

@dataclass
class Metric:
    """Represents a metric"""
    name: str
    value: float
    metric_type: MetricType
    timestamp: datetime
    tags: Dict[str, str] = None
    component: str = None

@dataclass
class PerformanceMetric:
    """Represents a performance metric"""
    component: str
    operation: str
    duration: float
    timestamp: datetime
    success: bool
    error_message: str = None

class LoggingService:
    """Comprehensive logging and monitoring service"""
    
    def __init__(self, log_dir: str = "logs", max_log_files: int = 10, 
                 max_file_size: int = 10 * 1024 * 1024):  # 10MB
        self.log_dir = log_dir
        self.max_log_files = max_log_files
        self.max_file_size = max_file_size
        
        # Create log directory if it doesn't exist
        os.makedirs(log_dir, exist_ok=True)
        
        # Log storage
        self.log_entries: List[LogEntry] = []
        self.metrics: List[Metric] = []
        self.performance_metrics: List[PerformanceMetric] = []
        
        # Thread safety
        self.lock = threading.Lock()
        
        # Setup loggers
        self._setup_loggers()
        
        # Metrics collection
        self.metrics_enabled = True
        self.metrics_retention_hours = 24
        
        # Performance tracking
        self.performance_tracking = True
        
        # Cleanup task
        self.cleanup_thread = threading.Thread(target=self._cleanup_old_data, daemon=True)
        self.cleanup_thread.start()
    
    def _setup_loggers(self):
        """Setup loggers for different components"""
        # Main logger
        self.logger = logging.getLogger("avivato_atc")
        self.logger.setLevel(logging.DEBUG)
        
        # Create formatters
        detailed_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(component)s - %(message)s'
        )
        simple_formatter = logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s'
        )
        
        # File handlers
        self._setup_file_handlers(detailed_formatter)
        
        # Console handler
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        console_handler.setFormatter(simple_formatter)
        self.logger.addHandler(console_handler)
        
        # Component-specific loggers
        self.component_loggers = {
            "conflict_detector": self._create_component_logger("conflict_detector"),
            "resolution_agent": self._create_component_logger("resolution_agent"),
            "aircraft_tracker": self._create_component_logger("aircraft_tracker"),
            "websocket_service": self._create_component_logger("websocket_service"),
            "agent_coordinator": self._create_component_logger("agent_coordinator")
        }
    
    def _setup_file_handlers(self, formatter):
        """Setup file handlers with rotation"""
        # Main log file
        main_handler = logging.handlers.RotatingFileHandler(
            os.path.join(self.log_dir, "avivato_atc.log"),
            maxBytes=self.max_file_size,
            backupCount=self.max_log_files
        )
        main_handler.setLevel(logging.DEBUG)
        main_handler.setFormatter(formatter)
        self.logger.addHandler(main_handler)
        
        # Error log file
        error_handler = logging.handlers.RotatingFileHandler(
            os.path.join(self.log_dir, "errors.log"),
            maxBytes=self.max_file_size,
            backupCount=self.max_log_files
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(formatter)
        self.logger.addHandler(error_handler)
        
        # Performance log file
        perf_handler = logging.handlers.RotatingFileHandler(
            os.path.join(self.log_dir, "performance.log"),
            maxBytes=self.max_file_size,
            backupCount=self.max_log_files
        )
        perf_handler.setLevel(logging.INFO)
        perf_handler.setFormatter(formatter)
        self.logger.addHandler(perf_handler)
    
    def _create_component_logger(self, component_name: str) -> logging.Logger:
        """Create a logger for a specific component"""
        logger = logging.getLogger(f"avivato_atc.{component_name}")
        logger.setLevel(logging.DEBUG)
        
        # Component-specific file handler
        handler = logging.handlers.RotatingFileHandler(
            os.path.join(self.log_dir, f"{component_name}.log"),
            maxBytes=self.max_file_size,
            backupCount=self.max_log_files
        )
        handler.setLevel(logging.DEBUG)
        
        formatter = logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        
        return logger
    
    def log(self, level: LogLevel, component: str, message: str, 
            data: Dict[str, Any] = None, correlation_id: str = None):
        """Log a message"""
        with self.lock:
            entry = LogEntry(
                timestamp=datetime.now(),
                level=level,
                component=component,
                message=message,
                data=data,
                correlation_id=correlation_id
            )
            
            self.log_entries.append(entry)
            
            # Keep only recent entries in memory
            if len(self.log_entries) > 10000:
                self.log_entries = self.log_entries[-5000:]
            
            # Log to appropriate logger
            component_logger = self.component_loggers.get(component, self.logger)
            
            log_data = {
                'component': component,
                'correlation_id': correlation_id,
                'data': data
            }
            
            # Convert LogLevel to logging level
            log_level_map = {
                LogLevel.DEBUG: logging.DEBUG,
                LogLevel.INFO: logging.INFO,
                LogLevel.WARNING: logging.WARNING,
                LogLevel.ERROR: logging.ERROR,
                LogLevel.CRITICAL: logging.CRITICAL
            }
            
            # Create log record with component field
            log_record = logging.LogRecord(
                name=component_logger.name,
                level=log_level_map[level],
                pathname="",
                lineno=0,
                msg=f"{message} | {json.dumps(log_data)}",
                args=(),
                exc_info=None
            )
            log_record.component = component
            
            if level == LogLevel.DEBUG:
                component_logger.handle(log_record)
            elif level == LogLevel.INFO:
                component_logger.handle(log_record)
            elif level == LogLevel.WARNING:
                component_logger.handle(log_record)
            elif level == LogLevel.ERROR:
                component_logger.handle(log_record)
            elif level == LogLevel.CRITICAL:
                component_logger.handle(log_record)
    
    def log_conflict_detected(self, conflict_id: str, aircraft1: str, aircraft2: str, 
                             severity: str, confidence: float):
        """Log conflict detection"""
        self.log(
            LogLevel.WARNING,
            "conflict_detector",
            f"Conflict detected: {aircraft1} vs {aircraft2}",
            {
                "conflict_id": conflict_id,
                "aircraft1": aircraft1,
                "aircraft2": aircraft2,
                "severity": severity,
                "confidence": confidence
            }
        )
    
    def log_resolution_generated(self, conflict_id: str, strategy_count: int, 
                               best_confidence: float):
        """Log resolution generation"""
        self.log(
            LogLevel.INFO,
            "resolution_agent",
            f"Generated {strategy_count} resolution strategies",
            {
                "conflict_id": conflict_id,
                "strategy_count": strategy_count,
                "best_confidence": best_confidence
            }
        )
    
    def log_resolution_accepted(self, strategy_id: str, conflict_id: str, 
                              resolution_time: float):
        """Log resolution acceptance"""
        self.log(
            LogLevel.INFO,
            "resolution_agent",
            f"Resolution strategy accepted: {strategy_id}",
            {
                "strategy_id": strategy_id,
                "conflict_id": conflict_id,
                "resolution_time": resolution_time
            }
        )
    
    def log_performance(self, component: str, operation: str, duration: float, 
                       success: bool, error_message: str = None):
        """Log performance metrics"""
        with self.lock:
            metric = PerformanceMetric(
                component=component,
                operation=operation,
                duration=duration,
                timestamp=datetime.now(),
                success=success,
                error_message=error_message
            )
            
            self.performance_metrics.append(metric)
            
            # Log to performance logger
            perf_logger = logging.getLogger("avivato_atc.performance")
            status = "SUCCESS" if success else "FAILED"
            perf_logger.info(f"{component}.{operation} - {status} - {duration:.3f}s")
    
    def record_metric(self, name: str, value: float, metric_type: MetricType, 
                     component: str = None, tags: Dict[str, str] = None):
        """Record a metric"""
        if not self.metrics_enabled:
            return
        
        with self.lock:
            metric = Metric(
                name=name,
                value=value,
                metric_type=metric_type,
                timestamp=datetime.now(),
                component=component,
                tags=tags or {}
            )
            
            self.metrics.append(metric)
    
    def increment_counter(self, name: str, component: str = None, tags: Dict[str, str] = None):
        """Increment a counter metric"""
        self.record_metric(name, 1.0, MetricType.COUNTER, component, tags)
    
    def set_gauge(self, name: str, value: float, component: str = None, tags: Dict[str, str] = None):
        """Set a gauge metric"""
        self.record_metric(name, value, MetricType.GAUGE, component, tags)
    
    def record_timer(self, name: str, duration: float, component: str = None, tags: Dict[str, str] = None):
        """Record a timer metric"""
        self.record_metric(name, duration, MetricType.TIMER, component, tags)
    
    def get_logs(self, component: str = None, level: LogLevel = None, 
                start_time: datetime = None, end_time: datetime = None, 
                limit: int = 1000) -> List[Dict]:
        """Get log entries with filtering"""
        with self.lock:
            logs = self.log_entries.copy()
        
        # Apply filters
        if component:
            logs = [log for log in logs if log.component == component]
        
        if level:
            logs = [log for log in logs if log.level == level]
        
        if start_time:
            logs = [log for log in logs if log.timestamp >= start_time]
        
        if end_time:
            logs = [log for log in logs if log.timestamp <= end_time]
        
        # Sort by timestamp (newest first)
        logs.sort(key=lambda x: x.timestamp, reverse=True)
        
        # Limit results
        logs = logs[:limit]
        
        return [asdict(log) for log in logs]
    
    def get_metrics(self, component: str = None, metric_type: MetricType = None,
                   start_time: datetime = None, end_time: datetime = None,
                   limit: int = 1000) -> List[Dict]:
        """Get metrics with filtering"""
        with self.lock:
            metrics = self.metrics.copy()
        
        # Apply filters
        if component:
            metrics = [metric for metric in metrics if metric.component == component]
        
        if metric_type:
            metrics = [metric for metric in metrics if metric.metric_type == metric_type]
        
        if start_time:
            metrics = [metric for metric in metrics if metric.timestamp >= start_time]
        
        if end_time:
            metrics = [metric for metric in metrics if metric.timestamp <= end_time]
        
        # Sort by timestamp (newest first)
        metrics.sort(key=lambda x: x.timestamp, reverse=True)
        
        # Limit results
        metrics = metrics[:limit]
        
        return [asdict(metric) for metric in metrics]
    
    def get_performance_summary(self, component: str = None, 
                               start_time: datetime = None, 
                               end_time: datetime = None) -> Dict:
        """Get performance summary"""
        with self.lock:
            perf_metrics = self.performance_metrics.copy()
        
        # Apply filters
        if component:
            perf_metrics = [metric for metric in perf_metrics if metric.component == component]
        
        if start_time:
            perf_metrics = [metric for metric in perf_metrics if metric.timestamp >= start_time]
        
        if end_time:
            perf_metrics = [metric for metric in perf_metrics if metric.timestamp <= end_time]
        
        if not perf_metrics:
            return {}
        
        # Calculate summary statistics
        durations = [metric.duration for metric in perf_metrics]
        success_count = sum(1 for metric in perf_metrics if metric.success)
        failure_count = len(perf_metrics) - success_count
        
        return {
            "total_operations": len(perf_metrics),
            "success_count": success_count,
            "failure_count": failure_count,
            "success_rate": success_count / len(perf_metrics) if perf_metrics else 0,
            "avg_duration": sum(durations) / len(durations),
            "min_duration": min(durations),
            "max_duration": max(durations),
            "component": component or "all"
        }
    
    def get_system_health(self) -> Dict:
        """Get system health summary"""
        now = datetime.now()
        recent_time = now - timedelta(minutes=5)
        
        # Get recent logs
        recent_logs = self.get_logs(start_time=recent_time)
        
        # Count log levels
        log_counts = {}
        for log in recent_logs:
            level = log['level']
            log_counts[level] = log_counts.get(level, 0) + 1
        
        # Get recent performance metrics
        recent_perf = [metric for metric in self.performance_metrics 
                      if metric.timestamp >= recent_time]
        
        # Calculate health score
        health_score = 100
        if log_counts.get(LogLevel.ERROR.value, 0) > 0:
            health_score -= 20
        if log_counts.get(LogLevel.CRITICAL.value, 0) > 0:
            health_score -= 50
        
        # Check performance
        if recent_perf:
            success_rate = sum(1 for p in recent_perf if p.success) / len(recent_perf)
            health_score = min(health_score, success_rate * 100)
        
        return {
            "health_score": max(0, health_score),
            "status": "healthy" if health_score > 80 else "degraded" if health_score > 50 else "unhealthy",
            "recent_logs": log_counts,
            "recent_operations": len(recent_perf),
            "timestamp": now.isoformat()
        }
    
    def _cleanup_old_data(self):
        """Cleanup old data to prevent memory issues"""
        while True:
            try:
                time.sleep(3600)  # Run every hour
                
                cutoff_time = datetime.now() - timedelta(hours=self.metrics_retention_hours)
                
                with self.lock:
                    # Cleanup old metrics
                    self.metrics = [metric for metric in self.metrics 
                                  if metric.timestamp >= cutoff_time]
                    
                    # Cleanup old performance metrics
                    self.performance_metrics = [metric for metric in self.performance_metrics 
                                              if metric.timestamp >= cutoff_time]
                
            except Exception as e:
                self.logger.error(f"Error in cleanup thread: {e}")
    
    def export_logs(self, filepath: str, component: str = None, 
                   start_time: datetime = None, end_time: datetime = None):
        """Export logs to a file"""
        logs = self.get_logs(component, start_time=start_time, end_time=end_time)
        
        with open(filepath, 'w') as f:
            json.dump(logs, f, indent=2, default=str)
    
    def export_metrics(self, filepath: str, component: str = None,
                      start_time: datetime = None, end_time: datetime = None):
        """Export metrics to a file"""
        metrics = self.get_metrics(component, start_time=start_time, end_time=end_time)
        
        with open(filepath, 'w') as f:
            json.dump(metrics, f, indent=2, default=str)

# Global logging service instance
logging_service = LoggingService()
