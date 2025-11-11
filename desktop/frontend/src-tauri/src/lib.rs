use tauri::Manager;
use std::process::{Child, Command};
use std::sync::Mutex;

// 引擎进程状态
struct EngineState {
    process: Option<Child>,
}

// Tauri命令：启动Python引擎
#[tauri::command]
async fn start_engine(app_handle: tauri::AppHandle, state: tauri::State<'_, Mutex<EngineState>>) -> Result<(), String> {
    let mut engine_state = state.lock().unwrap();

    if engine_state.process.is_some() {
        return Err("Engine is already running".to_string());
    }

    // 获取资源目录路径
    let resource_path = app_handle
        .path()
        .resource_dir()
        .map_err(|e| format!("Failed to get resource dir: {}", e))?;
    
    // 尝试多个可能的引擎路径
    let possible_paths = vec![
        // 打包后的路径
        resource_path.join("engine").join("main.py"),
        // 开发模式路径
        std::env::current_exe()
            .ok()
            .and_then(|exe| exe.parent().map(|p| p.to_path_buf()))
            .and_then(|p| p.parent().map(|p| p.to_path_buf()))
            .and_then(|p| p.parent().map(|p| p.to_path_buf()))
            .and_then(|p| p.parent().map(|p| p.to_path_buf()))
            .and_then(|p| p.parent().map(|p| p.to_path_buf()))
            .map(|p| p.join("engine").join("main.py"))
            .unwrap_or_default(),
    ];

    let mut engine_path = None;
    for path in possible_paths {
        if path.exists() {
            engine_path = Some(path);
            break;
        }
    }

    let engine_path = engine_path.ok_or("Engine not found. Please make sure the engine directory exists.")?;
    
    println!("Engine path: {:?}", engine_path);

    // 获取引擎目录
    let engine_dir = engine_path.parent()
        .ok_or("Failed to get engine directory")?;

    // 尝试使用启动脚本（打包后）或直接运行Python（开发模式）
    let start_script = if cfg!(target_os = "windows") {
        engine_dir.join("start.bat")
    } else {
        engine_dir.join("start.sh")
    };

    let child = if start_script.exists() {
        // 使用启动脚本
        println!("Using start script: {:?}", start_script);
        if cfg!(target_os = "windows") {
            Command::new("cmd")
                .args(&["/C", start_script.to_str().unwrap()])
                .current_dir(engine_dir)
                .spawn()
        } else {
            Command::new("sh")
                .arg(&start_script)
                .current_dir(engine_dir)
                .spawn()
        }
    } else {
        // 直接运行Python
        println!("Running Python directly");
        let python_cmd = if cfg!(target_os = "windows") { "python" } else { "python3" };
        Command::new(python_cmd)
            .arg(&engine_path)
            .current_dir(engine_dir)
            .spawn()
    };

    match child {
        Ok(process) => {
            engine_state.process = Some(process);
            println!("Python engine started successfully");
            Ok(())
        }
        Err(e) => {
            eprintln!("Failed to start engine: {}", e);
            Err(format!("Failed to start engine: {}. Make sure Python 3 is installed.", e))
        }
    }
}

// Tauri命令：停止Python引擎
#[tauri::command]
async fn stop_engine(state: tauri::State<'_, Mutex<EngineState>>) -> Result<(), String> {
    let mut engine_state = state.lock().unwrap();

    if let Some(mut process) = engine_state.process.take() {
        match process.kill() {
            Ok(_) => Ok(()),
            Err(e) => Err(format!("Failed to stop engine: {}", e)),
        }
    } else {
        Err("Engine is not running".to_string())
    }
}

// Tauri命令：检查引擎状态
#[tauri::command]
async fn check_engine_status(state: tauri::State<'_, Mutex<EngineState>>) -> Result<bool, String> {
    let engine_state = state.lock().unwrap();
    Ok(engine_state.process.is_some())
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
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(Mutex::new(EngineState { process: None }))
        .invoke_handler(tauri::generate_handler![
            start_engine,
            stop_engine,
            check_engine_status,
            save_to_keychain,
            get_from_keychain,
            request_permission,
        ])
        .setup(|_app| {
            // 应用启动时的初始化逻辑
            println!("Jarvis Desktop is starting...");
            
            #[cfg(not(debug_assertions))]
            {
                // 生产模式：自动启动 engine
                println!("Production mode: Auto-starting engine...");
                let app_handle = _app.handle().clone();
                tauri::async_runtime::spawn(async move {
                    // 获取 state 需要在 async 块内部
                    let state = app_handle.state::<Mutex<EngineState>>();
                    if let Err(e) = start_engine(app_handle.clone(), state).await {
                        eprintln!("Failed to auto-start engine: {}", e);
                    }
                });
            }
            
            #[cfg(debug_assertions)]
            {
                // 开发模式：不自动启动，由 npm start 管理
                println!("Development mode: Engine should be started via npm start");
            }
            
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                // 窗口关闭时清理资源
                println!("Window is closing, cleaning up...");
                
                // 停止 Python 引擎
                let state = window.state::<Mutex<EngineState>>();
                let mut engine_state = state.lock().unwrap();
                
                if let Some(mut process) = engine_state.process.take() {
                    println!("Stopping Python engine...");
                    let _ = process.kill();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
