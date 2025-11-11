"""
Data encryption module for sensitive information.

This module provides encryption and decryption capabilities for sensitive
data using Fernet symmetric encryption (AES-128 in CBC mode).
"""

from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
import base64
import os
from typing import Optional, Union
from pathlib import Path
import json
from loguru import logger


class DataEncryption:
    """
    Data encryption service using Fernet symmetric encryption.
    
    Provides methods to encrypt and decrypt sensitive data such as
    configuration files, user data, and other sensitive information.
    """
    
    def __init__(self, key: Optional[bytes] = None, password: Optional[str] = None):
        """
        Initialize encryption service.
        
        Args:
            key: Encryption key (32 url-safe base64-encoded bytes).
                 If not provided, will be generated or derived from password.
            password: Password to derive encryption key from.
                     Used if key is not provided.
        """
        if key:
            self.key = key
        elif password:
            self.key = self._derive_key_from_password(password)
        else:
            self.key = Fernet.generate_key()
        
        try:
            self.cipher = Fernet(self.key)
            logger.debug("Encryption service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize encryption service: {e}")
            raise
    
    @staticmethod
    def _derive_key_from_password(password: str, salt: Optional[bytes] = None) -> bytes:
        """
        Derive encryption key from password using PBKDF2.
        
        Args:
            password: Password to derive key from
            salt: Salt for key derivation (generated if not provided)
            
        Returns:
            bytes: Derived encryption key
        """
        if salt is None:
            salt = b'jarvis-agent-salt-v1'  # Fixed salt for consistency
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
            backend=default_backend()
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        return key
    
    def encrypt(self, data: Union[str, bytes, dict]) -> str:
        """
        Encrypt data.
        
        Args:
            data: Data to encrypt (string, bytes, or dict)
            
        Returns:
            str: Base64-encoded encrypted data
            
        Example:
            >>> enc = DataEncryption()
            >>> encrypted = enc.encrypt("sensitive data")
            >>> print(encrypted)
            gAAAAABl...
        """
        try:
            # Convert data to bytes
            if isinstance(data, dict):
                data_bytes = json.dumps(data).encode()
            elif isinstance(data, str):
                data_bytes = data.encode()
            elif isinstance(data, bytes):
                data_bytes = data
            else:
                raise ValueError(f"Unsupported data type: {type(data)}")
            
            # Encrypt
            encrypted_data = self.cipher.encrypt(data_bytes)
            result = encrypted_data.decode()
            
            logger.debug(f"Successfully encrypted data of length {len(data_bytes)}")
            return result
            
        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            raise
    
    def decrypt(self, encrypted_data: str) -> str:
        """
        Decrypt data to string.
        
        Args:
            encrypted_data: Base64-encoded encrypted data
            
        Returns:
            str: Decrypted data as string
            
        Raises:
            InvalidToken: If decryption fails (wrong key or corrupted data)
            
        Example:
            >>> enc = DataEncryption()
            >>> decrypted = enc.decrypt("gAAAAABl...")
            >>> print(decrypted)
            sensitive data
        """
        try:
            encrypted_bytes = encrypted_data.encode()
            decrypted_bytes = self.cipher.decrypt(encrypted_bytes)
            result = decrypted_bytes.decode()
            
            logger.debug(f"Successfully decrypted data of length {len(result)}")
            return result
            
        except InvalidToken:
            logger.error("Decryption failed: Invalid token or wrong key")
            raise
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            raise
    
    def decrypt_to_dict(self, encrypted_data: str) -> dict:
        """
        Decrypt data to dictionary.
        
        Args:
            encrypted_data: Base64-encoded encrypted data
            
        Returns:
            dict: Decrypted data as dictionary
        """
        try:
            decrypted_str = self.decrypt(encrypted_data)
            result = json.loads(decrypted_str)
            return result
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse decrypted data as JSON: {e}")
            raise
    
    def encrypt_file(self, input_path: Union[str, Path], output_path: Union[str, Path]) -> bool:
        """
        Encrypt a file.
        
        Args:
            input_path: Path to file to encrypt
            output_path: Path to save encrypted file
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            input_path = Path(input_path)
            output_path = Path(output_path)
            
            # Read file
            with open(input_path, 'rb') as f:
                data = f.read()
            
            # Encrypt
            encrypted_data = self.cipher.encrypt(data)
            
            # Write encrypted file
            with open(output_path, 'wb') as f:
                f.write(encrypted_data)
            
            logger.info(f"Successfully encrypted file: {input_path} -> {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to encrypt file {input_path}: {e}")
            return False
    
    def decrypt_file(self, input_path: Union[str, Path], output_path: Union[str, Path]) -> bool:
        """
        Decrypt a file.
        
        Args:
            input_path: Path to encrypted file
            output_path: Path to save decrypted file
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            input_path = Path(input_path)
            output_path = Path(output_path)
            
            # Read encrypted file
            with open(input_path, 'rb') as f:
                encrypted_data = f.read()
            
            # Decrypt
            decrypted_data = self.cipher.decrypt(encrypted_data)
            
            # Write decrypted file
            with open(output_path, 'wb') as f:
                f.write(decrypted_data)
            
            logger.info(f"Successfully decrypted file: {input_path} -> {output_path}")
            return True
            
        except InvalidToken:
            logger.error(f"Failed to decrypt file {input_path}: Invalid token or wrong key")
            return False
        except Exception as e:
            logger.error(f"Failed to decrypt file {input_path}: {e}")
            return False
    
    def get_key(self) -> str:
        """
        Get the encryption key as base64 string.
        
        Returns:
            str: Base64-encoded encryption key
            
        Warning:
            Store this key securely! Anyone with this key can decrypt your data.
        """
        return self.key.decode()
    
    @staticmethod
    def generate_key() -> str:
        """
        Generate a new random encryption key.
        
        Returns:
            str: Base64-encoded encryption key
        """
        key = Fernet.generate_key()
        return key.decode()


