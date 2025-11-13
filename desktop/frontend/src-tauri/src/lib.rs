use tauri::Manager;
use std::path::PathBuf;

pub mod python_process;
pub mod python_state;
mod commands;

use python_state::PythonState;

// 辅助函数：查找Python引擎可执行文件路径
fn find_engine_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    // 获取资源目录路径
    let resource_path = app_handle
        .path()
        .resource_dir()
        .map_err(|e| format!("Failed to get resource dir: {}", e))?;
    
    // 尝试多个可能的引擎路径
    let mut possible_paths = vec![
        // 打包后的路径 - daemon可执行文件
        resource_path.join("engine").join("jarvis-engine"),
        // 打包后的路径 - Windows
        resource_path.join("engine").join("jarvis-engine.exe"),
    ];
    
    // 开发模式：尝试查找daemon.py
    #[cfg(debug_assertions)]
    {
        // 方法1: 从当前工作目录查找
        if let Ok(cwd) = std::env::current_dir() {
            // 尝试 ../engine/daemon.py (从frontend目录)
            possible_paths.push(cwd.join("..").join("engine").join("daemon.py"));
            // 尝试 ../../engine/daemon.py (从frontend/src-tauri目录)
            possible_paths.push(cwd.join("..").join("..").join("engine").join("daemon.py"));
            // 尝试 engine/daemon.py (从desktop目录)
            possible_paths.push(cwd.join("engine").join("daemon.py"));
        }
        
        // 方法2: 从可执行文件路径查找
        if let Ok(exe) = std::env::current_exe() {
            if let Some(exe_dir) = exe.parent() {
                // 从target/debug向上查找
                if let Some(target_dir) = exe_dir.parent() {
                    if let Some(src_tauri_dir) = target_dir.parent() {
                        if let Some(frontend_dir) = src_tauri_dir.parent() {
                            if let Some(desktop_dir) = frontend_dir.parent() {
                                possible_paths.push(desktop_dir.join("engine").join("daemon.py"));
                            }
                        }
                    }
                }
            }
        }
        
        // 方法3: 使用环境变量
        if let Ok(engine_path) = std::env::var("JARVIS_ENGINE_PATH") {
            possible_paths.push(PathBuf::from(engine_path));
        }
    }

    // 尝试所有可能的路径
    for path in &possible_paths {
        log::debug!("Checking engine path: {:?}", path);
        if path.exists() {
            log::info!("Found engine at: {:?}", path);
            return Ok(path.clone());
        }
    }

    // 如果都找不到，返回详细的错误信息
    let paths_str = possible_paths
        .iter()
        .map(|p| format!("  - {:?}", p))
        .collect::<Vec<_>>()
        .join("\n");
    
    Err(format!(
        "Engine not found. Tried the following paths:\n{}\n\nPlease ensure:\n1. In development: Run from desktop/ directory\n2. In production: Engine is bundled in resources/engine/",
        paths_str
    ))
}

// Tauri命令：检查引擎健康状态
#[tauri::command]
async fn check_engine_health(state: tauri::State<'_, PythonState>) -> Result<bool, String> {
    Ok(state.check_health().await)
}

// Tauri命令：重启Python引擎
#[tauri::command]
async fn restart_engine(state: tauri::State<'_, PythonState>) -> Result<(), String> {
    state.restart().await
}

// Tauri命令：保存到系统密钥库
#[tauri::command]
async fn save_to_keychain(service: String, account: String, password: String) -> Result<(), String> {
    use keyring::Entry;

    match Entry::new(&service, &account) {
        Ok(entry) => match entry.set_password(&password) {
            Ok(_) => Ok(()),
            Err(e) => Err(format!("Failed to save password: {}", e)),
        },
        Err(e) => Err(format!("Failed to create keyring entry: {}", e)),
    }
}

// Tauri命令：从系统密钥库读取
#[tauri::command]
async fn get_from_keychain(service: String, account: String) -> Result<String, String> {
    use keyring::Entry;

    match Entry::new(&service, &account) {
        Ok(entry) => match entry.get_password() {
            Ok(password) => Ok(password),
            Err(e) => Err(format!("Failed to get password: {}", e)),
        },
        Err(e) => Err(format!("Failed to create keyring entry: {}", e)),
    }
}

