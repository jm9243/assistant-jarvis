use std::process::{Child, Command, Stdio};
use std::io::{BufRead, BufReader, Write};
use std::sync::{Arc, Mutex};
use std::thread;
use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// IPC请求结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IpcRequest {
    /// 请求唯一ID
    pub id: String,
    /// 要调用的函数名
    pub function: String,
    /// 函数参数
    pub args: serde_json::Value,
}

/// IPC响应结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IpcResponse {
    /// 对应请求的ID
    pub id: String,
    /// 是否成功
    pub success: bool,
    /// 成功时的结果
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result: Option<serde_json::Value>,
    /// 失败时的错误信息
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Python进程管理器
pub struct PythonProcess {
    /// 子进程句柄
    child: Option<Child>,
    /// stdin管道
    stdin: Option<std::process::ChildStdin>,
    /// 响应处理器映射表 (request_id -> oneshot sender)
    response_handlers: Arc<Mutex<HashMap<String, tokio::sync::oneshot::Sender<IpcResponse>>>>,
}

impl PythonProcess {
    /// 创建新的Python进程管理器实例
    pub fn new() -> Self {
        Self {
            child: None,
            stdin: None,
            response_handlers: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}

impl Default for PythonProcess {
    fn default() -> Self {
        Self::new()
    }
}

impl PythonProcess {
    /// 启动Python进程
    /// 
    /// # Arguments
    /// * `engine_path` - Python引擎可执行文件的路径或Python脚本路径
    /// 
    /// # Returns
    /// * `Ok(())` - 成功启动
    /// * `Err(String)` - 启动失败，包含错误信息
    pub fn start(&mut self, engine_path: &str) -> Result<(), String> {
        log::info!("Starting Python engine at: {}", engine_path);
        
        // 判断是Python脚本还是可执行文件
        let is_python_script = engine_path.ends_with(".py");
        
        // 启动Python进程，配置stdin/stdout管道
        let mut command = if is_python_script {
            // 如果是.py文件，使用Python解释器运行
            log::info!("Detected Python script, using Python interpreter");
            let mut cmd = Command::new("python3");
            cmd.arg(engine_path);
            cmd
        } else {
            // 如果是可执行文件，直接运行
            log::info!("Detected executable file, running directly");
            Command::new(engine_path)
        };
        
        let mut child = command
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| {
                if is_python_script {
                    format!("Failed to start Python process: {}. Please ensure Python 3.10+ is installed and in PATH.", e)
                } else {
                    format!("Failed to start Python process: {}", e)
                }
            })?;
        
        // 获取stdin管道
        let stdin = child.stdin.take()
            .ok_or("Failed to get stdin pipe")?;
        
        // 获取stdout管道
        let stdout = child.stdout.take()
            .ok_or("Failed to get stdout pipe")?;
        
        // 获取stderr管道用于日志输出
        let stderr = child.stderr.take()
            .ok_or("Failed to get stderr pipe")?;
        
        // 启动stderr读取线程（用于日志）
        thread::spawn(move || {
            let reader = BufReader::new(stderr);
            for line in reader.lines() {
                if let Ok(line) = line {
                    log::debug!("Python stderr: {}", line);
                }
            }
        });
        
        // 启动stdout响应处理线程
        let handlers = self.response_handlers.clone();
        thread::spawn(move || {
            let reader = BufReader::new(stdout);
            for line in reader.lines() {
                if let Ok(line) = line {
                    log::debug!("Received response: {}", line);
                    
                    // 解析JSON响应
                    match serde_json::from_str::<IpcResponse>(&line) {
                        Ok(response) => {
                            let response_id = response.id.clone();
                            
                            // 查找并移除对应的handler
                            let mut handlers_lock = handlers.lock().unwrap();
                            if let Some(sender) = handlers_lock.remove(&response_id) {
                                // 发送响应到等待的调用者
                                if sender.send(response).is_err() {
                                    log::warn!("Failed to send response for request {}", response_id);
                                }
                            } else {
                                log::warn!("No handler found for response ID: {}", response_id);
                            }
                        }
                        Err(e) => {
                            log::error!("Failed to parse response JSON: {} - Line: {}", e, line);
                        }
                    }
                }
            }
            log::info!("Response handler thread exited");
        });
        
        // 保存进程和stdin
        self.child = Some(child);
        self.stdin = Some(stdin);
        
        log::info!("Python engine started successfully");
        Ok(())
    }
    
    /// 停止Python进程
    /// 
    /// # Returns
    /// * `Ok(())` - 成功停止
    /// * `Err(String)` - 停止失败，包含错误信息
    pub fn stop(&mut self) -> Result<(), String> {
        log::info!("Stopping Python engine");
        
        if let Some(mut child) = self.child.take() {
            // 尝试优雅终止
            match child.kill() {
                Ok(_) => {
                    log::info!("Python engine stopped successfully");
                    // 清理stdin
                    self.stdin = None;
                    Ok(())
                }
                Err(e) => {
                    log::error!("Failed to stop Python engine: {}", e);
                    Err(format!("Failed to kill process: {}", e))
                }
            }
        } else {
            log::warn!("Python engine is not running");
            Err("Python process not started".to_string())
        }
    }
    
    /// 检查进程是否存活
    /// 
    /// # Returns
    /// * `true` - 进程正在运行
    /// * `false` - 进程未运行
    pub fn is_alive(&self) -> bool {
        self.child.is_some()
    }
}

impl PythonProcess {
    /// 调用Python引擎函数
    /// 
    /// # Arguments
    /// * `function` - 要调用的函数名
    /// * `args` - 函数参数（JSON格式）
    /// 
    /// # Returns
    /// * `Ok(serde_json::Value)` - 函数执行结果
    /// * `Err(String)` - 执行失败，包含错误信息
    pub async fn call(&mut self, function: &str, args: serde_json::Value) -> Result<serde_json::Value, String> {
        // 生成唯一请求ID
        let request_id = Uuid::new_v4().to_string();
        
        log::debug!("Calling function: {} with request ID: {}", function, request_id);
        
        // 创建响应channel
        let (tx, rx) = tokio::sync::oneshot::channel();
        
        // 注册响应handler
        {
            let mut handlers = self.response_handlers.lock().unwrap();
            handlers.insert(request_id.clone(), tx);
        }
        
        // 构建请求
        let request = IpcRequest {
            id: request_id.clone(),
            function: function.to_string(),
            args,
        };
        
        // 序列化请求为JSON
        let request_json = serde_json::to_string(&request)
            .map_err(|e| {
                // 清理handler
                let mut handlers = self.response_handlers.lock().unwrap();
                handlers.remove(&request_id);
                format!("Failed to serialize request: {}", e)
            })?;
        
        // 发送请求到stdin
        if let Some(stdin) = &mut self.stdin {
            writeln!(stdin, "{}", request_json)
                .map_err(|e| {
                    // 清理handler
                    let mut handlers = self.response_handlers.lock().unwrap();
                    handlers.remove(&request_id);
                    format!("Failed to write to stdin: {}", e)
                })?;
            
            stdin.flush()
                .map_err(|e| {
                    // 清理handler
                    let mut handlers = self.response_handlers.lock().unwrap();
                    handlers.remove(&request_id);
                    format!("Failed to flush stdin: {}", e)
                })?;
            
            log::debug!("Request sent: {}", request_json);
        } else {
            // 清理handler
            let mut handlers = self.response_handlers.lock().unwrap();
            handlers.remove(&request_id);
            return Err("Python process not started".to_string());
        }
        
        // 等待响应（30秒超时）
        let response = tokio::time::timeout(
            std::time::Duration::from_secs(30),
            rx
        ).await
            .map_err(|_| {
                // 超时，清理handler
                let mut handlers = self.response_handlers.lock().unwrap();
                handlers.remove(&request_id);
                log::error!("Request timeout for function: {}", function);
                format!("Request timeout after 30 seconds")
            })?
            .map_err(|_| {
                log::error!("Failed to receive response for function: {}", function);
                "Failed to receive response".to_string()
            })?;
        
        // 检查响应是否成功
        if response.success {
            log::debug!("Function {} executed successfully", function);
            Ok(response.result.unwrap_or(serde_json::Value::Null))
        } else {
            let error_msg = response.error.unwrap_or_else(|| "Unknown error".to_string());
            log::error!("Function {} failed: {}", function, error_msg);
            Err(error_msg)
        }
    }
}

impl PythonProcess {
    /// 重启Python进程
    /// 
    /// # Arguments
    /// * `engine_path` - Python引擎可执行文件的路径
    /// 
    /// # Returns
    /// * `Ok(())` - 成功重启
    /// * `Err(String)` - 重启失败，包含错误信息
    pub fn restart(&mut self, engine_path: &str) -> Result<(), String> {
        log::info!("Restarting Python engine");
        
        // 先停止现有进程（忽略错误）
        let _ = self.stop();
        
        // 清理所有待处理的响应handlers
        {
            let mut handlers = self.response_handlers.lock().unwrap();
            handlers.clear();
        }
        
        // 等待一小段时间确保进程完全终止
        std::thread::sleep(std::time::Duration::from_millis(100));
        
        // 启动新进程
        self.start(engine_path)?;
        
        log::info!("Python engine restarted successfully");
        Ok(())
    }
    
