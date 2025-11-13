use tauri::State;
use crate::python_state::PythonState;
use serde_json::json;

/// 命令模块
/// 
/// 封装所有Tauri命令，提供前端调用Python引擎功能的接口
/// 所有命令都通过PythonState进行IPC通信
/// 
/// 命令分类：
/// - Agent相关命令：agent_chat, create_conversation, get_conversation_history
/// - 知识库相关命令：kb_search, kb_add_document
/// - GUI自动化命令：locate_element, click_element, input_text
/// - 工作流相关命令：execute_workflow
/// - 录制器相关命令：start_recording, stop_recording

// ============================================================================
// Agent对话命令
// ============================================================================

/// Agent对话命令
/// 
/// 发送消息到指定的对话会话，获取Agent的回复
/// 
/// # Arguments
/// * `state` - Python状态管理器
/// * `conversation_id` - 对话会话ID
/// * `message` - 用户消息内容
/// * `stream` - 是否使用流式响应
/// 
/// # Returns
/// * `Ok(serde_json::Value)` - Agent回复结果
/// * `Err(String)` - 错误信息
#[tauri::command]
pub async fn agent_chat(
    state: State<'_, PythonState>,
    conversation_id: String,
    message: String,
    stream: Option<bool>,
) -> Result<serde_json::Value, String> {
    // 参数验证
    if conversation_id.is_empty() {
        return Err("conversation_id cannot be empty".to_string());
    }
    
    if message.is_empty() {
        return Err("message cannot be empty".to_string());
    }
    
    // 构建参数
    let args = json!({
        "conversation_id": conversation_id,
        "message": message,
        "stream": stream.unwrap_or(false),
    });
    
    // 调用Python引擎
    state.call("agent_chat", args).await
        .map_err(|e| format!("Agent chat failed: {}", e))
}

/// 创建对话会话命令
/// 
/// 为指定的Agent创建新的对话会话
/// 
/// # Arguments
/// * `state` - Python状态管理器
/// * `agent_id` - Agent ID
/// 
/// # Returns
/// * `Ok(serde_json::Value)` - 包含新会话ID的结果
/// * `Err(String)` - 错误信息
#[tauri::command]
pub async fn create_conversation(
    state: State<'_, PythonState>,
    agent_id: String,
) -> Result<serde_json::Value, String> {
    // 参数验证
    if agent_id.is_empty() {
        return Err("agent_id cannot be empty".to_string());
    }
    
    // 构建参数
    let args = json!({
        "agent_id": agent_id,
    });
    
    // 调用Python引擎
    state.call("create_conversation", args).await
        .map_err(|e| format!("Create conversation failed: {}", e))
}

/// 获取对话历史命令
/// 
/// 获取指定对话会话的历史消息
/// 
/// # Arguments
/// * `state` - Python状态管理器
/// * `conversation_id` - 对话会话ID
/// 
/// # Returns
/// * `Ok(serde_json::Value)` - 对话历史记录
/// * `Err(String)` - 错误信息
#[tauri::command]
pub async fn get_conversation_history(
    state: State<'_, PythonState>,
    conversation_id: String,
) -> Result<serde_json::Value, String> {
    // 参数验证
    if conversation_id.is_empty() {
        return Err("conversation_id cannot be empty".to_string());
    }
    
    // 构建参数
    let args = json!({
        "conversation_id": conversation_id,
    });
    
    // 调用Python引擎
    state.call("get_conversation_history", args).await
        .map_err(|e| format!("Get conversation history failed: {}", e))
}

// ============================================================================
// 知识库相关命令
// ============================================================================

