use std::{collections::HashMap, path::PathBuf, process::Child, process::Command};

use parking_lot::Mutex;
use tauri::State;

pub struct EngineState {
    child: Mutex<Option<Child>>,
}

impl Default for EngineState {
    fn default() -> Self {
        Self { child: Mutex::new(None) }
    }
}

pub struct SecureStoreState {
    store: Mutex<HashMap<String, String>>,
    file: PathBuf,
}

impl SecureStoreState {
    pub fn new() -> Self {
        let dir = dirs::home_dir().unwrap_or_else(|| PathBuf::from("."));
        let file = dir.join(".jarvis").join("secure.json");
        if let Some(parent) = file.parent() {
            let _ = std::fs::create_dir_all(parent);
        }
        let data = std::fs::read(&file)
            .ok()
            .and_then(|bytes| serde_json::from_slice::<HashMap<String, String>>(&bytes).ok())
            .unwrap_or_default();
        Self {
            store: Mutex::new(data),
            file,
        }
    }

    fn persist(&self) {
        if let Ok(contents) = serde_json::to_vec_pretty(&*self.store.lock()) {
            let _ = std::fs::write(&self.file, contents);
        }
    }
}

#[tauri::command]
pub async fn start_engine(state: State<'_, EngineState>) -> Result<(), String> {
    let mut guard = state.child.lock();
    if guard.is_some() {
        return Ok(());
    }
    let current = std::env::current_dir().map_err(|e| e.to_string())?;
    let engine_path = current.join("..").join("engine").join("main.py");
    let python = if cfg!(target_os = "windows") { "python" } else { "python3" };
    let child = Command::new(python)
        .arg(engine_path)
        .spawn()
        .map_err(|e| e.to_string())?;
    *guard = Some(child);
    Ok(())
}

#[tauri::command]
pub async fn stop_engine(state: State<'_, EngineState>) -> Result<(), String> {
    let mut guard = state.child.lock();
    if let Some(mut child) = guard.take() {
        let _ = child.kill();
    }
    Ok(())
}

#[tauri::command]
pub async fn secure_store_set(key: String, value: String, state: State<'_, SecureStoreState>) -> Result<(), String> {
    state.store.lock().insert(key, value);
    state.persist();
    Ok(())
}

#[tauri::command]
pub async fn secure_store_get(key: String, state: State<'_, SecureStoreState>) -> Result<Option<String>, String> {
    Ok(state.store.lock().get(&key).cloned())
}

#[tauri::command]
pub async fn secure_store_remove(key: String, state: State<'_, SecureStoreState>) -> Result<(), String> {
    state.store.lock().remove(&key);
    state.persist();
    Ok(())
}
