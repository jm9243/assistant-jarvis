"""
Audit logging module for security-sensitive operations.

This module provides comprehensive audit logging for tool calls,
sensitive operations, and security events.
"""

from datetime import datetime
from typing import Optional, Dict, Any, List
from pathlib import Path
import json
from enum import Enum
from dataclasses import dataclass, asdict
from loguru import logger
import asyncio


class AuditEventType(str, Enum):
    """Types of audit events."""
    TOOL_CALL = "tool_call"
    SENSITIVE_OPERATION = "sensitive_operation"
    API_KEY_ACCESS = "api_key_access"
    CONFIG_CHANGE = "config_change"
    AUTHENTICATION = "authentication"
    AUTHORIZATION = "authorization"
    DATA_ACCESS = "data_access"
    SECURITY_VIOLATION = "security_violation"


class AuditSeverity(str, Enum):
    """Severity levels for audit events."""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


@dataclass
class AuditEvent:
    """Audit event data structure."""
    event_id: str
    event_type: AuditEventType
    severity: AuditSeverity
    timestamp: str
    user_id: Optional[str]
    agent_id: Optional[str]
    operation: str
    details: Dict[str, Any]
    result: Optional[str]
    error: Optional[str]
    ip_address: Optional[str]
    user_agent: Optional[str]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return asdict(self)
    
    def to_json(self) -> str:
        """Convert to JSON string (single line for JSONL format)."""
        return json.dumps(self.to_dict(), default=str)


