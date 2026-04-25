// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::Manager;
use std::process::Stdio;
use std::io::Write;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn read_file_raw(path: String) -> Result<String, String> {
    std::fs::read_to_string(path).map_err(|e| e.to_string())
}

#[tauri::command]
fn write_file_raw(path: String, contents: String) -> Result<(), String> {
    std::fs::write(path, contents).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_exe_dir() -> Result<String, String> {
    let exe_path = std::env::current_exe().map_err(|e| e.to_string())?;
    let exe_dir = exe_path.parent().ok_or("Could not find parent")?;
    Ok(exe_dir.to_string_lossy().to_string())
}

/// db_processor.exe を子プロセスとして起動し、JSON を stdin で渡して stdout の結果を返す
#[tauri::command]
async fn invoke_db_processor(app: tauri::AppHandle, json_input: String) -> Result<String, String> {
    // 実行ファイルと同じ場所の binaries/ を探す
    let exe_path = std::env::current_exe().map_err(|e| e.to_string())?;
    let exe_dir = exe_path.parent().ok_or("Could not find exe dir")?;

    // db_processor.exe の候補パス (複数箇所を探す)
    let candidates: Vec<std::path::PathBuf> = vec![
        exe_dir.join("db_processor.exe"),
        exe_dir.join("binaries").join("db_processor.exe"),
    ];

    // dev 環境: src-tauri/target/debug から見て ../../binaries/
    let dev_candidate = if let Ok(resource_dir) = app.path().resource_dir() {
        Some(resource_dir.join("binaries").join("db_processor.exe"))
    } else {
        None
    };

    let sidecar_path = candidates
        .iter()
        .find(|p: &&std::path::PathBuf| p.exists())
        .cloned()
        .or_else(|| dev_candidate.filter(|p| p.exists()))
        .ok_or_else(|| {
            let searched: Vec<String> = candidates
                .iter()
                .map(|p: &std::path::PathBuf| p.display().to_string())
                .collect();
            format!("db_processor.exe not found. Searched: {:?}", searched)
        })?;

    // std::process::Command で stdin に JSON を渡す
    let mut child = std::process::Command::new(&sidecar_path)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn db_processor at {:?}: {}", sidecar_path, e))?;

    if let Some(mut stdin) = child.stdin.take() {
        stdin
            .write_all(json_input.as_bytes())
            .map_err(|e| format!("Failed to write stdin: {}", e))?;
    }

    let output = child
        .wait_with_output()
        .map_err(|e| format!("Failed to wait for db_processor: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    if stdout.trim().is_empty() {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        return Err(format!("db_processor produced no output. stderr: {}", stderr));
    }

    Ok(stdout)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            read_file_raw,
            write_file_raw,
            get_exe_dir,
            invoke_db_processor
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