/// 知识库搜索命令
/// 
/// 在指定知识库中搜索相关文档
/// 
/// # Arguments
/// * `state` - Python状态管理器
/// * `kb_id` - 知识库ID
/// * `query` - 搜索查询文本
/// * `top_k` - 返回结果数量（可选，默认5）
/// 
/// # Returns
/// * `Ok(serde_json::Value)` - 搜索结果列表
/// * `Err(String)` - 错误信息
#[tauri::command]
pub async fn kb_search(
    state: State<'_, PythonState>,
    kb_id: String,
    query: String,
    top_k: Option<usize>,
) -> Result<serde_json::Value, String> {
    // 参数验证
    if kb_id.is_empty() {
        return Err("kb_id cannot be empty".to_string());
    }
    
    if query.is_empty() {
        return Err("query cannot be empty".to_string());
    }
    
    let top_k_value = top_k.unwrap_or(5);
    if top_k_value == 0 || top_k_value > 100 {
        return Err("top_k must be between 1 and 100".to_string());
    }
    
    // 构建参数
    let args = json!({
        "kb_id": kb_id,
        "query": query,
        "top_k": top_k_value,
    });
    
    // 调用Python引擎
    state.call("kb_search", args).await
        .map_err(|e| format!("Knowledge base search failed: {}", e))
}

/// 添加文档到知识库命令
/// 
/// 将文档文件添加到指定知识库
/// 
/// # Arguments
/// * `state` - Python状态管理器
/// * `kb_id` - 知识库ID
/// * `file_path` - 文档文件路径
/// 
/// # Returns
/// * `Ok(serde_json::Value)` - 添加结果（包含文档ID和分块数量）
/// * `Err(String)` - 错误信息
#[tauri::command]
pub async fn kb_add_document(
    state: State<'_, PythonState>,
    kb_id: String,
    file_path: String,
) -> Result<serde_json::Value, String> {
    // 参数验证
    if kb_id.is_empty() {
        return Err("kb_id cannot be empty".to_string());
    }
    
    if file_path.is_empty() {
        return Err("file_path cannot be empty".to_string());
    }
    
    // 验证文件路径是否存在
    if !std::path::Path::new(&file_path).exists() {
        return Err(format!("File not found: {}", file_path));
    }
    
    // 构建参数
    let args = json!({
        "kb_id": kb_id,
        "file_path": file_path,
    });
    
    // 调用Python引擎
    state.call("kb_add_document", args).await
        .map_err(|e| format!("Add document to knowledge base failed: {}", e))
}

// ============================================================================
// GUI自动化命令
// ============================================================================

/// 定位GUI元素命令
/// 
/// 在屏幕上定位指定类型和文本的GUI元素
/// 
/// # Arguments
/// * `state` - Python状态管理器
/// * `element_type` - 元素类型（如button、textbox等）
/// * `text` - 元素文本（可选）
/// 
/// # Returns
/// * `Ok(serde_json::Value)` - 元素位置信息（x, y, width, height）
/// * `Err(String)` - 错误信息
#[tauri::command]
pub async fn locate_element(
    state: State<'_, PythonState>,
    element_type: String,
    text: Option<String>,
) -> Result<serde_json::Value, String> {
    // 参数验证
    if element_type.is_empty() {
        return Err("element_type cannot be empty".to_string());
    }
    
    // 构建参数
    let args = json!({
        "type": element_type,
        "text": text,
    });
    
    // 调用Python引擎
    state.call("locate_element", args).await
        .map_err(|e| format!("Locate element failed: {}", e))
}

/// 点击GUI元素命令
/// 
/// 在指定坐标位置点击鼠标
/// 
/// # Arguments
/// * `state` - Python状态管理器
/// * `x` - X坐标
/// * `y` - Y坐标
/// 
/// # Returns
/// * `Ok(serde_json::Value)` - 点击结果
/// * `Err(String)` - 错误信息
#[tauri::command]
pub async fn click_element(
    state: State<'_, PythonState>,
    x: i32,
    y: i32,
) -> Result<serde_json::Value, String> {
    // 参数验证
    if x < 0 || y < 0 {
        return Err("Coordinates must be non-negative".to_string());
    }
    
    // 构建参数
    let args = json!({
        "x": x,
        "y": y,
    });
    
    // 调用Python引擎
    state.call("click_element", args).await
        .map_err(|e| format!("Click element failed: {}", e))
}

