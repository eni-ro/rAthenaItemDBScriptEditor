// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::Manager;
use std::process::Stdio;
use std::io::Write;

// ─── ファイル読み書き (エンコーディング対応) ─────────────────────────────────

fn decode_bytes(bytes: &[u8], encoding: &str) -> String {
    match encoding.to_lowercase().replace('-', "_").as_str() {
        "shift_jis" | "sjis" | "cp932" | "windows_31j" | "ms932" => {
            let (cow, _, _) = encoding_rs::SHIFT_JIS.decode(bytes);
            cow.into_owned()
        }
        "euc_jp" | "eucjp" => {
            let (cow, _, _) = encoding_rs::EUC_JP.decode(bytes);
            cow.into_owned()
        }
        _ => {
            // UTF-8 (with BOM strip)
            let bytes = if bytes.starts_with(&[0xEF, 0xBB, 0xBF]) { &bytes[3..] } else { bytes };
            String::from_utf8_lossy(bytes).into_owned()
        }
    }
}

fn encode_string(s: &str, encoding: &str) -> Vec<u8> {
    match encoding.to_lowercase().replace('-', "_").as_str() {
        "shift_jis" | "sjis" | "cp932" | "windows_31j" | "ms932" => {
            let (cow, _, _) = encoding_rs::SHIFT_JIS.encode(s);
            cow.into_owned()
        }
        "euc_jp" | "eucjp" => {
            let (cow, _, _) = encoding_rs::EUC_JP.encode(s);
            cow.into_owned()
        }
        _ => s.as_bytes().to_vec(),
    }
}

#[tauri::command]
fn read_file_raw(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| format!("{}: {}", path, e))
}

#[tauri::command]
fn read_file_encoded(path: String, encoding: String) -> Result<String, String> {
    let bytes = std::fs::read(&path).map_err(|e| format!("{}: {}", path, e))?;
    Ok(decode_bytes(&bytes, &encoding))
}

#[tauri::command]
fn write_file_raw(path: String, contents: String) -> Result<(), String> {
    std::fs::write(path, contents).map_err(|e| e.to_string())
}

#[tauri::command]
fn write_file_encoded(path: String, contents: String, encoding: String) -> Result<(), String> {
    let bytes = encode_string(&contents, &encoding);
    std::fs::write(path, bytes).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_exe_dir() -> Result<String, String> {
    let exe_path = std::env::current_exe().map_err(|e| e.to_string())?;
    let exe_dir = exe_path.parent().ok_or("Could not find parent")?;
    Ok(exe_dir.to_string_lossy().to_string())
}

// ─── db_processor.exe 呼び出し ────────────────────────────────────────────

/// db_processor.exe を子プロセスとして起動し、JSON を stdin で渡して stdout の結果を返す
/// spawn_blocking を使用してブロッキング処理を非同期コンテキストで安全に実行
#[tauri::command]
async fn invoke_db_processor(app: tauri::AppHandle, json_input: String) -> Result<String, String> {
    // db_processor.exe のパスを解決
    let exe_path = std::env::current_exe().map_err(|e| e.to_string())?;
    let exe_dir = exe_path.parent().ok_or("Could not find exe dir")?;

    let candidates: Vec<std::path::PathBuf> = vec![
        exe_dir.join("db_processor.exe"),
        exe_dir.join("binaries").join("db_processor.exe"),
    ];

    let dev_candidate = app
        .path()
        .resource_dir()
        .ok()
        .map(|d| d.join("binaries").join("db_processor.exe"));

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

    // blocking処理をspawn_blockingで実行（大きいファイルでもデッドロックしない）
    tauri::async_runtime::spawn_blocking(move || -> Result<String, String> {
        let mut child = std::process::Command::new(&sidecar_path)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to spawn db_processor at {:?}: {}", sidecar_path, e))?;

        // stdin に JSON を書き込む (take() でドロップ → EOF)
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
            return Err(format!(
                "db_processor produced no output. exit={}, stderr: {}",
                output.status.code().unwrap_or(-1),
                stderr
            ));
        }

        Ok(stdout)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            read_file_raw,
            read_file_encoded,
            write_file_raw,
            write_file_encoded,
            get_exe_dir,
            invoke_db_processor
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