    /// 检查进程健康状态
    /// 
    /// # Returns
    /// * `true` - 进程健康
    /// * `false` - 进程不健康或已崩溃
    pub fn check_health(&mut self) -> bool {
        if let Some(child) = &mut self.child {
            // 尝试检查进程状态（非阻塞）
            match child.try_wait() {
                Ok(Some(status)) => {
                    // 进程已退出
                    log::warn!("Python process exited with status: {:?}", status);
                    self.child = None;
                    self.stdin = None;
                    false
                }
                Ok(None) => {
                    // 进程仍在运行
                    true
                }
                Err(e) => {
                    // 检查失败
                    log::error!("Failed to check process status: {}", e);
                    false
                }
            }
        } else {
            false
        }
    }
    
    /// 确保进程存活，如果崩溃则自动重启
    /// 
    /// # Arguments
    /// * `engine_path` - Python引擎可执行文件的路径
    /// 
    /// # Returns
    /// * `Ok(bool)` - true表示进程正常运行，false表示进行了重启
    /// * `Err(String)` - 重启失败，包含错误信息
    pub fn ensure_alive(&mut self, engine_path: &str) -> Result<bool, String> {
        if !self.check_health() {
            log::warn!("Python process is not healthy, attempting restart");
            self.restart(engine_path)?;
            Ok(false)
        } else {
            Ok(true)
        }
    }
}


#[cfg(test)]
mod tests {
    use super::*;
    