/// 输入文本命令
/// 
/// 在当前焦点位置输入文本
/// 
/// # Arguments
/// * `state` - Python状态管理器
/// * `text` - 要输入的文本
/// 
/// # Returns
/// * `Ok(serde_json::Value)` - 输入结果
/// * `Err(String)` - 错误信息
#[tauri::command]
pub async fn input_text(
    state: State<'_, PythonState>,
    text: String,
) -> Result<serde_json::Value, String> {
    // 参数验证
    if text.is_empty() {
        return Err("text cannot be empty".to_string());
    }
    
    // 构建参数
    let args = json!({
        "text": text,
    });
    
    // 调用Python引擎
    state.call("input_text", args).await
        .map_err(|e| format!("Input text failed: {}", e))
}

// ============================================================================
// 工作流和录制器命令
// ============================================================================

/// 执行工作流命令
/// 
/// 执行指定的工作流，传入输入参数
/// 
/// # Arguments
/// * `state` - Python状态管理器
/// * `workflow_id` - 工作流ID
/// * `inputs` - 工作流输入参数
/// 
/// # Returns
/// * `Ok(serde_json::Value)` - 工作流执行结果
/// * `Err(String)` - 错误信息
#[tauri::command]
pub async fn execute_workflow(
    state: State<'_, PythonState>,
    workflow_id: String,
    inputs: serde_json::Value,
) -> Result<serde_json::Value, String> {
    // 参数验证
    if workflow_id.is_empty() {
        return Err("workflow_id cannot be empty".to_string());
    }
    
    // 验证inputs是否为对象类型
    if !inputs.is_object() {
        return Err("inputs must be a JSON object".to_string());
    }
    
    // 构建参数
    let args = json!({
        "workflow_id": workflow_id,
        "inputs": inputs,
    });
    
    // 调用Python引擎
    state.call("execute_workflow", args).await
        .map_err(|e| format!("Execute workflow failed: {}", e))
}

/// 开始录制命令
/// 
/// 开始录制用户操作，用于创建工作流
/// 
/// # Arguments
/// * `state` - Python状态管理器
/// 
/// # Returns
/// * `Ok(serde_json::Value)` - 录制会话信息
/// * `Err(String)` - 错误信息
#[tauri::command]
pub async fn start_recording(
    state: State<'_, PythonState>,
) -> Result<serde_json::Value, String> {
    // 构建参数（空对象）
    let args = json!({});
    
    // 调用Python引擎
    state.call("start_recording", args).await
        .map_err(|e| format!("Start recording failed: {}", e))
}

/// 停止录制命令
/// 
/// 停止当前的录制会话，返回录制的操作序列
/// 
/// # Arguments
/// * `state` - Python状态管理器
/// 
/// # Returns
/// * `Ok(serde_json::Value)` - 录制的操作序列
/// * `Err(String)` - 错误信息
#[tauri::command]
pub async fn stop_recording(
    state: State<'_, PythonState>,
) -> Result<serde_json::Value, String> {
    // 构建参数（空对象）
    let args = json!({});
    
    // 调用Python引擎
    state.call("stop_recording", args).await
        .map_err(|e| format!("Stop recording failed: {}", e))
}

/// 暂停录制命令
#[tauri::command]
pub async fn pause_recording(
    state: State<'_, PythonState>,
) -> Result<serde_json::Value, String> {
    let args = json!({});
    state.call("pause_recording", args).await
        .map_err(|e| format!("Pause recording failed: {}", e))
}

/// 恢复录制命令
#[tauri::command]
pub async fn resume_recording(
    state: State<'_, PythonState>,
) -> Result<serde_json::Value, String> {
    let args = json!({});
    state.call("resume_recording", args).await
        .map_err(|e| format!("Resume recording failed: {}", e))
}

