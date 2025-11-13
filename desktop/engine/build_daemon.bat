@echo off
REM ###############################################################################
REM Jarvis Engine Daemon 打包脚本 (Windows)
REM
REM 功能：
REM 1. 激活虚拟环境
REM 2. 安装/更新PyInstaller
REM 3. 清理旧的构建文件
REM 4. 使用PyInstaller打包daemon
REM 5. 验证打包结果
REM 6. 测试可执行文件
REM
REM 使用方法：
REM   build_daemon.bat
REM
REM 环境要求：
REM   - Python 3.9+
REM   - 虚拟环境已创建（venv目录）
REM ###############################################################################

setlocal enabledelayedexpansion

REM 获取脚本所在目录
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

echo ========================================
echo 开始构建 Jarvis Engine Daemon
echo ========================================
echo 工作目录: %SCRIPT_DIR%
echo.

REM 1. 检查虚拟环境
echo [步骤 1/7] 检查虚拟环境...
if not exist "venv" (
    echo [错误] 虚拟环境不存在！请先创建虚拟环境：
    echo   python -m venv venv
    echo   venv\Scripts\activate
    echo   pip install -r requirements.txt
    exit /b 1
)

REM 2. 激活虚拟环境
echo [步骤 2/7] 激活虚拟环境...
call venv\Scripts\activate.bat

REM 验证Python版本
python --version
echo.

REM 3. 安装/更新PyInstaller
echo [步骤 3/7] 安装/更新 PyInstaller...
pip install --upgrade pyinstaller
echo.

REM 4. 清理旧的构建文件
echo [步骤 4/7] 清理旧的构建文件...

if exist "build" (
    echo 删除 build 目录...
    rmdir /s /q build
)

if exist "dist" (
    echo 删除 dist 目录...
    rmdir /s /q dist
)

if exist "jarvis-engine-daemon.exe" (
    echo 删除旧的可执行文件...
    del /f jarvis-engine-daemon.exe
)

echo 清理完成
echo.

REM 5. 执行打包
echo [步骤 5/7] 开始打包...
echo 使用配置文件: jarvis-engine-daemon.spec
echo.

pyinstaller jarvis-engine-daemon.spec

if errorlevel 1 (
    echo [错误] 打包失败！
    exit /b 1
)

echo.

REM 6. 验证打包结果
echo [步骤 6/7] 验证打包结果...

set EXECUTABLE_PATH=dist\jarvis-engine-daemon.exe

if not exist "%EXECUTABLE_PATH%" (
    echo [错误] 打包失败！可执行文件不存在: %EXECUTABLE_PATH%
    exit /b 1
)

echo [成功] 可执行文件已生成: %EXECUTABLE_PATH%

REM 检查文件大小
for %%A in ("%EXECUTABLE_PATH%") do set FILE_SIZE=%%~zA
set /a FILE_SIZE_MB=!FILE_SIZE! / 1048576
echo 文件大小: !FILE_SIZE_MB! MB

if !FILE_SIZE_MB! GTR 50 (
    echo [警告] 文件大小超过50MB (!FILE_SIZE_MB!MB^)
    echo [警告] 建议检查是否包含了不必要的依赖
) else (
    echo [成功] 文件大小符合要求 (^< 50MB^)
)

echo.

REM 7. 测试可执行文件
echo [步骤 7/7] 测试可执行文件...
echo 测试启动（5秒超时）...

REM 创建测试请求文件
echo {"id":"test-001","function":"list_functions","args":{}} > test_request.txt

REM 测试启动（使用timeout命令，5秒后自动终止）
timeout /t 1 /nobreak > nul
echo 启动测试...
type test_request.txt | "%EXECUTABLE_PATH%" > test_output.txt 2>&1 & timeout /t 5 /nobreak > nul & taskkill /f /im jarvis-engine-daemon.exe > nul 2>&1

if exist test_output.txt (
    echo 测试输出：
    type test_output.txt
    del test_output.txt
)

if exist test_request.txt (
    del test_request.txt
)

echo [成功] 可执行文件测试完成
echo.

REM 8. 构建摘要
echo =========================================
echo [成功] 构建完成！
echo =========================================
echo 可执行文件位置: %EXECUTABLE_PATH%
echo 文件大小: !FILE_SIZE_MB! MB
echo.
echo 下一步：
echo 1. 测试可执行文件：
echo    echo {"id":"test","function":"list_functions","args":{}} ^| %EXECUTABLE_PATH%
echo.
echo 2. 将可执行文件复制到Tauri资源目录：
echo    copy %EXECUTABLE_PATH% ..\frontend\src-tauri\resources\engine\
echo.
echo 3. 构建Tauri应用
echo =========================================

endlocal
