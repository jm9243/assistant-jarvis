// 性能测试 - 测试系统性能指标
// 
// 这些测试验证系统是否满足性能要求：
// - 进程启动成功率 100%
// - 进程崩溃自动重启 < 3秒
// - 并发10个请求无阻塞
// - 请求超时正确处理

use jarvis_desktop_lib::python_process::PythonProcess;
use jarvis_desktop_lib::python_state::PythonState;
use std::path::PathBuf;
use std::env;
use std::time::{Duration, Instant};

/// 获取Python引擎路径
fn get_engine_path() -> Option<PathBuf> {
    if let Ok(path) = env::var("PYTHON_ENGINE_PATH") {
        let path = PathBuf::from(path);
        if path.exists() {
            return Some(path);
        }
    }
    
    let default_path = PathBuf::from("../engine/dist/jarvis-engine");
    if default_path.exists() {
        return Some(default_path);
    }
    
    None
}

fn can_run_performance_tests() -> bool {
    get_engine_path().is_some()
}

#[tokio::test]
async fn test_process_startup_success_rate() {
    if !can_run_performance_tests() {
        println!("Skipping performance test: Python engine not found");
        return;
    }
    
    let engine_path = get_engine_path().unwrap();
    let engine_path_str = engine_path.to_str().unwrap();
    
    println!("Testing process startup success rate (10 attempts)...");
    
    let mut success_count = 0;
    let mut total_time = Duration::ZERO;
    
    for i in 0..10 {
        let mut process = PythonProcess::new();
        
        let start = Instant::now();
        let result = process.start(engine_path_str);
        let elapsed = start.elapsed();
        
        if result.is_ok() {
            success_count += 1;
            total_time += elapsed;
            
            println!("Attempt {}: Success in {:?}", i + 1, elapsed);
            
            // 等待一小段时间确保进程稳定
            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
            
            // 清理
            let _ = process.stop();
        } else {
            println!("Attempt {}: Failed - {:?}", i + 1, result);
        }
        
        // 等待一小段时间再进行下一次尝试
        tokio::time::sleep(tokio::time::Duration::from_millis(200)).await;
    }
    
    let success_rate = (success_count as f64 / 10.0) * 100.0;
    let avg_time = total_time / success_count.max(1);
    
    println!("\n=== Process Startup Performance ===");
    println!("Success rate: {:.1}%", success_rate);
    println!("Average startup time: {:?}", avg_time);
    println!("Requirement: 100% success rate");
    
    // 验证：成功率应该是100%
    assert_eq!(success_count, 10, 
               "Process startup success rate should be 100%, got {}/10", success_count);
}

#[tokio::test]
async fn test_process_restart_time() {
    if !can_run_performance_tests() {
        println!("Skipping performance test: Python engine not found");
        return;
    }
    
    let engine_path = get_engine_path().unwrap();
    let state = PythonState::new(engine_path.to_str().unwrap().to_string());
    
    println!("Testing process restart time (5 restarts)...");
    
    let mut restart_times = Vec::new();
    
    for i in 0..5 {
        let start = Instant::now();
        let result = state.restart().await;
        let elapsed = start.elapsed();
        
        assert!(result.is_ok(), "Restart {} failed: {:?}", i + 1, result);
        
        restart_times.push(elapsed);
        println!("Restart {}: {:?}", i + 1, elapsed);
        
        // 等待进程稳定
        tokio::time::sleep(tokio::time::Duration::from_millis(200)).await;
    }
    
    // 计算统计数据
    let max_time = restart_times.iter().max().unwrap();
    let avg_time = restart_times.iter().sum::<Duration>() / restart_times.len() as u32;
    
    println!("\n=== Process Restart Performance ===");
    println!("Average restart time: {:?}", avg_time);
    println!("Maximum restart time: {:?}", max_time);
    println!("Requirement: < 3 seconds");
    
    // 清理
    let _ = state.stop().await;
    
    // 验证：所有重启都应该在3秒内完成
    for (i, time) in restart_times.iter().enumerate() {
        assert!(time.as_secs() < 3, 
                "Restart {} took {:?}, should be < 3 seconds", i + 1, time);
    }
}