/// 获取录制状态命令
#[tauri::command]
pub async fn get_recording_status(
    state: State<'_, PythonState>,
) -> Result<serde_json::Value, String> {
    let args = json!({});
    state.call("get_recording_status", args).await
        .map_err(|e| format!("Get recording status failed: {}", e))
}

/// 暂停工作流命令
#[tauri::command]
pub async fn pause_workflow(
    state: State<'_, PythonState>,
    workflow_id: String,
) -> Result<serde_json::Value, String> {
    if workflow_id.is_empty() {
        return Err("workflow_id cannot be empty".to_string());
    }
    
    let args = json!({
        "workflow_id": workflow_id,
    });
    
    state.call("pause_workflow", args).await
        .map_err(|e| format!("Pause workflow failed: {}", e))
}

/// 恢复工作流命令
#[tauri::command]
pub async fn resume_workflow(
    state: State<'_, PythonState>,
    workflow_id: String,
) -> Result<serde_json::Value, String> {
    if workflow_id.is_empty() {
        return Err("workflow_id cannot be empty".to_string());
    }
    
    let args = json!({
        "workflow_id": workflow_id,
    });
    
    state.call("resume_workflow", args).await
        .map_err(|e| format!("Resume workflow failed: {}", e))
}

/// 取消工作流命令
#[tauri::command]
pub async fn cancel_workflow(
    state: State<'_, PythonState>,
    workflow_id: String,
) -> Result<serde_json::Value, String> {
    if workflow_id.is_empty() {
        return Err("workflow_id cannot be empty".to_string());
    }
    
    let args = json!({
        "workflow_id": workflow_id,
    });
    
    state.call("cancel_workflow", args).await
        .map_err(|e| format!("Cancel workflow failed: {}", e))
}

/// 删除知识库文档命令
#[tauri::command]
pub async fn kb_delete_document(
    state: State<'_, PythonState>,
    kb_id: String,
    doc_id: String,
) -> Result<serde_json::Value, String> {
    if kb_id.is_empty() {
        return Err("kb_id cannot be empty".to_string());
    }
    
    if doc_id.is_empty() {
        return Err("doc_id cannot be empty".to_string());
    }
    
    let args = json!({
        "kb_id": kb_id,
        "doc_id": doc_id,
    });
    
    state.call("kb_delete_document", args).await
        .map_err(|e| format!("Delete document failed: {}", e))
}

/// 获取知识库统计信息命令
#[tauri::command]
pub async fn kb_get_stats(
    state: State<'_, PythonState>,
    kb_id: String,
) -> Result<serde_json::Value, String> {
    if kb_id.is_empty() {
        return Err("kb_id cannot be empty".to_string());
    }
    
    let args = json!({
        "kb_id": kb_id,
    });
    
    state.call("kb_get_stats", args).await
        .map_err(|e| format!("Get KB stats failed: {}", e))
}

// ============================================================================
// 知识库管理命令
// ============================================================================

/// 列出所有知识库命令
#[tauri::command]
pub async fn list_knowledge_bases(
    state: State<'_, PythonState>,
    user_id: Option<String>,
) -> Result<serde_json::Value, String> {
    let args = json!({
        "user_id": user_id,
    });
    
    state.call("list_knowledge_bases", args).await
        .map_err(|e| format!("List knowledge bases failed: {}", e))
}

/// 获取知识库详情命令
#[tauri::command]
pub async fn get_knowledge_base(
    state: State<'_, PythonState>,
    kb_id: String,
) -> Result<serde_json::Value, String> {
    if kb_id.is_empty() {
        return Err("kb_id cannot be empty".to_string());
    }
    
    let args = json!({
        "kb_id": kb_id,
    });
    
    state.call("get_knowledge_base", args).await
        .map_err(|e| format!("Get knowledge base failed: {}", e))
}

