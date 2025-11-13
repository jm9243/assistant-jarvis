# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller配置文件 - Daemon模式
用于打包Python引擎为常驻进程可执行文件

该配置针对IPC通信模式优化：
1. 入口文件为daemon.py
2. 排除HTTP服务器相关库（FastAPI、uvicorn等）
3. 包含所有必需的业务逻辑模块
4. 优化打包大小
"""

block_cipher = None

a = Analysis(
    # 入口文件
    ['daemon.py'],
    
    # 搜索路径
    pathex=[],
    
    # 二进制文件（通常为空）
    binaries=[],
    
    # 数据文件 - 包含所有业务逻辑模块
    datas=[
        # 核心模块
        ('core', 'core'),
        # 数据模型
        ('models', 'models'),
        # 工具模块
        ('tools', 'tools'),
        # 配置和工具文件
        ('config.py', '.'),
        ('logger.py', '.'),
        ('database.py', '.'),
        ('function_registry.py', '.'),
    ],
    
    # 隐式导入 - PyInstaller无法自动检测的模块
    hiddenimports=[
        # 核心依赖
        'loguru',
        'pydantic',
        'pydantic.fields',
        'pydantic.main',
        'pydantic.types',
        
        # 数据库
        'sqlalchemy',
        'sqlalchemy.ext',
        'sqlalchemy.ext.declarative',
        'sqlalchemy.orm',
        'sqlalchemy.pool',
        'aiosqlite',
        
        # AI Agent系统
        'chromadb',
        'chromadb.api',
        'chromadb.api.models',
        'chromadb.api.models.Collection',
        'chromadb.api.types',
        'chromadb.config',
        'chromadb.db',
        'chromadb.db.base',
        'chromadb.db.impl',
        'chromadb.db.impl.sqlite',
        'chromadb.utils',
        'chromadb.utils.embedding_functions',
        'chromadb.telemetry',
        'chromadb.telemetry.opentelemetry',
        'onnxruntime',
        'onnxruntime.capi',
        'onnxruntime.capi.onnxruntime_pybind11_state',
        'tokenizers',
        'openai',
        'anthropic',
        
        # HTTP客户端（用于调用LLM API）
        'httpx',
        'httpx._client',
        'httpx._config',
        'httpx._models',
        
        # 文档处理
        'PyPDF2',
        'docx',
        'openpyxl',
        'markdown',
        
        # GUI自动化 - Windows
        'pywinauto',
        'pywinauto.application',
        'pywinauto.controls',
        
        # GUI自动化 - macOS
        'AppKit',
        'Quartz',
        'CoreGraphics',
        'objc',
        
        # 键鼠控制
        'pynput',
        'pynput.keyboard',
        'pynput.mouse',
        'pyautogui',
        
        # 图像处理
        'PIL',
        'PIL.Image',
        'cv2',
        
        # OCR
        'pytesseract',
        
        # 工具库
        'psutil',
        'cryptography',
        'keyring',
        'cachetools',
        'pyperclip',
    ],
    
    # Hook路径
    hookspath=[],
    
    # Hook配置
    hooksconfig={},
    
    # 运行时Hook
    runtime_hooks=[],
    
    # 排除的模块 - 减小打包大小
    excludes=[
        # HTTP服务器相关（daemon模式不需要）
        'fastapi',
        'uvicorn',
        'starlette',
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.protocols',
        'uvicorn.lifespan',
        
        # 大型科学计算库（如果不需要）
        'matplotlib',
        'pandas',
        'scipy',
        'sklearn',
        'tensorflow',
        'torch',
        
        # 测试框架
        'pytest',
        'unittest',
        'nose',
        
        # 开发工具
        'IPython',
        'jupyter',
        'notebook',
        
        # 其他不需要的库
        'tkinter',
        'wx',
        'PyQt5',
        'PySide2',
    ],
    
    # Windows特定选项
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    
    # 加密
    cipher=block_cipher,
    
    # 不使用归档
    noarchive=False,
)

# 创建PYZ归档
pyz = PYZ(
    a.pure,
    a.zipped_data,
    cipher=block_cipher
)

# 创建可执行文件
exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    
    # 可执行文件名称
    name='jarvis-engine-daemon',
    
    # 调试选项
    debug=False,
    
    # 不忽略引导加载器信号
    bootloader_ignore_signals=False,
    
    # 不strip符号
    strip=False,
    
    # 使用UPX压缩
    upx=True,
    upx_exclude=[],
    
    # 运行时临时目录
    runtime_tmpdir=None,
    
    # 控制台模式（必须为True，用于stdin/stdout通信）
    console=True,
    
    # 禁用窗口化回溯
    disable_windowed_traceback=False,
    
    # 参数模拟
    argv_emulation=False,
    
    # 目标架构
    target_arch=None,
    
    # macOS代码签名
    codesign_identity=None,
    
    # macOS权限文件
    entitlements_file=None,
)
