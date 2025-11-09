#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

use commands::{
    secure_store_get, secure_store_remove, secure_store_set, start_engine, stop_engine, EngineState,
    SecureStoreState,
};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|_, _, _| {}))
        .manage(EngineState::default())
        .manage(SecureStoreState::new())
        .invoke_handler(tauri::generate_handler![
            start_engine,
            stop_engine,
            secure_store_set,
            secure_store_get,
            secure_store_remove
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