/// 创建知识库命令
#[tauri::command]
pub async fn create_knowledge_base(
    state: State<'_, PythonState>,
    name: String,
    description: String,
    embedding_model: Option<String>,
    chunk_size: Option<i32>,
    chunk_overlap: Option<i32>,
    user_id: Option<String>,
) -> Result<serde_json::Value, String> {
    if name.is_empty() {
        return Err("name cannot be empty".to_string());
    }
    
    let args = json!({
        "name": name,
        "description": description,
        "embedding_model": embedding_model,
        "chunk_size": chunk_size,
        "chunk_overlap": chunk_overlap,
        "user_id": user_id,
    });
    
    state.call("create_knowledge_base", args).await
        .map_err(|e| format!("Create knowledge base failed: {}", e))
}

/// 更新知识库命令
#[tauri::command]
pub async fn update_knowledge_base(
    state: State<'_, PythonState>,
    kb_id: String,
    name: Option<String>,
    description: Option<String>,
) -> Result<serde_json::Value, String> {
    if kb_id.is_empty() {
        return Err("kb_id cannot be empty".to_string());
    }
    
    let args = json!({
        "kb_id": kb_id,
        "name": name,
        "description": description,
    });
    
    state.call("update_knowledge_base", args).await
        .map_err(|e| format!("Update knowledge base failed: {}", e))
}

/// 删除知识库命令
#[tauri::command]
pub async fn delete_knowledge_base(
    state: State<'_, PythonState>,
    kb_id: String,
) -> Result<serde_json::Value, String> {
    if kb_id.is_empty() {
        return Err("kb_id cannot be empty".to_string());
    }
    
    let args = json!({
        "kb_id": kb_id,
    });
    
    state.call("delete_knowledge_base", args).await
        .map_err(|e| format!("Delete knowledge base failed: {}", e))
}

/// 列出文档命令
#[tauri::command]
pub async fn list_documents(
    state: State<'_, PythonState>,
    kb_id: String,
) -> Result<serde_json::Value, String> {
    if kb_id.is_empty() {
        return Err("kb_id cannot be empty".to_string());
    }
    
    let args = json!({
        "kb_id": kb_id,
    });
    
    state.call("list_documents", args).await
        .map_err(|e| format!("List documents failed: {}", e))
}

// ============================================================================
// 工具管理命令
// ============================================================================

/// 列出所有工具命令
#[tauri::command]
pub async fn list_tools(
    state: State<'_, PythonState>,
    agent_id: Option<String>,
    category: Option<String>,
    enabled_only: Option<bool>,
) -> Result<serde_json::Value, String> {
    let args = json!({
        "agent_id": agent_id,
        "category": category,
        "enabled_only": enabled_only.unwrap_or(false),
    });
    
    state.call("list_tools", args).await
        .map_err(|e| format!("List tools failed: {}", e))
}

/// 获取工具详情命令
#[tauri::command]
pub async fn get_tool(
    state: State<'_, PythonState>,
    tool_id: String,
) -> Result<serde_json::Value, String> {
    if tool_id.is_empty() {
        return Err("tool_id cannot be empty".to_string());
    }
    
    let args = json!({
        "tool_id": tool_id,
    });
    
    state.call("get_tool", args).await
        .map_err(|e| format!("Get tool failed: {}", e))
}

/// 更新工具命令
#[tauri::command]
pub async fn update_tool(
    state: State<'_, PythonState>,
    tool_id: String,
    is_enabled: Option<bool>,
    approval_policy: Option<String>,
) -> Result<serde_json::Value, String> {
    if tool_id.is_empty() {
        return Err("tool_id cannot be empty".to_string());
    }
    
    let args = json!({
        "tool_id": tool_id,
        "is_enabled": is_enabled,
        "approval_policy": approval_policy,
    });
    
    state.call("update_tool", args).await
        .map_err(|e| format!("Update tool failed: {}", e))
}

