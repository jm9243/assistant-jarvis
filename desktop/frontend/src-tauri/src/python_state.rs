use std::sync::Arc;
use tokio::sync::{Mutex, Semaphore};
use crate::python_process::PythonProcess;

/// Python引擎全局状态管理器
/// 
/// 负责管理Python进程的生命周期、请求队列和响应处理
/// 使用Arc<Mutex>实现线程安全的状态共享
#[derive(Clone)]
pub struct PythonState {
    /// Python进程管理器（线程安全）
    process: Arc<Mutex<PythonProcess>>,
    
    /// Python引擎可执行文件路径
    engine_path: String,
    
    /// 并发请求信号量（限制最大并发数为10）
    request_semaphore: Arc<Semaphore>,
}

impl PythonState {
    /// 创建新的Python状态管理器
    /// 
    /// # Arguments
    /// * `engine_path` - Python引擎可执行文件的路径
    /// 
    /// # Returns
    /// 新的PythonState实例
    pub fn new(engine_path: String) -> Self {
        log::info!("Creating PythonState with engine path: {}", engine_path);
        
        Self {
            process: Arc::new(Mutex::new(PythonProcess::new())),
            engine_path,
            // 创建信号量，允许最多10个并发请求
            request_semaphore: Arc::new(Semaphore::new(10)),
        }
    }
    
    /// 确保Python进程已启动
    /// 
    /// 如果进程未启动或已崩溃，会自动启动进程
    /// 
    /// # Returns
    /// * `Ok(())` - 进程正常运行
    /// * `Err(String)` - 启动失败，包含错误信息
    pub async fn ensure_started(&self) -> Result<(), String> {
        let mut process = self.process.lock().await;
        
        if !process.is_alive() {
            log::info!("Python process is not running, starting...");
            
            process.start(&self.engine_path)
                .map_err(|e| {
                    log::error!("Failed to start Python process: {}", e);
                    format!("Failed to start Python process: {}", e)
                })?;
            
            log::info!("Python process started successfully");
        }
        
        Ok(())
    }
    
    /// 停止Python进程
    /// 
    /// # Returns
    /// * `Ok(())` - 成功停止
    /// * `Err(String)` - 停止失败，包含错误信息
    pub async fn stop(&self) -> Result<(), String> {
        log::info!("Stopping Python process");
        
        let mut process = self.process.lock().await;
        
        process.stop()
            .map_err(|e| {
                log::error!("Failed to stop Python process: {}", e);
                format!("Failed to stop Python process: {}", e)
            })?;
        
        log::info!("Python process stopped successfully");
        Ok(())
    }
    
    /// 重启Python进程
    /// 
    /// # Returns
    /// * `Ok(())` - 成功重启
    /// * `Err(String)` - 重启失败，包含错误信息
    pub async fn restart(&self) -> Result<(), String> {
        log::info!("Restarting Python process");
        
        let mut process = self.process.lock().await;
        
        process.restart(&self.engine_path)
            .map_err(|e| {
                log::error!("Failed to restart Python process: {}", e);
                format!("Failed to restart Python process: {}", e)
            })?;
        
        log::info!("Python process restarted successfully");
        Ok(())
    }
    
    /// 检查进程健康状态
    /// 
    /// # Returns
    /// * `true` - 进程健康运行
    /// * `false` - 进程不健康或已崩溃
    pub async fn check_health(&self) -> bool {
        let mut process = self.process.lock().await;
        let is_healthy = process.check_health();
        
        if !is_healthy {
            log::warn!("Python process health check failed");
        }
        
        is_healthy
    }
    
    /// 确保进程存活，如果崩溃则自动重启
    /// 
    /// # Returns
    /// * `Ok(bool)` - true表示进程正常运行，false表示进行了重启
    /// * `Err(String)` - 重启失败，包含错误信息
    pub async fn ensure_alive(&self) -> Result<bool, String> {
        let mut process = self.process.lock().await;
        
        process.ensure_alive(&self.engine_path)
            .map_err(|e| {
                log::error!("Failed to ensure process alive: {}", e);
                format!("Failed to ensure process alive: {}", e)
            })
    }
    
    /// 获取引擎路径
    /// 
    /// # Returns
    /// 引擎可执行文件路径
    pub fn engine_path(&self) -> &str {
        &self.engine_path
    }
    
