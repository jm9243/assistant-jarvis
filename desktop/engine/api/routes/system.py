from fastapi import APIRouter
from models import Result, SystemMetric, SoftwareItem, Status
from loguru import logger
import psutil
import platform

router = APIRouter()


@router.get("/info", response_model=Result[SystemMetric])
async def get_system_info():
    """获取系统信息"""
    try:
        # 使用非阻塞方式获取CPU使用率
        # 第一次调用会初始化，返回0或上次的值
        # 后续调用会返回实际的CPU使用率
        cpu_percent = psutil.cpu_percent(interval=None)
        
        # 如果CPU为0，使用interval=0.5获取更准确的值
        if cpu_percent == 0.0:
            cpu_percent = psutil.cpu_percent(interval=0.5)
        
        memory = psutil.virtual_memory()
        memory_percent = memory.percent

        metric = SystemMetric(
            cpu=cpu_percent,
            memory=memory_percent,
            sidecarStatus=Status.RUNNING,
            alerts=[],
        )

        return Result.ok(metric)
    except Exception as e:
        logger.error(f"Failed to get system info: {e}")
        return Result.fail(str(e))


@router.get("/status", response_model=Result[dict])
async def get_system_status():
    """获取系统状态"""
    try:
        import time

        boot_time = psutil.boot_time()
        uptime = time.time() - boot_time

        return Result.ok({
            "status": "running",
            "uptime": int(uptime),
            "platform": platform.system(),
            "python_version": platform.python_version(),
        })
    except Exception as e:
        logger.error(f"Failed to get system status: {e}")
        return Result.fail(str(e))


@router.get("/scan", response_model=Result[list[SoftwareItem]])
async def scan_software():
    """扫描系统软件"""
    try:
        import subprocess
        import os
        
        software_list = []
        system = platform.system()
        
        if system == "Darwin":  # macOS
            # 扫描 /Applications 目录
            apps_dir = "/Applications"
            if os.path.exists(apps_dir):
                for app_name in os.listdir(apps_dir):
                    if app_name.endswith(".app"):
                        app_path = os.path.join(apps_dir, app_name)
                        name = app_name.replace(".app", "")
                        
                        # 尝试获取版本信息
                        version = "Unknown"
                        try:
                            plist_path = os.path.join(app_path, "Contents", "Info.plist")
                            if os.path.exists(plist_path):
                                result = subprocess.run(
                                    ["defaults", "read", plist_path, "CFBundleShortVersionString"],
                                    capture_output=True,
                                    text=True,
                                    timeout=1
                                )
                                if result.returncode == 0:
                                    version = result.stdout.strip()
                        except:
                            pass
                        
                        # 判断兼容性
                        compatibility = "unknown"
                        capabilities = []
                        
                        # 常见应用的兼容性和能力
                        if "Chrome" in name or "Chromium" in name:
                            compatibility = "full"
                            capabilities = ["web_automation", "browser_control"]
                        elif "Safari" in name:
                            compatibility = "partial"
                            capabilities = ["web_browsing"]
                        elif "Visual Studio Code" in name or "VSCode" in name:
                            compatibility = "partial"
                            capabilities = ["text_editing", "file_operations"]
                        elif "Terminal" in name or "iTerm" in name:
                            compatibility = "full"
                            capabilities = ["shell_execution"]
                        elif "Finder" in name:
                            compatibility = "full"
                            capabilities = ["file_management"]
                        
                        software_list.append(
                            SoftwareItem(
                                id=name.lower().replace(" ", "_"),
                                name=name,
                                version=version,
                                platform="macos",
                                compatibility=compatibility,
                                capabilities=capabilities,
                            )
                        )
        
        elif system == "Windows":
            # Windows 软件扫描
            try:
                # 扫描注册表中的已安装程序
                result = subprocess.run(
                    ["reg", "query", "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall", "/s"],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                # 简化处理，实际需要解析注册表输出
                software_list.append(
                    SoftwareItem(
                        id="windows_apps",
                        name="Windows Applications",
                        version="Various",
                        platform="windows",
                        compatibility="unknown",
                        capabilities=[],
                    )
                )
            except:
                pass
        
        # 如果没有扫描到任何软件，返回示例数据
        if not software_list:
            software_list = [
                SoftwareItem(
                    id="example",
                    name="No applications found",
                    version="N/A",
                    platform="macos" if system == "Darwin" else "windows",
                    compatibility="unknown",
                    capabilities=[],
                ),
            ]
        
        logger.info(f"Scanned {len(software_list)} software items")
        return Result.ok(software_list)
    except Exception as e:
        logger.error(f"Failed to scan software: {e}")
        return Result.fail(str(e))


@router.get("/logs", response_model=Result[list[dict]])
async def get_logs(level: str = None, limit: int = 100):
    """获取日志"""
    try:
        # TODO: 实现实际的日志读取逻辑
        # 这里返回模拟数据
        logs = [
            {
                "timestamp": "2024-01-10T10:30:00",
                "level": "INFO",
                "message": "Engine started successfully",
            },
            {
                "timestamp": "2024-01-10T10:31:00",
                "level": "INFO",
                "message": "WebSocket connected",
            },
        ]

        if level:
            logs = [log for log in logs if log["level"] == level.upper()]

        logs = logs[:limit]

        return Result.ok(logs)
    except Exception as e:
        logger.error(f"Failed to get logs: {e}")
        return Result.fail(str(e))