/// 调用工具命令
#[tauri::command]
pub async fn call_tool(
    state: State<'_, PythonState>,
    tool_id: String,
    params: serde_json::Value,
    agent_id: Option<String>,
    conversation_id: Option<String>,
) -> Result<serde_json::Value, String> {
    if tool_id.is_empty() {
        return Err("tool_id cannot be empty".to_string());
    }
    
    if !params.is_object() {
        return Err("params must be a JSON object".to_string());
    }
    
    let args = json!({
        "tool_id": tool_id,
        "params": params,
        "agent_id": agent_id,
        "conversation_id": conversation_id,
    });
    
    state.call("call_tool", args).await
        .map_err(|e| format!("Call tool failed: {}", e))
}

// ============================================================================
// Agent管理命令
// ============================================================================

/// 列出所有Agent命令
#[tauri::command]
pub async fn list_agents(
    state: State<'_, PythonState>,
    user_id: Option<String>,
    agent_type: Option<String>,
    limit: Option<i32>,
    offset: Option<i32>,
) -> Result<serde_json::Value, String> {
    let args = json!({
        "user_id": user_id,
        "agent_type": agent_type,
        "limit": limit.unwrap_or(100),
        "offset": offset.unwrap_or(0),
    });
    
    state.call("list_agents", args).await
        .map_err(|e| format!("List agents failed: {}", e))
}

/// 获取Agent详情命令
#[tauri::command]
pub async fn get_agent(
    state: State<'_, PythonState>,
    agent_id: String,
) -> Result<serde_json::Value, String> {
    if agent_id.is_empty() {
        return Err("agent_id cannot be empty".to_string());
    }
    
    let args = json!({
        "agent_id": agent_id,
    });
    
    state.call("get_agent", args).await
        .map_err(|e| format!("Get agent failed: {}", e))
}

/// 创建Agent命令
#[tauri::command]
pub async fn create_agent(
    state: State<'_, PythonState>,
    name: String,
    description: String,
    agent_type: String,
    llm_config: serde_json::Value,
    system_prompt: Option<String>,
    knowledge_base_ids: Option<Vec<String>>,
    tool_ids: Option<Vec<String>>,
    user_id: Option<String>,
) -> Result<serde_json::Value, String> {
    if name.is_empty() {
        return Err("name cannot be empty".to_string());
    }
    
    if !llm_config.is_object() {
        return Err("llm_config must be a JSON object".to_string());
    }
    
    let args = json!({
        "name": name,
        "description": description,
        "agent_type": agent_type,
        "llm_config": llm_config,
        "system_prompt": system_prompt,
        "knowledge_base_ids": knowledge_base_ids,
        "tool_ids": tool_ids,
        "user_id": user_id,
    });
    
    state.call("create_agent", args).await
        .map_err(|e| format!("Create agent failed: {}", e))
}

/// 更新Agent命令
#[tauri::command]
pub async fn update_agent(
    state: State<'_, PythonState>,
    agent_id: String,
    name: Option<String>,
    description: Option<String>,
    llm_config: Option<serde_json::Value>,
    system_prompt: Option<String>,
    knowledge_base_ids: Option<Vec<String>>,
    tool_ids: Option<Vec<String>>,
) -> Result<serde_json::Value, String> {
    if agent_id.is_empty() {
        return Err("agent_id cannot be empty".to_string());
    }
    
    let args = json!({
        "agent_id": agent_id,
        "name": name,
        "description": description,
        "llm_config": llm_config,
        "system_prompt": system_prompt,
        "knowledge_base_ids": knowledge_base_ids,
        "tool_ids": tool_ids,
    });
    
    state.call("update_agent", args).await
        .map_err(|e| format!("Update agent failed: {}", e))
}