class EncryptedConfigManager:
    """
    Manager for encrypted configuration files.
    
    Provides high-level interface for storing and retrieving
    encrypted configuration data.
    """
    
    def __init__(self, config_dir: Union[str, Path], password: str):
        """
        Initialize encrypted config manager.
        
        Args:
            config_dir: Directory to store encrypted configs
            password: Password for encryption/decryption
        """
        self.config_dir = Path(config_dir)
        self.config_dir.mkdir(parents=True, exist_ok=True)
        self.encryption = DataEncryption(password=password)
    
    def save_config(self, config_name: str, config_data: dict) -> bool:
        """
        Save encrypted configuration.
        
        Args:
            config_name: Name of the configuration
            config_data: Configuration data as dictionary
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            config_path = self.config_dir / f"{config_name}.enc"
            encrypted_data = self.encryption.encrypt(config_data)
            
            with open(config_path, 'w') as f:
                f.write(encrypted_data)
            
            logger.info(f"Successfully saved encrypted config: {config_name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to save encrypted config {config_name}: {e}")
            return False
    
    def load_config(self, config_name: str) -> Optional[dict]:
        """
        Load encrypted configuration.
        
        Args:
            config_name: Name of the configuration
            
        Returns:
            Optional[dict]: Configuration data if found, None otherwise
        """
        try:
            config_path = self.config_dir / f"{config_name}.enc"
            
            if not config_path.exists():
                logger.warning(f"Config file not found: {config_name}")
                return None
            
            with open(config_path, 'r') as f:
                encrypted_data = f.read()
            
            config_data = self.encryption.decrypt_to_dict(encrypted_data)
            logger.info(f"Successfully loaded encrypted config: {config_name}")
            return config_data
            
        except Exception as e:
            logger.error(f"Failed to load encrypted config {config_name}: {e}")
            return None
    
    def delete_config(self, config_name: str) -> bool:
        """
        Delete encrypted configuration.
        
        Args:
            config_name: Name of the configuration
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            config_path = self.config_dir / f"{config_name}.enc"
            
            if config_path.exists():
                config_path.unlink()
                logger.info(f"Successfully deleted encrypted config: {config_name}")
                return True
            else:
                logger.warning(f"Config file not found: {config_name}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to delete encrypted config {config_name}: {e}")
            return False
