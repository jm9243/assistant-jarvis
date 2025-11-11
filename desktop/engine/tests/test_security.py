"""
Tests for security modules.

This file contains basic tests for the security features including
secure config, encryption, and audit logging.
"""

import pytest
import asyncio
from pathlib import Path
import tempfile
import shutil
from datetime import datetime

from core.security import SecureConfig, DataEncryption, AuditLogger
from core.security.audit import AuditEventType, AuditSeverity, AuditEvent
from core.security.encryption import EncryptedConfigManager


class TestSecureConfig:
    """Tests for SecureConfig."""
    
    def test_save_and_get_api_key(self):
        """Test saving and retrieving API key."""
        # Save API key
        success = SecureConfig.save_api_key("test_provider", "test_key_12345")
        assert success is True
        
        # Retrieve API key
        api_key = SecureConfig.get_api_key("test_provider")
        assert api_key == "test_key_12345"
        
        # Clean up
        SecureConfig.delete_api_key("test_provider")
    
    def test_get_nonexistent_api_key(self):
        """Test retrieving non-existent API key."""
        api_key = SecureConfig.get_api_key("nonexistent_provider")
        assert api_key is None
    
    def test_delete_api_key(self):
        """Test deleting API key."""
        # Save and then delete
        SecureConfig.save_api_key("test_delete", "test_key")
        success = SecureConfig.delete_api_key("test_delete")
        assert success is True
        
        # Verify deleted
        api_key = SecureConfig.get_api_key("test_delete")
        assert api_key is None
    
    def test_save_and_get_config(self):
        """Test saving and retrieving config."""
        config_data = {
            "setting1": "value1",
            "setting2": 123,
            "setting3": True
        }
        
        # Save config
        success = SecureConfig.save_config("test_config", config_data)
        assert success is True
        
        # Retrieve config
        retrieved_config = SecureConfig.get_config("test_config")
        assert retrieved_config == config_data
        
        # Clean up
        SecureConfig.delete_api_key("test_config")


class TestDataEncryption:
    """Tests for DataEncryption."""
    
    def test_encrypt_decrypt_string(self):
        """Test encrypting and decrypting string."""
        encryption = DataEncryption()
        
        original = "sensitive data"
        encrypted = encryption.encrypt(original)
        decrypted = encryption.decrypt(encrypted)
        
        assert decrypted == original
        assert encrypted != original
    
    def test_encrypt_decrypt_dict(self):
        """Test encrypting and decrypting dictionary."""
        encryption = DataEncryption()
        
        original = {
            "api_key": "sk-12345",
            "model": "gpt-4",
            "temperature": 0.7
        }
        
        encrypted = encryption.encrypt(original)
        decrypted = encryption.decrypt_to_dict(encrypted)
        
        assert decrypted == original
    
    def test_encryption_with_password(self):
        """Test encryption with password-derived key."""
        password = "my_secure_password"
        
        encryption1 = DataEncryption(password=password)
        encryption2 = DataEncryption(password=password)
        
        original = "test data"
        encrypted = encryption1.encrypt(original)
        decrypted = encryption2.decrypt(encrypted)
        
        assert decrypted == original
    
    def test_encrypt_decrypt_file(self):
        """Test encrypting and decrypting file."""
        encryption = DataEncryption()
        
        with tempfile.TemporaryDirectory() as tmpdir:
            tmpdir = Path(tmpdir)
            
            # Create test file
            input_file = tmpdir / "test.txt"
            input_file.write_text("sensitive file content")
            
            # Encrypt file
            encrypted_file = tmpdir / "test.enc"
            success = encryption.encrypt_file(input_file, encrypted_file)
            assert success is True
            assert encrypted_file.exists()
            
            # Decrypt file
            decrypted_file = tmpdir / "test_decrypted.txt"
            success = encryption.decrypt_file(encrypted_file, decrypted_file)
            assert success is True
            assert decrypted_file.exists()
            
            # Verify content
            assert decrypted_file.read_text() == "sensitive file content"
    
    def test_generate_key(self):
        """Test key generation."""
        key = DataEncryption.generate_key()
        assert isinstance(key, str)
        assert len(key) > 0


