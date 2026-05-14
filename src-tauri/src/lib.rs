#[tauri::command]
fn write_file(path: String, content: String) -> Result<(), String> {
  std::fs::write(path, content).map_err(|e| e.to_string())
}

#[tauri::command]
fn read_file_binary(path: String) -> Result<Vec<u8>, String> {
  std::fs::read(path).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      app.handle().plugin(tauri_plugin_clipboard_manager::init())?;
      app.handle().plugin(tauri_plugin_fs::init())?;
      app.handle().plugin(tauri_plugin_dialog::init())?;
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![write_file, read_file_binary])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
