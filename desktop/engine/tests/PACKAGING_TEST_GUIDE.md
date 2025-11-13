# 打包测试指南

## 概述

本文档提供创建和测试macOS DMG和Windows MSI安装包的详细指南。

## macOS DMG打包

### 1. 前置条件

- macOS 10.15或更高版本
- Xcode Command Line Tools
- create-dmg工具

### 2. 安装工具

```bash
# 安装create-dmg
brew install create-dmg

# 或使用npm
npm install -g create-dmg
```

### 3. 准备应用包

```bash
cd desktop/frontend

# 构建Tauri应用
npm run tauri build

# 检查构建产物
ls -la src-tauri/target/release/bundle/macos/
```

### 4. 创建DMG

#### 方法1：使用create-dmg

```bash
# 创建DMG脚本
cat > create_dmg.sh << 'EOF'
#!/bin/bash

APP_NAME="Jarvis"
APP_PATH="src-tauri/target/release/bundle/macos/${APP_NAME}.app"
DMG_NAME="${APP_NAME}-Installer.dmg"
VOLUME_NAME="${APP_NAME} Installer"

# 创建DMG
create-dmg \
  --volname "${VOLUME_NAME}" \
  --volicon "src-tauri/icons/icon.icns" \
  --window-pos 200 120 \
  --window-size 800 400 \
  --icon-size 100 \
  --icon "${APP_NAME}.app" 200 190 \
  --hide-extension "${APP_NAME}.app" \
  --app-drop-link 600 185 \
  "${DMG_NAME}" \
  "${APP_PATH}"

echo "DMG created: ${DMG_NAME}"
EOF

chmod +x create_dmg.sh
./create_dmg.sh
```

#### 方法2：使用Tauri内置功能

Tauri 2.0会自动创建DMG，检查：

```bash
ls -la src-tauri/target/release/bundle/dmg/
```

### 5. 测试DMG

#### 5.1 挂载测试

```bash
# 挂载DMG
hdiutil attach Jarvis-Installer.dmg

# 检查内容
ls -la /Volumes/Jarvis\ Installer/

# 卸载
hdiutil detach /Volumes/Jarvis\ Installer/
```

#### 5.2 安装测试

1. 双击DMG文件
2. 将应用拖到Applications文件夹
3. 从Applications启动应用
4. 验证所有功能正常

#### 5.3 卸载测试

1. 从Applications删除应用
2. 检查残留文件：
   ```bash
   # 检查应用数据
   ls -la ~/Library/Application\ Support/com.jarvis.app/
   
   # 检查日志
   ls -la ~/.jarvis/
   ```

### 6. 代码签名（可选但推荐）

```bash
# 查看可用的签名证书
security find-identity -v -p codesigning

# 签名应用
codesign --force --deep --sign "Developer ID Application: Your Name" \
  src-tauri/target/release/bundle/macos/Jarvis.app

# 验证签名
codesign --verify --deep --strict --verbose=2 \
  src-tauri/target/release/bundle/macos/Jarvis.app

# 公证（需要Apple Developer账号）
xcrun notarytool submit Jarvis-Installer.dmg \
  --apple-id "your@email.com" \
  --password "app-specific-password" \
  --team-id "TEAM_ID" \
  --wait

# 装订公证票据
xcrun stapler staple Jarvis-Installer.dmg
```

## Windows MSI打包

### 1. 前置条件

- Windows 10或更高版本
- WiX Toolset 3.11或更高版本
- Visual Studio Build Tools（可选）

### 2. 安装WiX Toolset

```cmd
# 下载并安装WiX Toolset
# https://wixtoolset.org/releases/

# 或使用Chocolatey
choco install wixtoolset

# 验证安装
candle -?
light -?
```

### 3. 准备应用

```cmd
cd desktop\frontend

# 构建Tauri应用
npm run tauri build

# 检查构建产物
dir src-tauri\target\release\bundle\msi\
```

### 4. 创建MSI

Tauri 2.0会自动创建MSI，检查：

```cmd
dir src-tauri\target\release\bundle\msi\*.msi
```

如果需要自定义MSI，可以修改 `src-tauri/tauri.conf.json`:

```json
{
  "tauri": {
    "bundle": {
      "windows": {
        "wix": {
          "language": "zh-CN",
          "template": "custom-installer.wxs"
        }
      }
    }
  }
}
```

### 5. 测试MSI

#### 5.1 安装测试

```cmd
# 静默安装
msiexec /i Jarvis_x.x.x_x64.msi /quiet /l*v install.log

# 交互式安装
msiexec /i Jarvis_x.x.x_x64.msi

# 检查安装位置
dir "C:\Program Files\Jarvis\"
```

#### 5.2 功能测试

1. 从开始菜单启动应用
2. 验证所有功能正常
3. 检查Python引擎是否正确打包
4. 测试GUI自动化功能

#### 5.3 卸载测试

```cmd
# 静默卸载
msiexec /x Jarvis_x.x.x_x64.msi /quiet /l*v uninstall.log

# 交互式卸载
# 通过"添加或删除程序"卸载

# 检查残留文件
dir "%APPDATA%\com.jarvis.app\"
dir "%USERPROFILE%\.jarvis\"
```

### 6. 代码签名（可选但推荐）

```cmd
# 使用signtool签名
signtool sign /f certificate.pfx /p password /t http://timestamp.digicert.com Jarvis_x.x.x_x64.msi

# 验证签名
signtool verify /pa Jarvis_x.x.x_x64.msi
```

