# 完整实现计划

## 需要实现的功能模块

### 1. Agent 管理
**前端调用 (agentStore.ts)**
- `fetchAgents()` → `agentApi.listAgents()`
- `fetchAgent(agentId)` → `agentApi.getAgent(agentId)`
- `createAgent(data)` → `agentApi.createAgent(data)`
- `updateAgent(agentId, data)` → `agentApi.updateAgent(agentId, data)`
- `deleteAgent(agentId)` → `agentApi.deleteAgent(agentId)`

**Tauri 命令 (commands.rs)**
- ✅ `list_agents`
- ✅ `get_agent`
- ✅ `create_agent`
- ✅ `update_agent`
- ✅ `delete_agent`

**Python IPC (agent_management_ipc.py)**
- ⚠️ `list_agents` - 需要完整实现
- ⚠️ `get_agent` - 需要完整实现
- ⚠️ `create_agent` - 需要完整实现
- ⚠️ `update_agent` - 需要完整实现
- ⚠️ `delete_agent` - 需要完整实现

### 2. 知识库管理
**前端调用 (KnowledgeBaseListPage.tsx)**
- `loadKnowledgeBases()` → `knowledgeBaseApi.listKnowledgeBases()`
- `handleDelete(id)` → `knowledgeBaseApi.deleteKnowledgeBase(id)`
- `handleCreate(data)` → `knowledgeBaseApi.createKnowledgeBase(data)`

**Tauri 命令 (commands.rs)**
- ✅ `list_knowledge_bases`
- ✅ `get_knowledge_base`
- ✅ `create_knowledge_base`
- ✅ `update_knowledge_base`
- ✅ `delete_knowledge_base`
- ✅ `list_documents`

**Python IPC (kb_management_ipc.py)**
- ⚠️ `list_knowledge_bases` - 需要完整实现
- ⚠️ `get_knowledge_base` - 需要完整实现
- ⚠️ `create_knowledge_base` - 需要完整实现
- ⚠️ `update_knowledge_base` - 需要完整实现
- ⚠️ `delete_knowledge_base` - 需要完整实现
- ⚠️ `list_documents` - 需要完整实现

### 3. 工具管理
**前端调用 (ToolStorePage.tsx)**
- `loadTools()` → `toolApi.listTools()`
- `handleToggleTool(toolId, enabled)` → `toolApi.updateTool(toolId, {is_enabled})`
- `handleUpdatePermission(toolId, policy)` → `toolApi.updateTool(toolId, {approval_policy})`

**Tauri 命令 (commands.rs)**
- ✅ `list_tools`
- ✅ `get_tool`
- ✅ `update_tool`
- ✅ `call_tool`

**Python IPC (tool_management_ipc.py)**
- ⚠️ `list_tools` - 需要完整实现
- ⚠️ `get_tool` - 需要完整实现
- ⚠️ `update_tool` - 需要完整实现
- ⚠️ `call_tool` - 需要完整实现

### 4. 对话管理
**前端调用 (ChatPage.tsx)**
- `loadConversations()` → `backend.getConversations(agentId)` (Go 后台)
- `loadMessages(conversationId)` → `pythonEngine.getConversationHistory(conversationId)`
- `handleCreateConversation()` → `pythonEngine.createConversation(agentId)`
- `handleDeleteConversation(conversationId)` → `backend.deleteConversation(conversationId)` (Go 后台)

**Tauri 命令 (commands.rs)**
- ✅ `create_conversation`
- ✅ `get_conversation_history`
- ✅ `agent_chat`

**Python IPC (ipc_functions.py)**
- ✅ `create_conversation` - 已实现
- ✅ `get_conversation_history` - 已实现
- ✅ `agent_chat` - 已实现

### 5. 录制器
**前端调用 (RecorderPage.tsx)**
- `handleStartRecording()` → `engineApi.startRecording()`
- `handleStopRecording()` → `engineApi.stopRecording()`
- `handlePauseRecording()` → `engineApi.pauseRecording()`
- `handleResumeRecording()` → `engineApi.resumeRecording()`
- `loadRecordingStatus()` → `engineApi.getRecordingStatus()`

**Tauri 命令 (commands.rs)**
- ✅ `start_recording`
- ✅ `stop_recording`
- ✅ `pause_recording`
- ✅ `resume_recording`
- ✅ `get_recording_status`

**Python IPC (recorder.ipc_functions.py)**
- ⚠️ 需要检查是否完整实现

### 6. 工作流
**前端调用 (WorkflowPage.tsx)**
- `handleExecuteWorkflow(workflowId, inputs)` → `engineApi.executeWorkflow(workflowId, inputs)`
- `handlePauseExecution(runId)` → `engineApi.pauseExecution(runId)`
- `handleResumeExecution(runId)` → `engineApi.resumeExecution(runId)`
- `handleCancelExecution(runId)` → `engineApi.cancelExecution(runId)`

**Tauri 命令 (commands.rs)**
- ✅ `execute_workflow`
- ✅ `pause_workflow`
- ✅ `resume_workflow`
- ✅ `cancel_workflow`

**Python IPC (workflow.ipc_functions.py)**
- ⚠️ 需要检查是否完整实现

## 实现优先级

### P0 (立即实现 - 影响基本功能)
1. Agent 管理 - 完整实现所有 CRUD 操作
2. 知识库管理 - 完整实现所有 CRUD 操作
3. 工具管理 - 完整实现列表和更新操作

### P1 (重要 - 影响核心功能)
4. 录制器 - 确保所有操作正常工作
5. 工作流 - 确保执行和控制正常工作

### P2 (可选 - 增强功能)
6. 系统监控
7. 软件扫描

## 实现策略

1. **使用数据库持久化**
   - Agent 数据存储在 SQLite
   - 知识库元数据存储在 SQLite
   - 工具配置存储在 SQLite

2. **使用内存缓存**
   - 对于频繁访问的数据使用内存缓存
   - 定期同步到数据库

3. **错误处理**
   - 所有 IPC 函数返回统一的格式：`{success: bool, data/error: any}`
   - 前端统一处理错误并显示友好提示

4. **日志记录**
   - 所有操作记录详细日志
   - 便于调试和问题追踪
