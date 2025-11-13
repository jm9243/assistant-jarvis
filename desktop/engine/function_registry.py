"""
函数注册表
管理所有可通过IPC调用的函数
"""
from typing import Dict, Callable, Any, Optional
from inspect import signature, Parameter
from logger import get_logger

logger = get_logger("function_registry")


class FunctionRegistry:
    """函数注册表 - 管理所有可通过IPC调用的函数"""
    
    def __init__(self):
        """初始化函数注册表"""
        self.functions: Dict[str, Callable] = {}
        self.function_metadata: Dict[str, Dict[str, Any]] = {}
        logger.info("FunctionRegistry initialized")
    
    def register(
        self,
        name: str,
        func: Callable,
        description: str = "",
        validate_args: bool = True
    ):
        """
        注册函数
        
        Args:
            name: 函数名称
            func: 函数对象
            description: 函数描述
            validate_args: 是否验证参数
        """
        if name in self.functions:
            logger.warning(f"Function '{name}' already registered, overwriting")
        
        self.functions[name] = func
        
        # 提取函数签名信息
        sig = signature(func)
        params_info = {}
        
        for param_name, param in sig.parameters.items():
            params_info[param_name] = {
                "type": param.annotation if param.annotation != Parameter.empty else Any,
                "default": param.default if param.default != Parameter.empty else None,
                "required": param.default == Parameter.empty
            }
        
        self.function_metadata[name] = {
            "description": description,
            "params": params_info,
            "validate_args": validate_args,
            "return_type": sig.return_annotation if sig.return_annotation != Parameter.empty else Any
        }
        
        logger.debug(f"Registered function: {name}")
    
    def call(self, function_name: str, **kwargs) -> Any:
        """
        调用函数
        
        Args:
            function_name: 函数名称
            **kwargs: 函数参数
            
        Returns:
            函数执行结果
            
        Raises:
            ValueError: 函数不存在或参数验证失败
        """
        if function_name not in self.functions:
            raise ValueError(f"Function not found: {function_name}")
        
        func = self.functions[function_name]
        metadata = self.function_metadata[function_name]
        
        # 参数验证
        if metadata["validate_args"]:
            self._validate_args(function_name, kwargs, metadata["params"])
        
        try:
            logger.debug(f"Calling function: {function_name} with args: {kwargs}")
            result = func(**kwargs)
            logger.debug(f"Function {function_name} completed successfully")
            return result
        except Exception as e:
            logger.error(f"Error calling function {function_name}: {e}", exc_info=True)
            raise
    
    def _validate_args(
        self,
        func_name: str,
        args: Dict[str, Any],
        params_info: Dict[str, Dict[str, Any]]
    ):
        """
        验证函数参数
        
        Args:
            func_name: 函数名称
            args: 传入的参数
            params_info: 参数信息
            
        Raises:
            ValueError: 参数验证失败
        """
        # 检查必需参数
        for param_name, param_info in params_info.items():
            if param_info["required"] and param_name not in args:
                raise ValueError(
                    f"Missing required parameter '{param_name}' for function '{func_name}'"
                )
        
        # 检查未知参数
        for arg_name in args:
            if arg_name not in params_info:
                logger.warning(
                    f"Unknown parameter '{arg_name}' for function '{func_name}', ignoring"
                )
    
    def list_functions(self) -> Dict[str, Dict[str, Any]]:
        """
        列出所有已注册的函数
        
        Returns:
            函数名称到元数据的映射
        """
        return {
            name: {
                "description": metadata["description"],
                "params": metadata["params"],
                "return_type": str(metadata["return_type"])
            }
            for name, metadata in self.function_metadata.items()
        }
    
    def get_function_info(self, function_name: str) -> Optional[Dict[str, Any]]:
        """
        获取函数信息
        
        Args:
            function_name: 函数名称
            
        Returns:
            函数元数据，如果函数不存在则返回None
        """
        if function_name not in self.function_metadata:
            return None
        
        metadata = self.function_metadata[function_name]
        return {
            "name": function_name,
            "description": metadata["description"],
            "params": metadata["params"],
            "return_type": str(metadata["return_type"])
        }
    
    def unregister(self, function_name: str) -> bool:
        """
        注销函数
        
        Args:
            function_name: 函数名称
            
        Returns:
            是否成功注销
        """
        if function_name not in self.functions:
            logger.warning(f"Function '{function_name}' not found, cannot unregister")
            return False
        
        del self.functions[function_name]
        del self.function_metadata[function_name]
        logger.debug(f"Unregistered function: {function_name}")
        return True
    
    def clear(self):
        """清空所有已注册的函数"""
        self.functions.clear()
        self.function_metadata.clear()
        logger.info("Cleared all registered functions")
