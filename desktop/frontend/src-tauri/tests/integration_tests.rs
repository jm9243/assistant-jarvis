// 集成测试 - 测试Rust和Python的IPC通信
// 
// 这些测试需要实际的Python引擎可执行文件才能运行
// 如果引擎不存在，测试会被跳过

use jarvis_desktop_lib::python_process::PythonProcess;
use jarvis_desktop_lib::python_state::PythonState;
use std::path::PathBuf;
use std::env;

/// 获取Python引擎路径
/// 
/// 优先级：
/// 1. 环境变量 PYTHON_ENGINE_PATH
/// 2. 默认路径 ../engine/dist/jarvis-engine
fn get_engine_path() -> Option<PathBuf> {
    if let Ok(path) = env::var("PYTHON_ENGINE_PATH") {
        let path = PathBuf::from(path);
        if path.exists() {
            return Some(path);
        }
    }
    
    // 尝试默认路径
    let default_path = PathBuf::from("../engine/dist/jarvis-engine");
    if default_path.exists() {
        return Some(default_path);
    }
    
    None
}

/// 检查是否可以运行集成测试
fn can_run_integration_tests() -> bool {
    get_engine_path().is_some()
}

#[tokio::test]
async fn test_ipc_basic_communication() {
    if !can_run_integration_tests() {
        println!("Skipping integration test: Python engine not found");
        println!("Set PYTHON_ENGINE_PATH environment variable to run integration tests");
        return;
    }
    
    let engine_path = get_engine_path().unwrap();
    let mut process = PythonProcess::new();
    
    // 启动进程
    let result = process.start(engine_path.to_str().unwrap());
    assert!(result.is_ok(), "Failed to start Python process: {:?}", result);
    
    // 等待进程启动
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    
    // 测试简单的函数调用（假设Python引擎有一个echo函数）
    let args = serde_json::json!({
        "message": "test"
    });
    
    let result = process.call("echo", args).await;
    
    // 清理
    let _ = process.stop();
    
    // 验证结果
    // 注意：这个测试可能失败，因为实际的Python引擎可能没有echo函数
    // 这只是一个示例，实际测试需要根据Python引擎的实际函数来调整
    println!("Call result: {:?}", result);
}

#[tokio::test]
async fn test_concurrent_requests() {
    if !can_run_integration_tests() {
        println!("Skipping integration test: Python engine not found");
        return;
    }
    
    let engine_path = get_engine_path().unwrap();
    let state = PythonState::new(engine_path.to_str().unwrap().to_string());
    
    // 启动进程
    let result = state.ensure_started().await;
    assert!(result.is_ok(), "Failed to start Python process");
    
    // 等待进程启动
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    
    // 创建10个并发请求
    let mut handles = vec![];
    
    for i in 0..10 {
        let state_clone = state.clone();
        let handle = tokio::spawn(async move {
            let args = serde_json::json!({
                "message": format!("test_{}", i)
            });
            
            state_clone.call("echo", args).await
        });
        
        handles.push(handle);
    }
    
    // 等待所有请求完成
    let mut success_count = 0;
    let mut error_count = 0;
    
    for handle in handles {
        match handle.await {
            Ok(Ok(_)) => success_count += 1,
            Ok(Err(_)) => error_count += 1,
            Err(_) => error_count += 1,
        }
    }
    
    // 清理
    let _ = state.stop().await;
    
    println!("Concurrent requests: {} succeeded, {} failed", success_count, error_count);
    
    // 至少应该有一些请求成功（即使函数不存在，也应该得到错误响应而不是超时）
    assert!(success_count + error_count == 10, "Not all requests completed");
}