class AuditLogger:
    """
    Audit logger for security-sensitive operations.
    
    Logs all security-relevant events to both file and optionally
    to a backend service for centralized monitoring.
    """
    
    def __init__(
        self,
        log_dir: Optional[Path] = None,
        backend_client: Optional[Any] = None,
        enable_backend_logging: bool = False
    ):
        """
        Initialize audit logger.
        
        Args:
            log_dir: Directory to store audit logs (default: ~/.jarvis/audit)
            backend_client: Backend API client for remote logging
            enable_backend_logging: Whether to send logs to backend
        """
        if log_dir is None:
            log_dir = Path.home() / ".jarvis" / "audit"
        
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(parents=True, exist_ok=True)
        
        self.backend_client = backend_client
        self.enable_backend_logging = enable_backend_logging
        
        # Create audit log file with date
        self.current_log_file = self._get_log_file()
        
        logger.info(f"Audit logger initialized: {self.log_dir}")
    
    def _get_log_file(self) -> Path:
        """Get current audit log file path."""
        date_str = datetime.now().strftime("%Y-%m-%d")
        return self.log_dir / f"audit_{date_str}.jsonl"
    
    def _generate_event_id(self) -> str:
        """Generate unique event ID."""
        import uuid
        return str(uuid.uuid4())
    
    async def log_event(self, event: AuditEvent) -> bool:
        """
        Log an audit event.
        
        Args:
            event: Audit event to log
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Write to file
            self._write_to_file(event)
            
            # Send to backend if enabled
            if self.enable_backend_logging and self.backend_client:
                await self._send_to_backend(event)
            
            # Log to console based on severity
            self._log_to_console(event)
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to log audit event: {e}")
            return False
    
    def _write_to_file(self, event: AuditEvent):
        """Write event to audit log file."""
        log_file = self._get_log_file()
        
        with open(log_file, 'a') as f:
            f.write(event.to_json() + '\n')
    
    async def _send_to_backend(self, event: AuditEvent):
        """Send event to backend service."""
        try:
            if self.backend_client:
                await self.backend_client.post(
                    "/api/v1/audit-logs",
                    event.to_dict()
                )
        except Exception as e:
            logger.warning(f"Failed to send audit event to backend: {e}")
    
    def _log_to_console(self, event: AuditEvent):
        """Log event to console based on severity."""
        message = f"[AUDIT] {event.event_type.value}: {event.operation}"
        
        if event.severity == AuditSeverity.INFO:
            logger.info(message)
        elif event.severity == AuditSeverity.WARNING:
            logger.warning(message)
        elif event.severity == AuditSeverity.ERROR:
            logger.error(message)
        elif event.severity == AuditSeverity.CRITICAL:
            logger.critical(message)
    
    async def log_tool_call(
        self,
        tool_id: str,
        tool_name: str,
        agent_id: str,
        user_id: Optional[str],
        params: Dict[str, Any],
        result: Optional[Any] = None,
        error: Optional[str] = None,
        execution_time_ms: Optional[int] = None
    ) -> bool:
        """
        Log a tool call event.
        
        Args:
            tool_id: Tool identifier
            tool_name: Tool name
            agent_id: Agent identifier
            user_id: User identifier
            params: Tool call parameters
            result: Tool execution result
            error: Error message if failed
            execution_time_ms: Execution time in milliseconds
            
        Returns:
            bool: True if successful, False otherwise
        """
        event = AuditEvent(
            event_id=self._generate_event_id(),
            event_type=AuditEventType.TOOL_CALL,
            severity=AuditSeverity.WARNING if error else AuditSeverity.INFO,
            timestamp=datetime.now().isoformat(),
            user_id=user_id,
            agent_id=agent_id,
            operation=f"tool_call:{tool_name}",
            details={
                "tool_id": tool_id,
                "tool_name": tool_name,
                "params": params,
                "execution_time_ms": execution_time_ms
            },
            result=str(result) if result else None,
            error=error,
            ip_address=None,
            user_agent=None
        )
        
        return await self.log_event(event)
    
    async def log_sensitive_operation(
        self,
        operation: str,
        user_id: Optional[str],
        agent_id: Optional[str],
        details: Dict[str, Any],
        success: bool = True,
        error: Optional[str] = None
    ) -> bool:
        """
        Log a sensitive operation.
        
        Args:
            operation: Operation name
            user_id: User identifier
            agent_id: Agent identifier
            details: Operation details
            success: Whether operation succeeded
            error: Error message if failed
            
        Returns:
            bool: True if successful, False otherwise
        """
        event = AuditEvent(
            event_id=self._generate_event_id(),
            event_type=AuditEventType.SENSITIVE_OPERATION,
            severity=AuditSeverity.ERROR if not success else AuditSeverity.WARNING,
            timestamp=datetime.now().isoformat(),
            user_id=user_id,
            agent_id=agent_id,
            operation=operation,
            details=details,
            result="success" if success else "failure",
            error=error,
            ip_address=None,
            user_agent=None
        )
        
        return await self.log_event(event)
    
    async def log_api_key_access(
        self,
        provider: str,
        user_id: Optional[str],
        operation: str,
        success: bool = True
    ) -> bool:
        """
        Log API key access event.
        
        Args:
            provider: API provider name
            user_id: User identifier
            operation: Operation type (read/write/delete)
            success: Whether operation succeeded
            
        Returns:
            bool: True if successful, False otherwise
        """
        event = AuditEvent(
            event_id=self._generate_event_id(),
            event_type=AuditEventType.API_KEY_ACCESS,
            severity=AuditSeverity.WARNING,
            timestamp=datetime.now().isoformat(),
            user_id=user_id,
            agent_id=None,
            operation=f"api_key_{operation}",
            details={
                "provider": provider,
                "operation": operation
            },
            result="success" if success else "failure",
            error=None,
            ip_address=None,
            user_agent=None
        )
        
        return await self.log_event(event)
    
    async def log_config_change(
        self,
        config_name: str,
        user_id: Optional[str],
        agent_id: Optional[str],
        changes: Dict[str, Any],
        old_values: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Log configuration change event.
        
        Args:
            config_name: Configuration name
            user_id: User identifier
            agent_id: Agent identifier
            changes: Changed values
            old_values: Previous values
            
        Returns:
            bool: True if successful, False otherwise
        """
        event = AuditEvent(
            event_id=self._generate_event_id(),
            event_type=AuditEventType.CONFIG_CHANGE,
            severity=AuditSeverity.INFO,
            timestamp=datetime.now().isoformat(),
            user_id=user_id,
            agent_id=agent_id,
            operation=f"config_change:{config_name}",
            details={
                "config_name": config_name,
                "changes": changes,
                "old_values": old_values
            },
            result="success",
            error=None,
            ip_address=None,
            user_agent=None
        )
        
        return await self.log_event(event)
    
    async def log_security_violation(
        self,
        violation_type: str,
        user_id: Optional[str],
        agent_id: Optional[str],
        details: Dict[str, Any],
        severity: AuditSeverity = AuditSeverity.ERROR
    ) -> bool:
        """
        Log security violation event.
        
        Args:
            violation_type: Type of violation
            user_id: User identifier
            agent_id: Agent identifier
            details: Violation details
            severity: Event severity
            
        Returns:
            bool: True if successful, False otherwise
        """
        event = AuditEvent(
            event_id=self._generate_event_id(),
            event_type=AuditEventType.SECURITY_VIOLATION,
            severity=severity,
            timestamp=datetime.now().isoformat(),
            user_id=user_id,
            agent_id=agent_id,
            operation=f"security_violation:{violation_type}",
            details=details,
            result="violation_detected",
            error=None,
            ip_address=None,
            user_agent=None
        )
        
        return await self.log_event(event)
    
    def query_logs(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        event_type: Optional[AuditEventType] = None,
        user_id: Optional[str] = None,
        agent_id: Optional[str] = None,
        severity: Optional[AuditSeverity] = None,
        limit: int = 100
    ) -> List[AuditEvent]:
        """
        Query audit logs.
        
        Args:
            start_date: Start date filter
            end_date: End date filter
            event_type: Event type filter
            user_id: User ID filter
            agent_id: Agent ID filter
            severity: Severity filter
            limit: Maximum number of results
            
        Returns:
            List[AuditEvent]: Matching audit events
        """
        events = []
        
        try:
            # Get all log files in date range
            log_files = sorted(self.log_dir.glob("audit_*.jsonl"))
            
            for log_file in log_files:
                with open(log_file, 'r') as f:
                    for line in f:
                        if not line.strip():
                            continue
                        
                        try:
                            event_dict = json.loads(line)
                            event = AuditEvent(**event_dict)
                            
                            # Apply filters
                            if start_date and datetime.fromisoformat(event.timestamp) < start_date:
                                continue
                            if end_date and datetime.fromisoformat(event.timestamp) > end_date:
                                continue
                            if event_type and event.event_type != event_type:
                                continue
                            if user_id and event.user_id != user_id:
                                continue
                            if agent_id and event.agent_id != agent_id:
                                continue
                            if severity and event.severity != severity:
                                continue
                            
                            events.append(event)
                            
                            if len(events) >= limit:
                                return events
                                
                        except Exception as e:
                            logger.warning(f"Failed to parse audit log line: {e}")
                            continue
            
            return events
            
        except Exception as e:
            logger.error(f"Failed to query audit logs: {e}")
            return []
    
    def get_statistics(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Get audit log statistics.
        
        Args:
            start_date: Start date filter
            end_date: End date filter
            
        Returns:
            Dict[str, Any]: Statistics summary
        """
        events = self.query_logs(
            start_date=start_date,
            end_date=end_date,
            limit=10000
        )
        
        stats = {
            "total_events": len(events),
            "by_type": {},
            "by_severity": {},
            "by_user": {},
            "by_agent": {},
            "tool_calls": 0,
            "security_violations": 0,
            "failed_operations": 0
        }
        
        for event in events:
            # Count by type (handle both enum and string)
            event_type = event.event_type.value if isinstance(event.event_type, AuditEventType) else event.event_type
            stats["by_type"][event_type] = stats["by_type"].get(event_type, 0) + 1
            
            # Count by severity (handle both enum and string)
            severity = event.severity.value if isinstance(event.severity, AuditSeverity) else event.severity
            stats["by_severity"][severity] = stats["by_severity"].get(severity, 0) + 1
            
            # Count by user
            if event.user_id:
                stats["by_user"][event.user_id] = stats["by_user"].get(event.user_id, 0) + 1
            
            # Count by agent
            if event.agent_id:
                stats["by_agent"][event.agent_id] = stats["by_agent"].get(event.agent_id, 0) + 1
            
            # Special counters (handle both enum and string)
            event_type_str = event.event_type.value if isinstance(event.event_type, AuditEventType) else event.event_type
            if event_type_str == "tool_call":
                stats["tool_calls"] += 1
            if event_type_str == "security_violation":
                stats["security_violations"] += 1
            if event.error:
                stats["failed_operations"] += 1
        
        return stats


# Global audit logger instance
_audit_logger: Optional[AuditLogger] = None


def get_audit_logger() -> AuditLogger:
    """Get global audit logger instance."""
    global _audit_logger
    if _audit_logger is None:
        _audit_logger = AuditLogger()
    return _audit_logger


def set_audit_logger(audit_logger: AuditLogger):
    """Set global audit logger instance."""
    global _audit_logger
    _audit_logger = audit_logger
