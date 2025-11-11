# 连接错误友好提示功能

## 概述

根据产品愿景，当后端服务（Python引擎或云服务）连接失败时，系统现在会显示友好的错误提示，帮助用户快速定位和解决问题。

## 新增功能

### 1. Toast通知组件

位置：`frontend/src/components/ui/Toast.tsx`

- 支持4种类型：success、error、warning、info
- 自动消失或持久显示
- 支持操作按钮
- 优雅的动画效果

### 2. 连接监控服务

位置：`frontend/src/services/connectionMonitor.ts`

功能：
- 自动检测Python引擎和云服务的连接状态
- 定期轮询（默认30秒）
- 连接失败时显示友好提示
- 连接恢复时显示成功提示
- 提供详细的故障排除指南

### 3. 改进的错误处理

位置：`frontend/src/services/api.ts`

- 区分不同类型的连接错误
- 提供更具体的错误信息
- 自动识别是引擎还是云服务的问题

## 用户体验

### Python引擎连接失败

显示错误提示：
```
❌ 无法连接到本地引擎
贾维斯的执行引擎未启动，部分功能将无法使用

[查看解决方案]
```

点击"查看解决方案"会显示详细的启动指南。

### 云服务连接失败

显示警告提示：
```
⚠️ 无法连接到云服务
云端功能暂时不可用，本地功能不受影响
```

### 连接恢复

显示成功提示：
```
✓ 本地引擎已连接
所有功能已恢复正常
```

## 技术实现

### 连接检查流程

1. 应用启动时立即检查连接状态
2. 启动后台监控（每30秒检查一次）
3. 检测到连接问题时显示Toast提示
4. 连接恢复时显示成功提示
5. 避免重复提示（使用标志位）

### 健康检查端点

- Python引擎：`http://localhost:8000/health`
- 云服务：`http://localhost:8080/api/v1/health`

### 超时设置

- 健康检查超时：3秒
- API请求超时：30秒

## 使用示例

### 手动触发连接检查

```typescript
import { connectionMonitor } from '@/services/connectionMonitor';

// 检查连接状态
const status = await connectionMonitor.recheckNow();
console.log('Engine:', status.engine);
console.log('Cloud:', status.cloud);
```

### 显示自定义Toast

```typescript
import { toast } from '@/components/ui/Toast';

toast.error('操作失败', '请稍后重试', {
  duration: 5000,
  action: {
    label: '重试',
    onClick: () => retryOperation()
  }
});
```

## 配置

### 修改检查间隔

在`App.tsx`中修改：

```typescript
// 改为每60秒检查一次
connectionMonitor.startMonitoring(60000);
```

### 修改超时时间

在`connectionMonitor.ts`中修改：

```typescript
signal: AbortSignal.timeout(5000), // 改为5秒
```

## 故障排除

### 引擎启动失败

1. 检查Python环境是否正确安装
2. 检查端口8000是否被占用
3. 查看日志：`logs/engine.log`
4. 手动启动：`npm run start:engine`

### 云服务连接失败

1. 检查网络连接
2. 确认云服务地址配置正确
3. 检查防火墙设置

## 未来改进

- [ ] 添加重试按钮
- [ ] 显示连接状态指示器
- [ ] 支持离线模式
- [ ] 添加连接历史记录
- [ ] 提供更详细的诊断信息