    // ===== IPC请求序列化测试 =====
    
    #[test]
    fn test_ipc_request_serialization() {
        let request = IpcRequest {
            id: "test-123".to_string(),
            function: "agent_chat".to_string(),
            args: serde_json::json!({"message": "hello"}),
        };
        
        let json = serde_json::to_string(&request).unwrap();
        assert!(json.contains("test-123"));
        assert!(json.contains("agent_chat"));
        assert!(json.contains("hello"));
    }
    
    #[test]
    fn test_ipc_request_with_complex_args() {
        let request = IpcRequest {
            id: "test-456".to_string(),
            function: "kb_search".to_string(),
            args: serde_json::json!({
                "kb_id": "kb_001",
                "query": "test query",
                "top_k": 5,
                "filters": {
                    "category": "docs"
                }
            }),
        };
        
        let json = serde_json::to_string(&request).unwrap();
        let parsed: IpcRequest = serde_json::from_str(&json).unwrap();
        
        assert_eq!(parsed.id, "test-456");
        assert_eq!(parsed.function, "kb_search");
        assert_eq!(parsed.args["kb_id"], "kb_001");
        assert_eq!(parsed.args["top_k"], 5);
    }
    
    #[test]
    fn test_ipc_request_with_empty_args() {
        let request = IpcRequest {
            id: "test-789".to_string(),
            function: "start_recording".to_string(),
            args: serde_json::json!({}),
        };
        
        let json = serde_json::to_string(&request).unwrap();
        assert!(json.contains("test-789"));
        assert!(json.contains("start_recording"));
    }
    
    // ===== IPC响应反序列化测试 =====
    
    #[test]
    fn test_ipc_response_deserialization() {
        let json = r#"{"id":"test-123","success":true,"result":{"message":"hello"}}"#;
        let response: IpcResponse = serde_json::from_str(json).unwrap();
        
        assert_eq!(response.id, "test-123");
        assert!(response.success);
        assert!(response.result.is_some());
        assert!(response.error.is_none());
    }
    
    #[test]
    fn test_ipc_response_error_deserialization() {
        let json = r#"{"id":"test-456","success":false,"error":"Something went wrong"}"#;
        let response: IpcResponse = serde_json::from_str(json).unwrap();
        
        assert_eq!(response.id, "test-456");
        assert!(!response.success);
        assert!(response.result.is_none());
        assert_eq!(response.error.unwrap(), "Something went wrong");
    }
    
