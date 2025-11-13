# IPC 迁移状态

## 概述
前端已从 HTTP API 迁移到 Tauri IPC 架构。所有与 Python 引擎的通信现在通过 Tauri 命令进行。

## ✅ 已实现的功能

### 引擎管理
- `check_engine_health` - 检查引擎健康状态
- `restart_engine` - 重启引擎

### Agent 相关
- `agent_chat` - Agent 对话
- `create_conversation` - 创建会话
- `get_conversation_history` - 获取会话历史

### 知识库相关
- `kb_search` - 知识库搜索
- `kb_add_document` - 添加文档
- `kb_delete_document` - 删除文档
- `kb_get_stats` - 获取统计信息

### GUI 自动化
- `locate_element` - 定位元素
- `click_element` - 点击元素
- `input_text` - 输入文本

### 工作流相关
- `execute_workflow` - 执行工作流
- `pause_workflow` - 暂停工作流
- `resume_workflow` - 恢复工作流
- `cancel_workflow` - 取消工作流

### 录制器相关
- `start_recording` - 开始录制
- `stop_recording` - 停止录制
- `pause_recording` - 暂停录制
- `resume_recording` - 恢复录制
- `get_recording_status` - 获取录制状态

### 系统相关
- `save_to_keychain` - 保存到密钥库
- `get_from_keychain` - 从密钥库读取
- `request_permission` - 请求系统权限

## ⏳ 需要实现的功能

### 知识库管理
- `list_knowledge_bases` - 列出所有知识库
- `get_knowledge_base` - 获取知识库详情
- `create_knowledge_base` - 创建知识库
- `update_knowledge_base` - 更新知识库
- `delete_knowledge_base` - 删除知识库
- `list_documents` - 列出文档

### 工具管理
- `list_tools` - 列出所有工具
- `get_tool` - 获取工具详情
- `update_tool` - 更新工具
- `call_tool` - 调用工具

### Agent 管理
- `create_agent` - 创建 Agent
- `list_agents` - 列出 Agent
- `get_agent` - 获取 Agent 详情
- `update_agent` - 更新 Agent
- `delete_agent` - 删除 Agent

### 对话管理
- `list_conversations` - 列出会话
- `get_conversation` - 获取会话详情
- `get_messages` - 获取消息列表
- `send_message` - 发送消息
- `update_conversation` - 更新会话
- `delete_conversation` - 删除会话
- `export_conversation` - 导出会话

## 📝 实现步骤

### 1. 在 Python 引擎中添加 IPC 函数

在 `desktop/engine/daemon.py` 的 `FUNCTION_MAP` 中添加函数映射：

```python
FUNCTION_MAP: Dict[str, Tuple[str, str, str]] = {
    # 添加新函数
    'list_knowledge_bases': ('core.service.kb_ipc_functions', 'list_knowledge_bases', '列出知识库'),
    # ...
}
```

### 2. 在 Rust 中添加 Tauri 命令

在 `desktop/frontend/src-tauri/src/commands.rs` 中添加命令：

```rust
#[tauri::command]
pub async fn list_knowledge_bases(
    state: State<'_, PythonState>,
) -> Result<serde_json::Value, String> {
    let args = json!({});
    state.call("list_knowledge_bases", args).await
        .map_err(|e| format!("List knowledge bases failed: {}", e))
}
```

### 3. 注册命令

在 `desktop/frontend/src-tauri/src/lib.rs` 的 `invoke_handler` 中注册：

```rust
.invoke_handler(tauri::generate_handler![
    // ...
    commands::list_knowledge_bases,
])
```

### 4. 更新前端服务

在对应的服务文件中实现调用：

```typescript
async listKnowledgeBases(): Promise<KnowledgeBase[]> {
  return await invoke<KnowledgeBase[]>('list_knowledge_bases');
}
```

## 🔧 当前状态

### 前端
- ✅ 连接监控已改用 Tauri 命令
- ✅ 录制器 API 已迁移
- ✅ 工作流 API 已迁移
- ✅ 知识库搜索/添加/删除已迁移
- ⏳ 知识库管理功能需要实现
- ⏳ 工具管理功能需要实现
- ⏳ Agent 管理功能需要实现

### 后端
- ✅ Tauri 自动启动 Python daemon
- ✅ IPC 通信已建立
- ⏳ 需要在 Python 中实现缺失的 IPC 函数

## 🚀 启动应用

```bash
cd desktop
npm start
```

这将同时启动：
1. Python 引擎 daemon（通过 Tauri 自动启动）
2. Tauri 前端应用

## 📚 相关文件

- `desktop/frontend/src/services/python.ts` - Python 引擎服务（已完成）
- `desktop/frontend/src/services/engineApi.ts` - 引擎 API（已迁移）
- `desktop/frontend/src/services/knowledgeBaseApi.ts` - 知识库 API（部分实现）
- `desktop/frontend/src/services/toolApi.ts` - 工具 API（待实现）
- `desktop/frontend/src/services/agentApi.ts` - Agent API（待实现）
- `desktop/frontend/src/services/connectionMonitor.ts` - 连接监控（已迁移）
- `desktop/frontend/src-tauri/src/commands.rs` - Tauri 命令定义
- `desktop/frontend/src-tauri/src/lib.rs` - Tauri 应用入口
- `desktop/engine/daemon.py` - Python IPC daemon