class TestEncryptedConfigManager:
    """Tests for EncryptedConfigManager."""
    
    def test_save_and_load_config(self):
        """Test saving and loading encrypted config."""
        with tempfile.TemporaryDirectory() as tmpdir:
            manager = EncryptedConfigManager(tmpdir, "test_password")
            
            config_data = {
                "api_key": "sk-12345",
                "model": "gpt-4"
            }
            
            # Save config
            success = manager.save_config("test", config_data)
            assert success is True
            
            # Load config
            loaded_config = manager.load_config("test")
            assert loaded_config == config_data
    
    def test_delete_config(self):
        """Test deleting encrypted config."""
        with tempfile.TemporaryDirectory() as tmpdir:
            manager = EncryptedConfigManager(tmpdir, "test_password")
            
            # Save and delete
            manager.save_config("test", {"key": "value"})
            success = manager.delete_config("test")
            assert success is True
            
            # Verify deleted
            loaded_config = manager.load_config("test")
            assert loaded_config is None


class TestAuditLogger:
    """Tests for AuditLogger."""
    
    @pytest.mark.asyncio
    async def test_log_tool_call(self):
        """Test logging tool call."""
        with tempfile.TemporaryDirectory() as tmpdir:
            audit_logger = AuditLogger(log_dir=tmpdir)
            
            success = await audit_logger.log_tool_call(
                tool_id="tool_123",
                tool_name="test_tool",
                agent_id="agent_456",
                user_id="user_789",
                params={"param1": "value1"},
                result={"status": "success"},
                execution_time_ms=150
            )
            
            assert success is True
            
            # Verify log file exists
            log_files = list(Path(tmpdir).glob("audit_*.jsonl"))
            assert len(log_files) > 0
    
    @pytest.mark.asyncio
    async def test_log_sensitive_operation(self):
        """Test logging sensitive operation."""
        with tempfile.TemporaryDirectory() as tmpdir:
            audit_logger = AuditLogger(log_dir=tmpdir)
            
            success = await audit_logger.log_sensitive_operation(
                operation="delete_data",
                user_id="user_123",
                agent_id="agent_456",
                details={"data_type": "user_profile"},
                success=True
            )
            
            assert success is True
    
    @pytest.mark.asyncio
    async def test_log_api_key_access(self):
        """Test logging API key access."""
        with tempfile.TemporaryDirectory() as tmpdir:
            audit_logger = AuditLogger(log_dir=tmpdir)
            
            success = await audit_logger.log_api_key_access(
                provider="openai",
                user_id="user_123",
                operation="read",
                success=True
            )
            
            assert success is True
    
    @pytest.mark.asyncio
    async def test_log_security_violation(self):
        """Test logging security violation."""
        with tempfile.TemporaryDirectory() as tmpdir:
            audit_logger = AuditLogger(log_dir=tmpdir)
            
            success = await audit_logger.log_security_violation(
                violation_type="unauthorized_access",
                user_id="user_123",
                agent_id="agent_456",
                details={"resource": "sensitive_data"},
                severity=AuditSeverity.CRITICAL
            )
            
            assert success is True
    
    def test_query_logs(self):
        """Test querying audit logs."""
        with tempfile.TemporaryDirectory() as tmpdir:
            audit_logger = AuditLogger(log_dir=tmpdir)
            
            # Log some events
            asyncio.run(audit_logger.log_tool_call(
                tool_id="tool_1",
                tool_name="test_tool",
                agent_id="agent_1",
                user_id="user_1",
                params={}
            ))
            
            asyncio.run(audit_logger.log_sensitive_operation(
                operation="test_op",
                user_id="user_1",
                agent_id="agent_1",
                details={}
            ))
            
            # Query logs
            events = audit_logger.query_logs(limit=10)
            assert len(events) == 2
    
    def test_get_statistics(self):
        """Test getting audit log statistics."""
        with tempfile.TemporaryDirectory() as tmpdir:
            audit_logger = AuditLogger(log_dir=tmpdir)
            
            # Log some events
            asyncio.run(audit_logger.log_tool_call(
                tool_id="tool_1",
                tool_name="test_tool",
                agent_id="agent_1",
                user_id="user_1",
                params={}
            ))
            
            asyncio.run(audit_logger.log_security_violation(
                violation_type="test",
                user_id="user_1",
                agent_id="agent_1",
                details={}
            ))
            
            # Get statistics
            stats = audit_logger.get_statistics()
            assert stats["total_events"] == 2
            assert stats["tool_calls"] == 1
            assert stats["security_violations"] == 1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