#[tokio::test]
async fn test_concurrent_requests_no_blocking() {
    if !can_run_performance_tests() {
        println!("Skipping performance test: Python engine not found");
        return;
    }
    
    let engine_path = get_engine_path().unwrap();
    let state = PythonState::new(engine_path.to_str().unwrap().to_string());
    
    // 启动进程
    let result = state.ensure_started().await;
    assert!(result.is_ok(), "Failed to start Python process");
    
    // 等待进程启动
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    
    println!("Testing concurrent requests (10 concurrent)...");
    
    let start = Instant::now();
    
    // 创建10个并发请求
    let mut handles = vec![];
    
    for i in 0..10 {
        let state_clone = state.clone();
        let handle = tokio::spawn(async move {
            let request_start = Instant::now();
            
            let args = serde_json::json!({
                "message": format!("concurrent_test_{}", i)
            });
            
            let result = state_clone.call("echo", args).await;
            let request_time = request_start.elapsed();
            
            (i, result, request_time)
        });
        
        handles.push(handle);
    }
    
    // 等待所有请求完成
    let mut results = Vec::new();
    
    for handle in handles {
        match handle.await {
            Ok(result) => results.push(result),
            Err(e) => println!("Task join error: {:?}", e),
        }
    }
    
    let total_time = start.elapsed();
    
    // 统计结果
    let success_count = results.iter().filter(|(_, r, _)| r.is_ok()).count();
    let error_count = results.len() - success_count;
    
    let request_times: Vec<Duration> = results.iter().map(|(_, _, t)| *t).collect();
    let max_request_time = request_times.iter().max().unwrap_or(&Duration::ZERO);
    let avg_request_time = request_times.iter().sum::<Duration>() / request_times.len().max(1) as u32;
    
    println!("\n=== Concurrent Request Performance ===");
    println!("Total time for 10 concurrent requests: {:?}", total_time);
    println!("Successful requests: {}", success_count);
    println!("Failed requests: {}", error_count);
    println!("Average request time: {:?}", avg_request_time);
    println!("Maximum request time: {:?}", max_request_time);
    println!("Requirement: No blocking, all requests should complete");
    
    // 清理
    let _ = state.stop().await;
    
    // 验证：所有请求都应该完成（成功或失败都可以，但不应该阻塞）
    assert_eq!(results.len(), 10, "All 10 requests should complete");
    
    // 验证：总时间不应该是单个请求时间的10倍（说明有并发）
    // 如果是串行执行，总时间会接近 avg_request_time * 10
    // 如果是并发执行，总时间应该接近 max_request_time
    let serial_time = avg_request_time * 10;
    println!("Serial execution would take: {:?}", serial_time);
    println!("Actual time: {:?}", total_time);
    
    // 并发执行应该比串行快至少5倍
    assert!(total_time < serial_time / 5, 
            "Concurrent execution should be much faster than serial");
}

#[tokio::test]
async fn test_request_timeout_handling() {
    if !can_run_performance_tests() {
        println!("Skipping performance test: Python engine not found");
        return;
    }
    
    let engine_path = get_engine_path().unwrap();
    let state = PythonState::new(engine_path.to_str().unwrap().to_string());
    
    // 启动进程
    let result = state.ensure_started().await;
    assert!(result.is_ok(), "Failed to start Python process");
    
    // 等待进程启动
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    
    println!("Testing request timeout handling...");
    
    // 调用一个可能超时的函数
    let args = serde_json::json!({
        "seconds": 35  // 超过30秒超时限制
    });
    
    let start = Instant::now();
    let result = state.call("sleep", args).await;
    let elapsed = start.elapsed();
    
    println!("\n=== Request Timeout Performance ===");
    println!("Request time: {:?}", elapsed);
    println!("Result: {:?}", result);
    println!("Requirement: Timeout at 30 seconds");
    
    // 清理
    let _ = state.stop().await;
    
    // 验证：应该在30秒左右超时（允许±2秒误差）
    assert!(elapsed.as_secs() >= 28 && elapsed.as_secs() <= 32, 
            "Timeout should be around 30 seconds, got {:?}", elapsed);
    
    // 验证：应该返回错误
    assert!(result.is_err(), "Should return error on timeout");
    
    // 验证：错误消息应该包含"timeout"
    if let Err(error) = result {
        assert!(error.to_lowercase().contains("timeout"), 
                "Error message should mention timeout, got: {}", error);
    }
}

#[tokio::test]
async fn test_process_startup_time() {
    if !can_run_performance_tests() {
        println!("Skipping performance test: Python engine not found");
        return;
    }
    
    let engine_path = get_engine_path().unwrap();
    
    println!("Testing process startup time (single measurement)...");
    
    let mut process = PythonProcess::new();
    
    let start = Instant::now();
    let result = process.start(engine_path.to_str().unwrap());
    let elapsed = start.elapsed();
    
    assert!(result.is_ok(), "Failed to start process: {:?}", result);
    
    println!("\n=== Process Startup Time ===");
    println!("Startup time: {:?}", elapsed);
    println!("Requirement: < 2 seconds");
    
    // 清理
    let _ = process.stop();
    
    // 验证：启动时间应该小于2秒
    assert!(elapsed.as_secs() < 2, 
            "Process startup should take < 2 seconds, took {:?}", elapsed);
}

#[tokio::test]
async fn test_memory_usage() {
    if !can_run_performance_tests() {
        println!("Skipping performance test: Python engine not found");
        return;
    }
    
    let engine_path = get_engine_path().unwrap();
    let state = PythonState::new(engine_path.to_str().unwrap().to_string());
    
    // 启动进程
    let result = state.ensure_started().await;
    assert!(result.is_ok(), "Failed to start Python process");
    
    // 等待进程启动并稳定
    tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
    
    println!("Testing memory usage...");
    println!("Note: This test only verifies the process is running.");
    println!("Actual memory usage should be verified using system tools.");
    println!("Requirement: < 100MB in idle state");
    
    // 验证进程健康
    let is_healthy = state.check_health().await;
    assert!(is_healthy, "Process should be healthy");
    
    // 清理
    let _ = state.stop().await;
    
    println!("\n=== Memory Usage ===");
    println!("Process is running and healthy");
    println!("Use system monitoring tools to verify memory usage < 100MB");
}
