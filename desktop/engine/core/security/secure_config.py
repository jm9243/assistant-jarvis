"""
Secure configuration management using system keyring.

This module provides secure storage for API keys and other sensitive
configuration data using the system's native keyring service.
"""

import keyring
from typing import Optional, Dict, Any
import json
from loguru import logger


class SecureConfig:
    """
    Secure configuration manager using system keyring.
    
    Stores sensitive data like API keys in the system's native keyring
    (Keychain on macOS, Credential Manager on Windows, Secret Service on Linux).
    """
    
    SERVICE_NAME = "jarvis-agent"
    
    @staticmethod
    def save_api_key(provider: str, api_key: str) -> bool:
        """
        Save API key to system keyring.
        
        Args:
            provider: Provider name (e.g., "openai", "claude", "embedding")
            api_key: The API key to store
            
        Returns:
            bool: True if successful, False otherwise
            
        Example:
            >>> SecureConfig.save_api_key("openai", "sk-...")
            True
        """
        try:
            username = f"{provider}_api_key"
            keyring.set_password(SecureConfig.SERVICE_NAME, username, api_key)
            logger.info(f"Successfully saved API key for provider: {provider}")
            return True
        except Exception as e:
            logger.error(f"Failed to save API key for {provider}: {e}")
            return False
    
    @staticmethod
    def get_api_key(provider: str) -> Optional[str]:
        """
        Retrieve API key from system keyring.
        
        Args:
            provider: Provider name (e.g., "openai", "claude", "embedding")
            
        Returns:
            Optional[str]: The API key if found, None otherwise
            
        Example:
            >>> key = SecureConfig.get_api_key("openai")
            >>> print(key)
            sk-...
        """
        try:
            username = f"{provider}_api_key"
            api_key = keyring.get_password(SecureConfig.SERVICE_NAME, username)
            if api_key:
                logger.debug(f"Successfully retrieved API key for provider: {provider}")
            else:
                logger.warning(f"No API key found for provider: {provider}")
            return api_key
        except Exception as e:
            logger.error(f"Failed to retrieve API key for {provider}: {e}")
            return None
    
    @staticmethod
    def delete_api_key(provider: str) -> bool:
        """
        Delete API key from system keyring.
        
        Args:
            provider: Provider name (e.g., "openai", "claude", "embedding")
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            username = f"{provider}_api_key"
            keyring.delete_password(SecureConfig.SERVICE_NAME, username)
            logger.info(f"Successfully deleted API key for provider: {provider}")
            return True
        except keyring.errors.PasswordDeleteError:
            logger.warning(f"No API key found to delete for provider: {provider}")
            return False
        except Exception as e:
            logger.error(f"Failed to delete API key for {provider}: {e}")
            return False
    
    @staticmethod
    def save_config(config_name: str, config_data: Dict[str, Any]) -> bool:
        """
        Save configuration data to system keyring.
        
        Args:
            config_name: Name of the configuration
            config_data: Configuration data as dictionary
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            config_json = json.dumps(config_data)
            keyring.set_password(SecureConfig.SERVICE_NAME, config_name, config_json)
            logger.info(f"Successfully saved config: {config_name}")
            return True
        except Exception as e:
            logger.error(f"Failed to save config {config_name}: {e}")
            return False
    
    @staticmethod
    def get_config(config_name: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve configuration data from system keyring.
        
        Args:
            config_name: Name of the configuration
            
        Returns:
            Optional[Dict[str, Any]]: Configuration data if found, None otherwise
        """
        try:
            config_json = keyring.get_password(SecureConfig.SERVICE_NAME, config_name)
            if config_json:
                config_data = json.loads(config_json)
                logger.debug(f"Successfully retrieved config: {config_name}")
                return config_data
            else:
                logger.warning(f"No config found: {config_name}")
                return None
        except Exception as e:
            logger.error(f"Failed to retrieve config {config_name}: {e}")
            return None
    
    @staticmethod
    def list_stored_providers() -> list[str]:
        """
        List all providers that have stored API keys.
        
        Note: This is a best-effort implementation as keyring doesn't
        provide a standard way to list all stored credentials.
        
        Returns:
            list[str]: List of provider names
        """
        # Common providers to check
        common_providers = ["openai", "claude", "anthropic", "embedding"]
        stored_providers = []
        
        for provider in common_providers:
            if SecureConfig.get_api_key(provider):
                stored_providers.append(provider)
        
        return stored_providers