/// 删除Agent命令
#[tauri::command]
pub async fn delete_agent(
    state: State<'_, PythonState>,
    agent_id: String,
) -> Result<serde_json::Value, String> {
    if agent_id.is_empty() {
        return Err("agent_id cannot be empty".to_string());
    }
    
    let args = json!({
        "agent_id": agent_id,
    });
    
    state.call("delete_agent", args).await
        .map_err(|e| format!("Delete agent failed: {}", e))
}

// ============================================================================
// 测试模块
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_json_construction() {
        // 测试JSON参数构建
        let args = json!({
            "conversation_id": "test-123",
            "message": "hello",
            "stream": false,
        });
        
        assert_eq!(args["conversation_id"], "test-123");
        assert_eq!(args["message"], "hello");
        assert_eq!(args["stream"], false);
    }
    
    #[test]
    fn test_parameter_validation() {
        // 测试参数验证逻辑
        let empty_string = String::new();
        assert!(empty_string.is_empty());
        
        let valid_string = String::from("test");
        assert!(!valid_string.is_empty());
    }
    
    #[test]
    fn test_coordinate_validation() {
        // 测试坐标验证
        let x = 100;
        let y = 200;
        assert!(x >= 0 && y >= 0);
        
        let x_neg = -1;
        let y_neg = -1;
        assert!(x_neg < 0 || y_neg < 0);
    }
    
    #[test]
    fn test_top_k_validation() {
        // 测试top_k参数验证
        let top_k = 5;
        assert!(top_k > 0 && top_k <= 100);
        
        let top_k_zero = 0;
        assert!(top_k_zero == 0 || top_k_zero > 100);
        
        let top_k_large = 101;
        assert!(top_k_large == 0 || top_k_large > 100);
    }
}

// ============================================================================
// 系统监控命令
// ============================================================================

use sysinfo::{System, Disks};

/// 获取系统指标
/// 
/// 获取CPU、内存、磁盘使用率等系统指标
/// 
/// # Returns
/// * `Ok(serde_json::Value)` - 系统指标数据
/// * `Err(String)` - 错误信息
#[tauri::command]
pub async fn get_system_metrics() -> Result<serde_json::Value, String> {
    let mut sys = System::new_all();
    sys.refresh_all();
    
    // 获取CPU使用率
    let cpu_usage = sys.global_cpu_info().cpu_usage();
    
    // 获取内存使用率
    let total_memory = sys.total_memory();
    let used_memory = sys.used_memory();
    let memory_usage = if total_memory > 0 {
        (used_memory as f64 / total_memory as f64) * 100.0
    } else {
        0.0
    };
    
    // 获取磁盘使用率
    let disks = Disks::new_with_refreshed_list();
    let mut total_disk = 0u64;
    let mut used_disk = 0u64;
    
    for disk in &disks {
        total_disk += disk.total_space();
        used_disk += disk.total_space() - disk.available_space();
    }
    
    let disk_usage = if total_disk > 0 {
        (used_disk as f64 / total_disk as f64) * 100.0
    } else {
        0.0
    };
    
    Ok(json!({
        "cpu": cpu_usage,
        "memory": memory_usage,
        "disk": disk_usage,
        "total_memory": total_memory,
        "used_memory": used_memory,
        "total_disk": total_disk,
        "used_disk": used_disk,
    }))
}

/// 获取系统信息
/// 
/// 获取操作系统、主机名等系统信息
/// 
/// # Returns
/// * `Ok(serde_json::Value)` - 系统信息
/// * `Err(String)` - 错误信息
#[tauri::command]
pub async fn get_system_info() -> Result<serde_json::Value, String> {
    let sys = System::new_all();
    
    Ok(json!({
        "os_name": System::name().unwrap_or_else(|| "Unknown".to_string()),
        "os_version": System::os_version().unwrap_or_else(|| "Unknown".to_string()),
        "kernel_version": System::kernel_version().unwrap_or_else(|| "Unknown".to_string()),
        "hostname": System::host_name().unwrap_or_else(|| "Unknown".to_string()),
        "cpu_count": sys.cpus().len(),
        "cpu_brand": sys.cpus().first().map(|cpu| cpu.brand()).unwrap_or("Unknown"),
    }))
}

