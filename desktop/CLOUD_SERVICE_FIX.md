# 云服务连接修复

## 问题描述

前端显示"无法连接到云服务"的警告，但云服务实际上已经在 8080 端口正常运行。

## 问题原因

云服务的健康检查端点配置错误：
- **错误的端点**: `http://localhost:8080/api/v1/health`
- **正确的端点**: `http://localhost:8080/health`

## 修复内容

### 1. 更新 API 配置 (`api.ts`)

在 `API_ENDPOINTS.cloud` 中添加了正确的健康检查端点：

```typescript
cloud: {
    base: `${CLOUD_API_BASE_URL}${CLOUD_API_PREFIX}`,
    health: `${CLOUD_API_BASE_URL}/health`,  // 新增
    auth: { ... },
    ...
}
```

### 2. 更新连接监控 (`connectionMonitor.ts`)

使用配置中的健康检查端点：

```typescript
// 云服务仍然使用 HTTP 检查
const url = API_ENDPOINTS.cloud.health;
const response = await fetch(url, {
    method: 'GET',
    signal: AbortSignal.timeout(3000),
});
return response.ok;
```

## 验证

可以通过以下命令验证云服务健康检查：

```bash
curl http://localhost:8080/health
```

预期输出：
```json
{"status":"ok","time":1762928636}
```

## 结果

修复后，前端应该能够正确检测到云服务的运行状态，不再显示"无法连接到云服务"的警告。

## 相关文件

- `desktop/frontend/src/config/api.ts` - API 配置
- `desktop/frontend/src/services/connectionMonitor.ts` - 连接监控服务
