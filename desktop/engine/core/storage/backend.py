"""
Backend API客户端
"""
import httpx
from typing import Dict, Optional, Any
from config import settings
from logger import get_logger

logger = get_logger("backend")


class BackendClient:
    """Backend API客户端"""
    
    def __init__(self, base_url: str = None, timeout: int = None):
        """
        初始化客户端
        
        Args:
            base_url: Backend URL
            timeout: 超时时间（秒）
        """
        self.base_url = base_url or settings.backend_url
        self.timeout = timeout or settings.backend_timeout
        self.token: Optional[str] = None
        
        # 创建客户端，禁用环境代理以避免SOCKS依赖问题
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=self.timeout,
            trust_env=False  # 不使用系统代理设置
        )
        
        logger.info(f"Initialized Backend client: {self.base_url}")
    
    def set_token(self, token: str):
        """
        设置JWT token
        
        Args:
            token: JWT token
        """
        self.token = token
        logger.debug("JWT token set")
    
    def _get_headers(self) -> Dict:
        """获取请求头"""
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers
    
    async def get(self, path: str, params: Dict = None) -> Dict:
        """
        GET请求
        
        Args:
            path: API路径
            params: 查询参数
            
        Returns:
            响应数据
        """
        try:
            response = await self.client.get(
                path,
                params=params,
                headers=self._get_headers()
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"GET {path} failed: {e}")
            raise
    
    async def post(self, path: str, data: Dict) -> Dict:
        """
        POST请求
        
        Args:
            path: API路径
            data: 请求数据
            
        Returns:
            响应数据
        """
        try:
            response = await self.client.post(
                path,
                json=data,
                headers=self._get_headers()
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"POST {path} failed: {e}")
            raise
    
    async def put(self, path: str, data: Dict) -> Dict:
        """
        PUT请求
        
        Args:
            path: API路径
            data: 请求数据
            
        Returns:
            响应数据
        """
        try:
            response = await self.client.put(
                path,
                json=data,
                headers=self._get_headers()
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"PUT {path} failed: {e}")
            raise
    
    async def patch(self, path: str, data: Dict) -> Dict:
        """
        PATCH请求
        
        Args:
            path: API路径
            data: 请求数据
            
        Returns:
            响应数据
        """
        try:
            response = await self.client.patch(
                path,
                json=data,
                headers=self._get_headers()
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"PATCH {path} failed: {e}")
            raise
    
    async def delete(self, path: str) -> Dict:
        """
        DELETE请求
        
        Args:
            path: API路径
            
        Returns:
            响应数据
        """
        try:
            response = await self.client.delete(
                path,
                headers=self._get_headers()
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"DELETE {path} failed: {e}")
            raise
    
    async def close(self):
        """关闭客户端"""
        await self.client.aclose()
        logger.info("Backend client closed")
