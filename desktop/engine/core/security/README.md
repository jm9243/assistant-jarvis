# Security Module

This module provides comprehensive security features for the Jarvis Agent System, including secure API key storage, data encryption, and audit logging.

## Features

### 1. Secure API Key Storage (`secure_config.py`)

Stores API keys securely using the system's native keyring service:
- **macOS**: Keychain
- **Windows**: Credential Manager  
- **Linux**: Secret Service API

#### Usage

```python
from core.security import SecureConfig

# Save API key
SecureConfig.save_api_key("openai", "sk-...")
SecureConfig.save_api_key("claude", "sk-ant-...")

# Retrieve API key
api_key = SecureConfig.get_api_key("openai")

# Delete API key
SecureConfig.delete_api_key("openai")

# Save/retrieve configuration
config = {"model": "gpt-4", "temperature": 0.7}
SecureConfig.save_config("agent_config", config)
loaded_config = SecureConfig.get_config("agent_config")
```

### 2. Data Encryption (`encryption.py`)

Provides Fernet symmetric encryption (AES-128 in CBC mode) for sensitive data.

#### Usage

```python
from core.security import DataEncryption

# Basic encryption
encryption = DataEncryption()

# Encrypt string
encrypted = encryption.encrypt("sensitive data")
decrypted = encryption.decrypt(encrypted)

# Encrypt dictionary
config = {"api_key": "sk-123", "model": "gpt-4"}
encrypted = encryption.encrypt(config)
decrypted = encryption.decrypt_to_dict(encrypted)

# Password-based encryption
encryption = DataEncryption(password="my_secure_password")
encrypted = encryption.encrypt("data")

# File encryption
encryption.encrypt_file("input.txt", "output.enc")
encryption.decrypt_file("output.enc", "decrypted.txt")

# Encrypted config manager
from core.security.encryption import EncryptedConfigManager

manager = EncryptedConfigManager("~/.jarvis/configs", "password")
manager.save_config("agent_1", {"api_key": "sk-123"})
config = manager.load_config("agent_1")
```

### 3. Audit Logging (`audit.py`)

Comprehensive audit logging for security-sensitive operations.

#### Usage

```python
from core.security import AuditLogger
from core.security.audit import AuditSeverity

# Initialize audit logger
audit_logger = AuditLogger()

# Log tool call
await audit_logger.log_tool_call(
    tool_id="workflow_123",
    tool_name="data_export",
    agent_id="agent_456",
    user_id="user_789",
    params={"format": "csv"},
    result={"status": "success"},
    execution_time_ms=150
)

# Log sensitive operation
await audit_logger.log_sensitive_operation(
    operation="delete_user_data",
    user_id="user_123",
    agent_id="agent_456",
    details={"data_type": "profile"},
    success=True
)

# Log API key access
await audit_logger.log_api_key_access(
    provider="openai",
    user_id="user_123",
    operation="read",
    success=True
)

# Log configuration change
await audit_logger.log_config_change(
    config_name="agent_settings",
    user_id="user_123",
    agent_id="agent_456",
    changes={"temperature": 0.8},
    old_values={"temperature": 0.7}
)

# Log security violation
await audit_logger.log_security_violation(
    violation_type="unauthorized_access",
    user_id="user_123",
    agent_id="agent_456",
    details={"resource": "admin_panel"},
    severity=AuditSeverity.CRITICAL
)

# Query audit logs
from datetime import datetime, timedelta

events = audit_logger.query_logs(
    start_date=datetime.now() - timedelta(days=7),
    event_type=AuditEventType.TOOL_CALL,
    user_id="user_123",
    limit=100
)

# Get statistics
stats = audit_logger.get_statistics(
    start_date=datetime.now() - timedelta(days=30)
)
print(f"Total events: {stats['total_events']}")
print(f"Tool calls: {stats['tool_calls']}")
print(f"Security violations: {stats['security_violations']}")
```

## Integration with Agent System

### Secure LLM Configuration

```python
from core.security import SecureConfig, DataEncryption
from core.service.llm import LLMService

# Store API key securely
SecureConfig.save_api_key("openai", "sk-...")

# Retrieve when needed
api_key = SecureConfig.get_api_key("openai")

# Initialize LLM service
llm_service = LLMService(
    provider="openai",
    model="gpt-4",
    api_key=api_key
)
```

### Audit Tool Calls

```python
from core.security import get_audit_logger

audit_logger = get_audit_logger()

# Before tool execution
await audit_logger.log_tool_call(
    tool_id=tool.id,
    tool_name=tool.name,
    agent_id=agent.id,
    user_id=user.id,
    params=tool_params
)

# Execute tool
result = await tool_service.execute(tool.id, tool_params)

# Log result
await audit_logger.log_tool_call(
    tool_id=tool.id,
    tool_name=tool.name,
    agent_id=agent.id,
    user_id=user.id,
    params=tool_params,
    result=result,
    execution_time_ms=execution_time
)
```

### Encrypt Sensitive Agent Configuration

```python
from core.security.encryption import EncryptedConfigManager

# Initialize with user password
config_manager = EncryptedConfigManager(
    config_dir="~/.jarvis/agent_configs",
    password=user_password
)

# Save encrypted agent config
agent_config = {
    "name": "My Agent",
    "api_keys": {
        "openai": "sk-...",
        "claude": "sk-ant-..."
    },
    "system_prompt": "You are a helpful assistant"
}

config_manager.save_config(f"agent_{agent_id}", agent_config)

# Load encrypted config
loaded_config = config_manager.load_config(f"agent_{agent_id}")
```

## Security Best Practices

1. **API Keys**: Always use `SecureConfig` to store API keys, never hardcode them
2. **Sensitive Data**: Encrypt sensitive configuration data using `DataEncryption`
3. **Audit Logging**: Log all security-sensitive operations for compliance and monitoring
4. **Password Management**: Use strong passwords for encryption, consider key derivation
5. **Access Control**: Implement proper permission checks before tool execution
6. **Regular Audits**: Review audit logs regularly for suspicious activity

## File Locations

- **Audit Logs**: `~/.jarvis/audit/audit_YYYY-MM-DD.jsonl`
- **Encrypted Configs**: User-defined directory
- **API Keys**: System keyring (platform-specific)

## Dependencies

- `keyring`: System keyring integration
- `cryptography`: Encryption/decryption
- `loguru`: Logging

All dependencies are already included in `requirements.txt`.
