# Jarvis Desktop - Tauri应用

## 快速开始

### 开发模式
```bash
npm run tauri:dev
```

### 打包应用
```bash
# 简化打包（推荐）
./build-simple.sh

# 或使用npm命令
npm run bundle
```

## 目录结构

```
src-tauri/
├── src/
│   ├── main.rs          # 应用入口
│   └── lib.rs           # 核心逻辑
├── icons/               # 应用图标
├── resources/           # 打包资源（自动生成）
│   └── engine/          # Python引擎
├── Cargo.toml           # Rust依赖
├── tauri.conf.json      # Tauri配置
└── build-simple.sh      # 打包脚本
```

## 功能特性

### 1. Python引擎管理
- 自动启动/停止Python引擎
- 支持开发和生产环境
- 自动检测引擎路径

### 2. 系统集成
- 密钥库集成（安全存储API密钥）
- 系统权限请求
- 窗口管理

### 3. 跨平台支持
- macOS (Intel + Apple Silicon)
- Windows (x64)
- Linux (x64)

## 打包配置

### 修改应用信息
编辑 `tauri.conf.json`:
```json
{
  "productName": "助手·贾维斯",
  "version": "1.0.0",
  "identifier": "com.jarvis.assistant"
}
```

### 添加资源文件
编辑 `tauri.conf.json`:
```json
{
  "bundle": {
    "resources": [
      "resources/engine/**"
    ]
  }
}
```

### 自定义图标
替换 `icons/` 目录下的文件：
- `icon.icns` - macOS
- `icon.ico` - Windows
- `*.png` - 各种尺寸

## API命令

### start_engine
启动Python引擎
```typescript
import { invoke } from '@tauri-apps/api/core';
await invoke('start_engine');
```

### stop_engine
停止Python引擎
```typescript
await invoke('stop_engine');
```

### check_engine_status
检查引擎状态
```typescript
const isRunning = await invoke('check_engine_status');
```

### save_to_keychain
保存到系统密钥库
```typescript
await invoke('save_to_keychain', {
  service: 'jarvis',
  account: 'openai_api_key',
  password: 'sk-...'
});
```

### get_from_keychain
从系统密钥库读取
```typescript
const apiKey = await invoke('get_from_keychain', {
  service: 'jarvis',
  account: 'openai_api_key'
});
```

## 开发调试

### 查看日志
```bash
# macOS
tail -f ~/Library/Logs/jarvis-desktop/engine.log

# Windows
type %APPDATA%\jarvis-desktop\logs\engine.log

# Linux
tail -f ~/.local/share/jarvis-desktop/logs/engine.log
```

### 清理构建
```bash
cargo clean
rm -rf target
rm -rf ../dist
```

### 重新构建
```bash
cargo build --release
```

## 故障排除

### 问题1：引擎启动失败
- 检查Python是否安装：`python3 --version`
- 检查引擎路径是否正确
- 查看日志文件

### 问题2：打包失败
- 更新Rust：`rustup update`
- 清理缓存：`cargo clean`
- 检查依赖：`cargo check`

### 问题3：图标不显示
- 确保图标文件存在
- 重新生成图标：`cargo tauri icon path/to/icon.png`

## 参考资料

- [Tauri文档](https://tauri.app/)
- [Rust文档](https://doc.rust-lang.org/)
- [Cargo文档](https://doc.rust-lang.org/cargo/)