// Tauri命令：请求系统权限
#[tauri::command]
async fn request_permission(_permission: String) -> Result<bool, String> {
    // TODO: 实现实际的权限请求逻辑
    // macOS: 辅助功能、屏幕录制等
    // Windows: 管理员权限等
    Ok(true)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 初始化日志
    env_logger::init();
    
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            // 引擎管理命令
            check_engine_health,
            restart_engine,
            // 密钥库命令
            save_to_keychain,
            get_from_keychain,
            // 权限命令
            request_permission,
            // Agent对话命令
            commands::agent_chat,
            commands::create_conversation,
            commands::get_conversation_history,
            // Agent管理命令
            commands::list_agents,
            commands::get_agent,
            commands::create_agent,
            commands::update_agent,
            commands::delete_agent,
            // 知识库检索命令
            commands::kb_search,
            commands::kb_add_document,
            commands::kb_delete_document,
            commands::kb_get_stats,
            // 知识库管理命令
            commands::list_knowledge_bases,
            commands::get_knowledge_base,
            commands::create_knowledge_base,
            commands::update_knowledge_base,
            commands::delete_knowledge_base,
            commands::list_documents,
            // 工具管理命令
            commands::list_tools,
            commands::get_tool,
            commands::update_tool,
            commands::call_tool,
            // GUI自动化命令
            commands::locate_element,
            commands::click_element,
            commands::input_text,
            // 工作流命令
            commands::execute_workflow,
            commands::pause_workflow,
            commands::resume_workflow,
            commands::cancel_workflow,
            // 录制器命令
            commands::start_recording,
            commands::stop_recording,
            commands::pause_recording,
            commands::resume_recording,
            commands::get_recording_status,
            // 系统监控命令
            commands::get_system_metrics,
            commands::get_system_info,
            commands::scan_installed_software,
        ])
        .setup(|app| {
            log::info!("Jarvis Desktop is starting...");
            
            // 查找Python引擎路径
            let engine_path = find_engine_path(&app.handle())?;
            log::info!("Engine path: {:?}", engine_path);
            
            // 初始化PythonState
            let python_state = PythonState::new(
                engine_path.to_str()
                    .ok_or("Invalid engine path")?
                    .to_string()
            );
            
            // 注册PythonState到Tauri状态管理
            app.manage(python_state);
            
            // 自动启动Python引擎
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let state = app_handle.state::<PythonState>();
                
                log::info!("Starting Python engine...");
                
                // 给Tauri一点时间完成初始化
                tokio::time::sleep(std::time::Duration::from_millis(500)).await;
                
                match state.ensure_started().await {
                    Ok(_) => {
                        log::info!("Python engine started successfully");
                    }
                    Err(e) => {
                        log::error!("Failed to start Python engine: {}", e);
                        // 在生产模式下，启动失败是严重错误
                        #[cfg(not(debug_assertions))]
                        {
                            eprintln!("FATAL: Failed to start Python engine: {}", e);
                        }
                        // 在开发模式下，也打印错误但不退出
                        #[cfg(debug_assertions)]
                        {
                            eprintln!("ERROR: Failed to start Python engine: {}", e);
                            eprintln!("Please ensure:");
                            eprintln!("1. Python 3.10+ is installed");
                            eprintln!("2. Run 'cd engine && pip install -r requirements.txt'");
                            eprintln!("3. Run from desktop/ directory");
                        }
                    }
                }
            });
            
            // 启动健康检查任务（每30秒检查一次）
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let mut interval = tokio::time::interval(std::time::Duration::from_secs(30));
                
                loop {
                    interval.tick().await;
                    
                    let state = app_handle.state::<PythonState>();
                    
                    match state.ensure_alive().await {
                        Ok(was_alive) => {
                            if !was_alive {
                                log::warn!("Python engine was restarted by health check");
                            }
                        }
                        Err(e) => {
                            log::error!("Health check failed: {}", e);
                        }
                    }
                }
            });
            
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                log::info!("Window is closing, cleaning up...");
                
                // 停止Python引擎
                let state = window.state::<PythonState>();
                let state_clone = state.inner().clone();
                
                // 在新的异步任务中停止引擎
                tauri::async_runtime::block_on(async move {
                    match state_clone.stop().await {
                        Ok(_) => {
                            log::info!("Python engine stopped successfully");
                        }
                        Err(e) => {
                            log::error!("Failed to stop Python engine: {}", e);
                        }
                    }
                });
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