## 自动化打包脚本

### macOS打包脚本

```bash
#!/bin/bash
# package_macos.sh

set -e

echo "========================================="
echo "macOS Packaging Script"
echo "========================================="
echo ""

# 配置
APP_NAME="Jarvis"
VERSION="2.0.0"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "$PROJECT_ROOT/desktop/frontend"

# 1. 清理旧构建
echo "Cleaning old builds..."
rm -rf src-tauri/target/release/bundle

# 2. 构建应用
echo "Building application..."
npm run tauri build

# 3. 检查构建产物
APP_PATH="src-tauri/target/release/bundle/macos/${APP_NAME}.app"
if [ ! -d "$APP_PATH" ]; then
    echo "Error: Application not found at $APP_PATH"
    exit 1
fi

echo "✓ Application built successfully"

# 4. 创建DMG
echo "Creating DMG..."
DMG_PATH="src-tauri/target/release/bundle/dmg/${APP_NAME}_${VERSION}.dmg"

if [ -f "$DMG_PATH" ]; then
    echo "✓ DMG created: $DMG_PATH"
    
    # 显示文件信息
    ls -lh "$DMG_PATH"
    
    # 计算校验和
    shasum -a 256 "$DMG_PATH"
else
    echo "Warning: DMG not found, may need manual creation"
fi

echo ""
echo "========================================="
echo "Packaging Complete"
echo "========================================="
```

### Windows打包脚本

```cmd
@echo off
REM package_windows.bat

echo =========================================
echo Windows Packaging Script
echo =========================================
echo.

REM 配置
set APP_NAME=Jarvis
set VERSION=2.0.0
set PROJECT_ROOT=%~dp0..\..

cd /d %PROJECT_ROOT%\desktop\frontend

REM 1. 清理旧构建
echo Cleaning old builds...
if exist src-tauri\target\release\bundle rmdir /s /q src-tauri\target\release\bundle

REM 2. 构建应用
echo Building application...
call npm run tauri build

REM 3. 检查构建产物
set MSI_PATH=src-tauri\target\release\bundle\msi\%APP_NAME%_%VERSION%_x64.msi

if exist "%MSI_PATH%" (
    echo ✓ MSI created: %MSI_PATH%
    
    REM 显示文件信息
    dir "%MSI_PATH%"
    
    REM 计算校验和
    certutil -hashfile "%MSI_PATH%" SHA256
) else (
    echo Error: MSI not found
    exit /b 1
)

echo.
echo =========================================
echo Packaging Complete
echo =========================================
```

## 测试清单

### macOS DMG测试

- [ ] DMG文件可以正常挂载
- [ ] 应用图标显示正确
- [ ] 拖拽安装到Applications正常
- [ ] 从Applications启动应用正常
- [ ] 所有功能正常工作
- [ ] Python引擎正确打包
- [ ] GUI自动化功能正常
- [ ] 卸载后无残留文件（除用户数据）
- [ ] 代码签名有效（如果已签名）
- [ ] 公证通过（如果已公证）

### Windows MSI测试

- [ ] MSI文件可以正常安装
- [ ] 安装向导显示正确
- [ ] 安装到Program Files正常
- [ ] 开始菜单快捷方式创建正常
- [ ] 桌面快捷方式创建正常（如果选择）
- [ ] 从开始菜单启动应用正常
- [ ] 所有功能正常工作
- [ ] Python引擎正确打包
- [ ] GUI自动化功能正常
- [ ] 卸载正常
- [ ] 卸载后无残留文件（除用户数据）
- [ ] 代码签名有效（如果已签名）

## 常见问题

### 问题1：DMG创建失败

**解决方案**:
1. 检查create-dmg是否正确安装
2. 确认应用路径正确
3. 检查磁盘空间
4. 查看详细错误信息

### 问题2：MSI安装失败

**解决方案**:
1. 检查Windows Installer服务是否运行
2. 以管理员身份运行
3. 检查安装日志
4. 确认没有旧版本残留

### 问题3：代码签名失败

**解决方案**:
1. 确认证书有效
2. 检查证书权限
3. 使用正确的签名工具
4. 查看详细错误信息

## 性能指标

### 安装包大小

| 平台 | 目标大小 | 实际大小 | 状态 |
|------|---------|---------|------|
| macOS DMG | < 150MB | ___ MB | ⏳ |
| Windows MSI | < 150MB | ___ MB | ⏳ |

### 安装时间

| 平台 | 目标时间 | 实际时间 | 状态 |
|------|---------|---------|------|
| macOS | < 30秒 | ___ 秒 | ⏳ |
| Windows | < 60秒 | ___ 秒 | ⏳ |

## 发布清单

- [ ] 创建macOS DMG
- [ ] 创建Windows MSI
- [ ] 测试macOS安装
- [ ] 测试Windows安装
- [ ] 代码签名（macOS）
- [ ] 代码签名（Windows）
- [ ] 公证（macOS）
- [ ] 创建发布说明
- [ ] 上传到发布平台
- [ ] 更新下载链接

## 参考资料

- [Tauri打包文档](https://tauri.app/v1/guides/building/)
- [create-dmg文档](https://github.com/create-dmg/create-dmg)
- [WiX Toolset文档](https://wixtoolset.org/documentation/)
- [macOS代码签名指南](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [Windows代码签名指南](https://docs.microsoft.com/en-us/windows/win32/seccrypto/cryptography-tools)

---

**文档版本**: v1.0  
**最后更新**: 2024-11-12  
**维护者**: 开发团队
