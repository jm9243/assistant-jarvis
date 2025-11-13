@echo off
REM 清理旧架构文件脚本 (Windows)
REM 移除FastAPI相关文件和其他不再需要的旧文件

setlocal enabledelayedexpansion

echo =========================================
echo 清理旧架构文件
echo =========================================

REM 进入desktop目录
cd /d "%~dp0"

echo.
echo 1. 清理旧的FastAPI服务器文件...
if exist "engine\api" (
    echo   - 移除 engine\api\ 目录
    rmdir /s /q "engine\api"
)

echo.
echo 2. 清理旧的main.py (FastAPI入口)...
if exist "engine\main.py" (
    echo   - 备份 engine\main.py 到 engine\main.py.old
    move /y "engine\main.py" "engine\main.py.old" >nul
)

echo.
echo 3. 清理旧的build.py...
if exist "engine\build.py" (
    echo   - 移除 engine\build.py (已被build_daemon.bat替代)
    del /f /q "engine\build.py"
)

echo.
echo 4. 清理旧的spec文件...
if exist "engine\jarvis-engine.spec" (
    echo   - 移除 engine\jarvis-engine.spec (已被jarvis-engine-daemon.spec替代)
    del /f /q "engine\jarvis-engine.spec"
)

echo.
echo 5. 清理Python缓存...
echo   - 移除 __pycache__ 目录
for /d /r "engine" %%d in (__pycache__) do @if exist "%%d" rmdir /s /q "%%d" 2>nul
del /s /q "engine\*.pyc" 2>nul

echo.
echo 6. 清理旧的构建产物...
if exist "engine\build" (
    echo   - 清理 engine\build\ 目录
    rmdir /s /q "engine\build" 2>nul
    mkdir "engine\build"
)

echo.
echo 7. 清理旧的日志文件...
if exist "logs" (
    echo   - 清理 logs\ 目录
    rmdir /s /q "logs"
)

echo.
echo 8. 清理前端旧的构建产物...
if exist "frontend\dist" (
    echo   - 清理 frontend\dist\ 目录
    rmdir /s /q "frontend\dist"
)

if exist "frontend\src-tauri\target" (
    echo   - 发现 frontend\src-tauri\target\ 目录 (较大)
    set /p REPLY="    是否清理Rust构建缓存? (y/N) "
    if /i "!REPLY!"=="y" (
        rmdir /s /q "frontend\src-tauri\target"
    )
)

echo.
echo =========================================
echo 清理完成！
echo =========================================
echo.
echo 已清理的内容：
echo   √ FastAPI服务器文件 (engine\api\)
echo   √ 旧的main.py (备份为main.py.old)
echo   √ 旧的build.py
echo   √ 旧的spec文件
echo   √ Python缓存文件
echo   √ 构建产物
echo   √ 日志文件
echo.
echo 保留的文件：
echo   - daemon.py (新架构入口)
echo   - function_registry.py
echo   - build_daemon.sh/bat
echo   - jarvis-engine-daemon.spec
echo.
echo 下一步：
echo   1. 运行 'npm start' 测试应用启动
echo   2. 运行 'npm run build' 测试完整构建
echo   3. 运行 'npm test' 测试所有测试用例
echo.

endlocal