    /// 调用Python引擎函数（带并发控制和超时处理）
    /// 
    /// 此方法会自动管理并发请求数量，确保不超过10个并发请求
    /// 每个请求都有30秒超时限制，超时后会自动清理资源
    /// 
    /// # Arguments
    /// * `function` - 要调用的函数名
    /// * `args` - 函数参数（JSON格式）
    /// 
    /// # Returns
    /// * `Ok(serde_json::Value)` - 函数执行结果
    /// * `Err(String)` - 执行失败，包含错误信息
    pub async fn call(&self, function: &str, args: serde_json::Value) -> Result<serde_json::Value, String> {
        // 获取信号量许可（如果达到并发上限会等待）
        let _permit = self.request_semaphore.acquire().await
            .map_err(|e| {
                log::error!("Failed to acquire request permit: {}", e);
                format!("Failed to acquire request permit: {}", e)
            })?;
        
        log::debug!("Acquired request permit for function: {}", function);
        
        // 确保进程已启动
        self.ensure_started().await?;
        
        // 获取进程锁并调用函数（带30秒超时）
        let start_time = std::time::Instant::now();
        let mut process = self.process.lock().await;
        
        // 调用函数（内部已有30秒超时）
        let result = process.call(function, args).await;
        
        // 记录执行时间
        let elapsed = start_time.elapsed();
        
        match &result {
            Ok(_) => {
                log::debug!("Function {} completed in {:?}", function, elapsed);
            }
            Err(e) => {
                if e.contains("timeout") {
                    log::error!("Function {} timed out after {:?}: {}", function, elapsed, e);
                } else {
                    log::error!("Function {} failed after {:?}: {}", function, elapsed, e);
                }
            }
        }
        
        // permit会在这里自动释放（Drop trait）
        log::debug!("Released request permit for function: {}", function);
        
        result
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    // ===== 状态管理功能测试 =====
    
    #[test]
    fn test_python_state_creation() {
        let state = PythonState::new("/path/to/engine".to_string());
        assert_eq!(state.engine_path(), "/path/to/engine");
    }
    
    #[test]
    fn test_python_state_creation_with_empty_path() {
        let state = PythonState::new("".to_string());
        assert_eq!(state.engine_path(), "");
    }
    
    #[test]
    fn test_python_state_creation_with_relative_path() {
        let state = PythonState::new("./engine/jarvis-engine".to_string());
        assert_eq!(state.engine_path(), "./engine/jarvis-engine");
    }
    
    #[test]
    fn test_python_state_clone() {
        let state = PythonState::new("/path/to/engine".to_string());
        let cloned = state.clone();
        
        assert_eq!(state.engine_path(), cloned.engine_path());
    }
    
    // ===== 进程启动测试 =====
    
    #[tokio::test]
    async fn test_ensure_started_with_invalid_path() {
        let state = PythonState::new("/invalid/path/to/engine".to_string());
        let result = state.ensure_started().await;
        assert!(result.is_err());
        
        let error = result.unwrap_err();
        assert!(!error.is_empty());
    }
    
    #[tokio::test]
    async fn test_ensure_started_with_nonexistent_file() {
        let state = PythonState::new("/tmp/nonexistent_engine_12345".to_string());
        let result = state.ensure_started().await;
        assert!(result.is_err());
    }
    
    // ===== 进程停止测试 =====
    
    #[tokio::test]
    async fn test_stop_without_starting() {
        let state = PythonState::new("/path/to/engine".to_string());
        let result = state.stop().await;
        // 停止未启动的进程应该返回错误
        assert!(result.is_err());
    }
    
    #[tokio::test]
    async fn test_multiple_stop_calls() {
        let state = PythonState::new("/path/to/engine".to_string());
        
        // 第一次停止
        let result1 = state.stop().await;
        assert!(result1.is_err());
        
        // 第二次停止
        let result2 = state.stop().await;
        assert!(result2.is_err());
    }
    
    // ===== 健康检查测试 =====
    
    #[tokio::test]
    async fn test_check_health_without_process() {
        let state = PythonState::new("/path/to/engine".to_string());
        let is_healthy = state.check_health().await;
        assert!(!is_healthy);
    }
    
    #[tokio::test]
    async fn test_ensure_alive_without_process() {
        let state = PythonState::new("/invalid/path".to_string());
        let result = state.ensure_alive().await;
        // 应该尝试启动但失败
        assert!(result.is_err());
    }
    
    // ===== 重启测试 =====
    
    #[tokio::test]
    async fn test_restart_without_starting() {
        let state = PythonState::new("/invalid/path".to_string());
        let result = state.restart().await;
        // 重启未启动的进程应该尝试启动但失败
        assert!(result.is_err());
    }
    
    // ===== 调用测试 =====
    
    #[tokio::test]
    async fn test_call_without_starting() {
        let state = PythonState::new("/invalid/path".to_string());
        let args = serde_json::json!({"test": "value"});
        let result = state.call("test_function", args).await;
        
        // 应该尝试启动但失败
        assert!(result.is_err());
    }
    
    #[tokio::test]
    async fn test_call_with_empty_function_name() {
        let state = PythonState::new("/invalid/path".to_string());
        let args = serde_json::json!({});
        let result = state.call("", args).await;
        
        assert!(result.is_err());
    }
    
    #[tokio::test]
    async fn test_call_with_null_args() {
        let state = PythonState::new("/invalid/path".to_string());
        let args = serde_json::Value::Null;
        let result = state.call("test_function", args).await;
        
        assert!(result.is_err());
    }
    
    // ===== 并发控制测试 =====
    
    #[tokio::test]
    async fn test_concurrent_calls_with_invalid_process() {
        let state = PythonState::new("/invalid/path".to_string());
        
        // 创建多个并发调用
        let mut handles = vec![];
        
        for i in 0..5 {
            let state_clone = state.clone();
            let handle = tokio::spawn(async move {
                let args = serde_json::json!({"index": i});
                state_clone.call("test_function", args).await
            });
            handles.push(handle);
        }
        
        // 等待所有调用完成
        let mut error_count = 0;
        for handle in handles {
            if let Ok(result) = handle.await {
                if result.is_err() {
                    error_count += 1;
                }
            }
        }
        
        // 所有调用都应该失败（因为进程无效）
        assert_eq!(error_count, 5);
    }
    
    // ===== 路径处理测试 =====
    
    #[test]
    fn test_engine_path_getter() {
        let path = "/usr/local/bin/jarvis-engine";
        let state = PythonState::new(path.to_string());
        
        assert_eq!(state.engine_path(), path);
    }
    
    #[test]
    fn test_engine_path_with_spaces() {
        let path = "/path with spaces/jarvis-engine";
        let state = PythonState::new(path.to_string());
        
        assert_eq!(state.engine_path(), path);
    }
    
    #[test]
    fn test_engine_path_with_unicode() {
        let path = "/路径/jarvis-engine";
        let state = PythonState::new(path.to_string());
        
        assert_eq!(state.engine_path(), path);
    }
}