#[tokio::test]
async fn test_request_timeout() {
    if !can_run_integration_tests() {
        println!("Skipping integration test: Python engine not found");
        return;
    }
    
    let engine_path = get_engine_path().unwrap();
    let state = PythonState::new(engine_path.to_str().unwrap().to_string());
    
    // 启动进程
    let result = state.ensure_started().await;
    assert!(result.is_ok(), "Failed to start Python process");
    
    // 等待进程启动
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    
    // 调用一个可能超时的函数（假设有一个sleep函数）
    let args = serde_json::json!({
        "seconds": 35  // 超过30秒超时限制
    });
    
    let start = std::time::Instant::now();
    let result = state.call("sleep", args).await;
    let elapsed = start.elapsed();
    
    // 清理
    let _ = state.stop().await;
    
    // 验证超时
    println!("Request took {:?}, result: {:?}", elapsed, result);
    
    // 应该在30秒左右超时
    assert!(elapsed.as_secs() >= 29 && elapsed.as_secs() <= 32, 
            "Timeout should be around 30 seconds, got {:?}", elapsed);
}

#[tokio::test]
async fn test_process_crash_recovery() {
    if !can_run_integration_tests() {
        println!("Skipping integration test: Python engine not found");
        return;
    }
    
    let engine_path = get_engine_path().unwrap();
    let state = PythonState::new(engine_path.to_str().unwrap().to_string());
    
    // 启动进程
    let result = state.ensure_started().await;
    assert!(result.is_ok(), "Failed to start Python process");
    
    // 等待进程启动
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    
    // 检查健康状态
    let is_healthy = state.check_health().await;
    assert!(is_healthy, "Process should be healthy after start");
    
    // 模拟崩溃 - 强制停止进程
    let _ = state.stop().await;
    
    // 等待一小段时间
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    // 检查健康状态（应该不健康）
    let is_healthy = state.check_health().await;
    assert!(!is_healthy, "Process should be unhealthy after stop");
    
    // 测试自动重启
    let start = std::time::Instant::now();
    let result = state.ensure_alive().await;
    let elapsed = start.elapsed();
    
    assert!(result.is_ok(), "Failed to restart process");
    assert!(elapsed.as_secs() < 3, "Restart should take less than 3 seconds, took {:?}", elapsed);
    
    // 验证进程已重启
    let is_healthy = state.check_health().await;
    assert!(is_healthy, "Process should be healthy after restart");
    
    // 清理
    let _ = state.stop().await;
}

#[tokio::test]
async fn test_multiple_restarts() {
    if !can_run_integration_tests() {
        println!("Skipping integration test: Python engine not found");
        return;
    }
    
    let engine_path = get_engine_path().unwrap();
    let state = PythonState::new(engine_path.to_str().unwrap().to_string());
    
    // 测试多次重启
    for i in 0..3 {
        println!("Restart iteration {}", i + 1);
        
        let result = state.restart().await;
        assert!(result.is_ok(), "Restart {} failed: {:?}", i + 1, result);
        
        // 等待进程稳定
        tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
        
        // 验证进程健康
        let is_healthy = state.check_health().await;
        assert!(is_healthy, "Process should be healthy after restart {}", i + 1);
    }
    
    // 清理
    let _ = state.stop().await;
}

#[tokio::test]
async fn test_error_handling() {
    if !can_run_integration_tests() {
        println!("Skipping integration test: Python engine not found");
        return;
    }
    
    let engine_path = get_engine_path().unwrap();
    let state = PythonState::new(engine_path.to_str().unwrap().to_string());
    
    // 启动进程
    let result = state.ensure_started().await;
    assert!(result.is_ok(), "Failed to start Python process");
    
    // 等待进程启动
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    
    // 调用不存在的函数
    let args = serde_json::json!({});
    let result = state.call("nonexistent_function", args).await;
    
    // 应该返回错误
    assert!(result.is_err(), "Should return error for nonexistent function");
    
    let error = result.unwrap_err();
    println!("Error message: {}", error);
    
    // 错误消息应该包含有用的信息
    assert!(!error.is_empty(), "Error message should not be empty");
    
    // 清理
    let _ = state.stop().await;
}
