#!/usr/bin/env python3
"""
构建 Python 引擎为独立可执行文件
使用 PyInstaller 打包
"""
import os
import sys
import subprocess
from pathlib import Path

def build_engine():
    """构建引擎"""
    print("=" * 50)
    print("构建 Jarvis Python 引擎")
    print("=" * 50)
    
    # 检查 PyInstaller
    try:
        import PyInstaller
        print(f"✓ PyInstaller 已安装: {PyInstaller.__version__}")
    except ImportError:
        print("✗ PyInstaller 未安装")
        print("安装: pip install pyinstaller")
        sys.exit(1)
    
    # 项目路径
    engine_dir = Path(__file__).parent
    main_file = engine_dir / "main.py"
    dist_dir = engine_dir / "dist"
    build_dir = engine_dir / "build"
    
    # PyInstaller 命令
    cmd = [
        "pyinstaller",
        "--name=jarvis-engine",
        "--onefile",
        "--clean",
        f"--distpath={dist_dir}",
        f"--workpath={build_dir}",
        "--noconfirm",
        str(main_file)
    ]
    
    print(f"\n执行命令: {' '.join(cmd)}\n")
    
    # 执行构建
    try:
        subprocess.run(cmd, check=True, cwd=engine_dir)
        print("\n" + "=" * 50)
        print("✓ 构建成功！")
        print(f"可执行文件: {dist_dir / 'jarvis-engine'}")
        print("=" * 50)
    except subprocess.CalledProcessError as e:
        print(f"\n✗ 构建失败: {e}")
        sys.exit(1)

if __name__ == "__main__":
    build_engine()