    #[test]
    fn test_ipc_response_with_null_result() {
        let json = r#"{"id":"test-789","success":true}"#;
        let response: IpcResponse = serde_json::from_str(json).unwrap();
        
        assert_eq!(response.id, "test-789");
        assert!(response.success);
        // 当result字段不存在时，应该是None
        assert!(response.result.is_none());
    }
    
    #[test]
    fn test_ipc_response_with_array_result() {
        let json = r#"{"id":"test-101","success":true,"result":[1,2,3]}"#;
        let response: IpcResponse = serde_json::from_str(json).unwrap();
        
        assert_eq!(response.id, "test-101");
        assert!(response.success);
        assert!(response.result.is_some());
        
        if let Some(serde_json::Value::Array(arr)) = response.result {
            assert_eq!(arr.len(), 3);
        } else {
            panic!("Expected array result");
        }
    }
    
    #[test]
    fn test_ipc_response_serialization() {
        let response = IpcResponse {
            id: "test-202".to_string(),
            success: true,
            result: Some(serde_json::json!({"status": "ok"})),
            error: None,
        };
        
        let json = serde_json::to_string(&response).unwrap();
        assert!(json.contains("test-202"));
        assert!(json.contains("true"));
        assert!(json.contains("status"));
    }
    
    // ===== 进程管理器功能测试 =====
    
    #[test]
    fn test_python_process_creation() {
        let process = PythonProcess::new();
        assert!(!process.is_alive());
    }
    
    #[test]
    fn test_python_process_default() {
        let process = PythonProcess::default();
        assert!(!process.is_alive());
    }
    
    #[test]
    fn test_python_process_start_with_invalid_path() {
        let mut process = PythonProcess::new();
        let result = process.start("/invalid/path/to/engine");
        
        assert!(result.is_err());
        assert!(!process.is_alive());
    }
    
    #[test]
    fn test_python_process_stop_without_start() {
        let mut process = PythonProcess::new();
        let result = process.stop();
        
        assert!(result.is_err());
        assert!(!process.is_alive());
    }
    
    #[test]
    fn test_python_process_check_health_without_start() {
        let mut process = PythonProcess::new();
        let is_healthy = process.check_health();
        
        assert!(!is_healthy);
    }
    
    #[test]
    fn test_python_process_is_alive_initial_state() {
        let process = PythonProcess::new();
        assert!(!process.is_alive(), "New process should not be alive");
    }
    
    // ===== UUID生成测试 =====
    
    #[test]
    fn test_uuid_generation_uniqueness() {
        let id1 = Uuid::new_v4().to_string();
        let id2 = Uuid::new_v4().to_string();
        
        assert_ne!(id1, id2, "UUIDs should be unique");
        assert_eq!(id1.len(), 36, "UUID should be 36 characters");
        assert_eq!(id2.len(), 36, "UUID should be 36 characters");
    }
    
    // ===== 克隆和调试测试 =====
    
    #[test]
    fn test_ipc_request_clone() {
        let request = IpcRequest {
            id: "test-clone".to_string(),
            function: "test_func".to_string(),
            args: serde_json::json!({"key": "value"}),
        };
        
        let cloned = request.clone();
        
        assert_eq!(request.id, cloned.id);
        assert_eq!(request.function, cloned.function);
        assert_eq!(request.args, cloned.args);
    }
    
    #[test]
    fn test_ipc_response_clone() {
        let response = IpcResponse {
            id: "test-clone".to_string(),
            success: true,
            result: Some(serde_json::json!({"data": "test"})),
            error: None,
        };
        
        let cloned = response.clone();
        
        assert_eq!(response.id, cloned.id);
        assert_eq!(response.success, cloned.success);
        assert_eq!(response.result, cloned.result);
        assert_eq!(response.error, cloned.error);
    }
    
    #[test]
    fn test_ipc_request_debug() {
        let request = IpcRequest {
            id: "test-debug".to_string(),
            function: "test_func".to_string(),
            args: serde_json::json!({"key": "value"}),
        };
        
        let debug_str = format!("{:?}", request);
        assert!(debug_str.contains("test-debug"));
        assert!(debug_str.contains("test_func"));
    }
    
    #[test]
    fn test_ipc_response_debug() {
        let response = IpcResponse {
            id: "test-debug".to_string(),
            success: false,
            result: None,
            error: Some("Test error".to_string()),
        };
        
        let debug_str = format!("{:?}", response);
        assert!(debug_str.contains("test-debug"));
        assert!(debug_str.contains("false"));
        assert!(debug_str.contains("Test error"));
    }
}
