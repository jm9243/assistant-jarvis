# 最终解决方案

## 问题根源

daemon.py在启动时卡住的根本原因：

1. **在模块导入时就初始化服务** - 多个IPC函数文件在导入时就创建了服务实例
2. **服务初始化链式反应** - 一个服务初始化会触发其他服务初始化
3. **某些初始化可能等待外部资源** - 比如连接数据库、初始化Chroma等

## 解决方案

使用**真正的延迟加载** - 不在导入时初始化任何服务，只在第一次调用函数时才初始化。

### 方案1：使用daemon_simple.py（推荐）

daemon_simple.py已经验证可以工作。我们应该：
1. 使用daemon_simple.py作为基础
2. 添加动态函数注册机制
3. 函数在第一次被调用时才导入和初始化

### 方案2：修复现有daemon.py

需要修改所有IPC函数文件，将模块级别的初始化改为函数级别的延迟初始化。

## 立即可用的方案

使用daemon_simple.py + 动态加载：

```python
# 函数映射表 - 只记录函数名和导入路径
FUNCTION_MAP = {
    'agent_chat': ('core.agent.ipc_functions', 'agent_chat'),
    'kb_search': ('core.service.kb_ipc_functions', 'kb_search'),
    # ...
}

# 动态导入和调用
def call_function(name, **kwargs):
    if name not in FUNCTION_MAP:
        raise ValueError(f"Unknown function: {name}")
    
    module_path, func_name = FUNCTION_MAP[name]
    module = __import__(module_path, fromlist=[func_name])
    func = getattr(module, func_name)
    return func(**kwargs)
```

这样daemon启动时不需要导入任何业务逻辑，只在实际调用时才导入。

## 下一步

1. 创建daemon_final.py，基于daemon_simple.py
2. 添加动态函数加载机制
3. 测试所有功能
4. 替换daemon.py
