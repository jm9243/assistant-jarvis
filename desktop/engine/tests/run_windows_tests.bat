@echo off
REM Windows测试执行脚本

echo =========================================
echo Windows Platform Testing
echo =========================================
echo.

REM 获取项目根目录
set PROJECT_ROOT=%~dp0..
cd /d %PROJECT_ROOT%

echo Project root: %PROJECT_ROOT%
echo Python: 
where python
echo Python version:
python --version
echo.

REM 测试计数器
set TOTAL_TESTS=0
set PASSED_TESTS=0
set FAILED_TESTS=0

REM 1. 简化测试（基础功能）
echo Running: Basic Functionality Tests
echo ----------------------------------------
python -m pytest tests\test_windows_platform.py::TestWindowsPlatform::test_platform_is_windows -v
if %ERRORLEVEL% EQU 0 (
    echo [32m✓ Platform Test PASSED[0m
    set /a PASSED_TESTS+=1
) else (
    echo [31m✗ Platform Test FAILED[0m
    set /a FAILED_TESTS+=1
)
set /a TOTAL_TESTS+=1
echo.

REM 2. 可执行文件测试
echo Running: Executable Tests
echo ----------------------------------------
python -m pytest tests\test_windows_platform.py::TestWindowsPlatform::test_engine_executable_exists -v
if %ERRORLEVEL% EQU 0 (
    echo [32m✓ Executable Test PASSED[0m
    set /a PASSED_TESTS+=1
) else (
    echo [31m✗ Executable Test FAILED[0m
    set /a FAILED_TESTS+=1
)
set /a TOTAL_TESTS+=1
echo.

REM 3. 文件大小测试
echo Running: File Size Test
echo ----------------------------------------
python -m pytest tests\test_windows_platform.py::TestWindowsPlatform::test_engine_file_size -v
if %ERRORLEVEL% EQU 0 (
    echo [32m✓ File Size Test PASSED[0m
    set /a PASSED_TESTS+=1
) else (
    echo [31m✗ File Size Test FAILED[0m
    set /a FAILED_TESTS+=1
)
set /a TOTAL_TESTS+=1
echo.

REM 4. GUI库测试
echo Running: GUI Libraries Test
echo ----------------------------------------
python -m pytest tests\test_windows_platform.py::TestWindowsPlatform::test_gui_automation_available -v
if %ERRORLEVEL% EQU 0 (
    echo [32m✓ GUI Libraries Test PASSED[0m
    set /a PASSED_TESTS+=1
) else (
    echo [31m✗ GUI Libraries Test FAILED[0m
    set /a FAILED_TESTS+=1
)
set /a TOTAL_TESTS+=1
echo.

REM 5. 依赖测试
echo Running: Dependencies Test
echo ----------------------------------------
python -m pytest tests\test_windows_platform.py::TestWindowsPlatform::test_all_dependencies_available -v
if %ERRORLEVEL% EQU 0 (
    echo [32m✓ Dependencies Test PASSED[0m
    set /a PASSED_TESTS+=1
) else (
    echo [31m✗ Dependencies Test FAILED[0m
    set /a FAILED_TESTS+=1
)
set /a TOTAL_TESTS+=1
echo.

REM 总结
echo =========================================
echo Test Summary
echo =========================================
echo Total tests: %TOTAL_TESTS%
echo Passed: %PASSED_TESTS%
echo Failed: %FAILED_TESTS%
echo.

REM 平台信息
echo Platform Information:
echo   - OS: Windows
systeminfo | findstr /B /C:"OS Name" /C:"OS Version"
echo   - Python:
python --version
echo.

REM 构建信息
if exist dist\jarvis-engine-daemon.exe (
    echo Build Information:
    echo   - Executable: dist\jarvis-engine-daemon.exe
    for %%A in (dist\jarvis-engine-daemon.exe) do echo   - Size: %%~zA bytes
    echo.
)

REM 退出码
if %FAILED_TESTS% EQU 0 (
    echo [32mAll tests passed![0m
    exit /b 0
) else (
    echo [33mSome tests failed[0m
    exit /b 1
)