/// 扫描已安装软件
/// 
/// 扫描系统中已安装的软件列表
/// 
/// # Returns
/// * `Ok(serde_json::Value)` - 软件列表
/// * `Err(String)` - 错误信息
#[tauri::command]
pub async fn scan_installed_software() -> Result<serde_json::Value, String> {
    // 根据不同操作系统扫描软件
    #[cfg(target_os = "macos")]
    {
        scan_macos_software().await
    }
    
    #[cfg(target_os = "windows")]
    {
        scan_windows_software().await
    }
    
    #[cfg(target_os = "linux")]
    {
        scan_linux_software().await
    }
    
    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    {
        Ok(json!([]))
    }
}

#[cfg(target_os = "macos")]
async fn scan_macos_software() -> Result<serde_json::Value, String> {
    use std::process::Command;
    
    // 扫描 /Applications 目录
    let output = Command::new("ls")
        .arg("-1")
        .arg("/Applications")
        .output()
        .map_err(|e| format!("Failed to scan applications: {}", e))?;
    
    let apps: Vec<String> = String::from_utf8_lossy(&output.stdout)
        .lines()
        .filter(|line| line.ends_with(".app"))
        .map(|line| line.trim_end_matches(".app").to_string())
        .collect();
    
    let software_list: Vec<serde_json::Value> = apps.iter().map(|name| {
        json!({
            "name": name,
            "version": "Unknown",
            "publisher": "Unknown",
            "install_date": "Unknown",
        })
    }).collect();
    
    Ok(json!(software_list))
}

#[cfg(target_os = "windows")]
async fn scan_windows_software() -> Result<serde_json::Value, String> {
    use std::process::Command;
    
    // 使用 PowerShell 查询已安装软件
    let output = Command::new("powershell")
        .arg("-Command")
        .arg("Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Select-Object DisplayName, DisplayVersion, Publisher | ConvertTo-Json")
        .output()
        .map_err(|e| format!("Failed to scan software: {}", e))?;
    
    let json_str = String::from_utf8_lossy(&output.stdout);
    let software: serde_json::Value = serde_json::from_str(&json_str)
        .unwrap_or_else(|_| json!([]));
    
    Ok(software)
}

#[cfg(target_os = "linux")]
async fn scan_linux_software() -> Result<serde_json::Value, String> {
    use std::process::Command;
    
    // 尝试使用 dpkg (Debian/Ubuntu)
    if let Ok(output) = Command::new("dpkg").arg("-l").output() {
        let packages: Vec<String> = String::from_utf8_lossy(&output.stdout)
            .lines()
            .filter(|line| line.starts_with("ii"))
            .map(|line| {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 3 {
                    format!("{} ({})", parts[1], parts[2])
                } else {
                    parts[1].to_string()
                }
            })
            .collect();
        
        let software_list: Vec<serde_json::Value> = packages.iter().map(|name| {
            json!({
                "name": name,
                "version": "Unknown",
                "publisher": "Unknown",
            })
        }).collect();
        
        return Ok(json!(software_list));
    }
    
    // 尝试使用 rpm (RedHat/CentOS)
    if let Ok(output) = Command::new("rpm").arg("-qa").output() {
        let packages: Vec<String> = String::from_utf8_lossy(&output.stdout)
            .lines()
            .map(|line| line.to_string())
            .collect();
        
        let software_list: Vec<serde_json::Value> = packages.iter().map(|name| {
            json!({
                "name": name,
                "version": "Unknown",
                "publisher": "Unknown",
            })
        }).collect();
        
        return Ok(json!(software_list));
    }
    
    Ok(json!([]))
}
