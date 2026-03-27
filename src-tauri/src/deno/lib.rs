use deno_core::error::AnyError;
use deno_core::url::Url;
use lazy_static::lazy_static;
use std::fs;
use std::path::PathBuf;
use std::time::SystemTime;
use std::time::UNIX_EPOCH;
use tauri::WebviewWindow;
use std::cell::RefCell;
use std::rc::Rc;
use std::sync::Arc;
use std::sync::Mutex;

use crate::dao::models::RunLog;
use crate::dao::models::XlsFile;
use tauri::Emitter;

use super::funs::runjs;
use super::loader::EsmShModuleLoader;
use super::loader::LoaderConfig;

thread_local! {
    pub static XLS_PATH: RefCell<String> = RefCell::new(String::new());
}

lazy_static! {
    pub static ref WINDOW: Arc<Mutex<Option<WebviewWindow>>> = Arc::new(Mutex::new(None));
}

pub(crate) fn emit_log(event: &str, log: RunLog) {
    if let Some(w) = WINDOW.lock().unwrap().as_ref() {
        w.emit(event, log)
           .unwrap();
    }
}

fn default_loader_config() -> Result<LoaderConfig, AnyError> {
    let cache_dir = dirs::cache_dir()
        .unwrap_or_else(|| std::env::temp_dir().join("xls-dsl"))
        .join("esm-sh");

    Ok(LoaderConfig {
        base_url: Url::parse("https://esm.sh/")?,
        cache_dir,
    })
}

fn script_base_dir() -> PathBuf {
    XLS_PATH.with(|path| {
        let current = path.borrow().clone();
        if current.is_empty() {
            return std::env::temp_dir();
        }

        PathBuf::from(current)
            .parent()
            .map(|parent| parent.to_path_buf())
            .unwrap_or_else(std::env::temp_dir)
    })
}

fn write_temporary_main_module(code: &str) -> Result<PathBuf, AnyError> {
    let base_dir = script_base_dir();
    fs::create_dir_all(&base_dir)?;

    let unique = SystemTime::now()
        .duration_since(UNIX_EPOCH)?
        .as_nanos();
    let file_path = base_dir.join(format!(".xls-dsl-main-{unique}.ts"));
    fs::write(&file_path, code)?;
    Ok(file_path)
}

async fn run_js_with_config(code: String, config: LoaderConfig) -> Result<(), AnyError> {
    let main_module_path = write_temporary_main_module(&code)?;
    let main_module = Url::from_file_path(&main_module_path)
        .map_err(|_| AnyError::msg(format!("invalid main module path: {}", main_module_path.display())))?;
    let loader = Rc::new(EsmShModuleLoader::new(config));

    let mut js_runtime = deno_core::JsRuntime::new(deno_core::RuntimeOptions {
        module_loader: Some(loader),
        extensions: vec![runjs::init_ops_and_esm()],
        ..Default::default()
    });

    let result = async {
        let mod_id = js_runtime.load_main_es_module(&main_module).await?;
        let evaluation = js_runtime.mod_evaluate(mod_id);
        js_runtime.run_event_loop(Default::default()).await?;
        evaluation.await
    }
    .await;

    let _ = fs::remove_file(&main_module_path);
    result
}

pub(crate) async fn run_js(code: String) -> Result<(), AnyError> {
    run_js_with_config(code, default_loader_config()?).await
}

#[cfg(test)]
async fn run_js_with_loader_config(code: String, config: LoaderConfig) -> Result<(), AnyError> {
    run_js_with_config(code, config).await
}

pub struct DenoRuntime {
    file: XlsFile,
}

impl DenoRuntime {
    pub fn new(file: XlsFile) -> Self {
        Self { file }
    }
    pub async fn run_script(&self) -> Result<(), AnyError> {
        println!("Running script...");

        XLS_PATH.with(|path| {
            let mut path = path.borrow_mut();
            *path = self.file.xlx_template.clone();
        });

        let result = run_js(self.file.code.clone()).await;

        match result {
            Ok(_) => {
                println!("Successfully executed JavaScript");
                emit_log("println", RunLog::result("".to_string()));
            }
            Err(err) => {
                eprintln!("Error executing JavaScript: {}", err);
                emit_log("println", RunLog::error(format!("{:?}", err)));
            }
        }
        Ok(())
    }
}

#[tokio::test]
async fn test_deno_runtime() {
    let file = XlsFile {
        id: 1,
        name: "test".to_string(),
        xlx_template: "test.xlsx".to_string(),
        code: r#"
const res = await http.get("http://www.baidu.com")
console.log(res);"#.to_string(),
        created_date: None,
        updated_date: None,
    };

    let deno_runtime = DenoRuntime::new(file);
    deno_runtime.run_script().await.unwrap();
}

#[tokio::test]
async fn local_runtime_still_executes_inline_code() {
    run_js(r#"console.log("ok");"#.to_string())
        .await
        .unwrap();
}

#[tokio::test]
async fn main_typescript_script_executes_successfully() {
    run_js(
        r#"
const name: string = "ok";
console.log(name);
"#
        .to_string(),
    )
    .await
    .unwrap();
}

#[tokio::test]
async fn main_typescript_script_imports_local_ts_dependency() {
    let unique = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let base_dir = std::env::temp_dir().join(format!("xls-dsl-ts-local-{unique}"));
    fs::create_dir_all(&base_dir).unwrap();
    fs::write(base_dir.join("dep.ts"), "export const value: string = 'ok';\n").unwrap();

    XLS_PATH.with(|path| {
        *path.borrow_mut() = base_dir.join("template.xlsx").display().to_string();
    });

    let result = run_js(
        r#"
import { value } from "./dep.ts";
console.log(value);
"#
        .to_string(),
    )
    .await;

    XLS_PATH.with(|path| {
        path.borrow_mut().clear();
    });
    let _ = fs::remove_dir_all(&base_dir);

    result.unwrap();
}

#[tokio::test]
async fn main_typescript_script_imports_local_js_dependency() {
    let unique = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let base_dir = std::env::temp_dir().join(format!("xls-dsl-js-local-{unique}"));
    fs::create_dir_all(&base_dir).unwrap();
    fs::write(base_dir.join("dep.js"), "export const value = 'ok';\n").unwrap();

    XLS_PATH.with(|path| {
        *path.borrow_mut() = base_dir.join("template.xlsx").display().to_string();
    });

    let result = run_js(
        r#"
import { value } from "./dep.js";
console.log(value);
"#
        .to_string(),
    )
    .await;

    XLS_PATH.with(|path| {
        path.borrow_mut().clear();
    });
    let _ = fs::remove_dir_all(&base_dir);

    result.unwrap();
}

#[tokio::test]
async fn main_typescript_script_imports_nested_local_ts_dependency() {
    let unique = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let base_dir = std::env::temp_dir().join(format!("xls-dsl-nested-ts-{unique}"));
    fs::create_dir_all(base_dir.join("nested")).unwrap();
    fs::write(
        base_dir.join("dep.ts"),
        "import { nestedValue } from './nested/child.ts';\nexport const value: string = nestedValue;\n",
    )
    .unwrap();
    fs::write(
        base_dir.join("nested/child.ts"),
        "export const nestedValue: string = 'ok';\n",
    )
    .unwrap();

    XLS_PATH.with(|path| {
        *path.borrow_mut() = base_dir.join("template.xlsx").display().to_string();
    });

    let result = run_js(
        r#"
import { value } from "./dep.ts";
console.log(value);
"#
        .to_string(),
    )
    .await;

    XLS_PATH.with(|path| {
        path.borrow_mut().clear();
    });
    let _ = fs::remove_dir_all(&base_dir);

    result.unwrap();
}

#[tokio::test]
async fn temporary_main_ts_file_is_cleaned_up_on_error() {
    let unique = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let base_dir = std::env::temp_dir().join(format!("xls-dsl-ts-cleanup-{unique}"));
    fs::create_dir_all(&base_dir).unwrap();

    XLS_PATH.with(|path| {
        *path.borrow_mut() = base_dir.join("template.xlsx").display().to_string();
    });

    let result = run_js(
        r#"
const broken: = "oops";
"#
        .to_string(),
    )
    .await;

    XLS_PATH.with(|path| {
        path.borrow_mut().clear();
    });

    let leftover = fs::read_dir(&base_dir)
        .unwrap()
        .filter_map(|entry| entry.ok())
        .map(|entry| entry.file_name().to_string_lossy().to_string())
        .collect::<Vec<_>>();

    let _ = fs::remove_dir_all(&base_dir);

    assert!(result.is_err(), "expected TypeScript parse failure");
    assert!(
        leftover.iter().all(|name| !name.starts_with(".xls-dsl-main-")),
        "temporary main module files were not cleaned up: {leftover:?}"
    );
}

#[tokio::test]
async fn main_typescript_script_reports_transpile_error() {
    let err = run_js(
        r#"
const broken: = "oops";
"#
        .to_string(),
    )
    .await
    .unwrap_err();

    let message = err.to_string();
    assert!(message.contains(".ts") || message.contains("inline.ts"), "unexpected error: {message}");
}

#[tokio::test]
async fn pkg_import_rejects_empty_name_before_loader() {
    let err = run_js(r#"await pkg.import("", "4.17.21");"#.to_string())
        .await
        .unwrap_err();

    assert!(
        err.to_string()
            .contains("pkg.import requires name and version"),
        "unexpected error: {err}"
    );
}

#[tokio::test]
async fn pkg_import_rejects_empty_version_before_loader() {
    let err = run_js(r#"await pkg.import("lodash", "");"#.to_string())
        .await
        .unwrap_err();

    assert!(
        err.to_string()
            .contains("pkg.import requires name and version"),
        "unexpected error: {err}"
    );
}

#[tokio::test]
async fn error_rejects_invalid_package_name() {
    for invalid_name in [
        "bad name",
        "http://esm.sh/lodash",
        "/lodash",
        "../lodash",
        "@scope//pkg",
        "lodash//fp",
    ] {
        let err = run_js(format!(r#"await pkg.import({invalid_name:?}, "4.17.21");"#))
            .await
            .unwrap_err();

        assert!(
            err.to_string()
                .contains("pkg.import received invalid package name"),
            "unexpected error for {invalid_name}: {err}"
        );
    }
}

#[tokio::test]
async fn error_reports_http_status_with_url() {
    use std::io::Read;
    use std::io::Write;
    use std::net::TcpListener;
    use std::thread;
    use std::time::SystemTime;
    use std::time::UNIX_EPOCH;

    let listener = TcpListener::bind("127.0.0.1:0").unwrap();
    let addr = listener.local_addr().unwrap();
    let base_url = format!("http://{addr}");
    let request_url = format!("{base_url}/lodash@4.17.21");
    let handle = thread::spawn(move || {
        let (mut stream, _) = listener.accept().unwrap();
        let mut request = [0_u8; 1024];
        let bytes_read = stream.read(&mut request).unwrap();
        let request_text = String::from_utf8_lossy(&request[..bytes_read]);
        assert!(
            request_text.starts_with("GET /lodash@4.17.21 HTTP/1.1"),
            "unexpected request: {request_text}"
        );

        let body = "not found";
        let response = format!(
            "HTTP/1.1 404 Not Found\r\nContent-Type: text/plain\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
            body.len()
        );
        stream.write_all(response.as_bytes()).unwrap();
    });

    let unique = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let cache_dir = std::env::temp_dir().join(format!("esm-sh-cache-error-test-{unique}"));

    let err = run_js_with_loader_config(
        format!(
            r#"
globalThis.__pkgBaseUrl = "{base_url}";
await pkg.import("lodash", "4.17.21");
"#
        ),
        LoaderConfig {
            base_url: Url::parse(&format!("{base_url}/")).unwrap(),
            cache_dir: cache_dir.clone(),
        },
    )
    .await
    .unwrap_err();

    assert!(
        err.to_string()
            .contains(&format!("failed to fetch module {request_url}: HTTP 404 Not Found")),
        "unexpected error: {err}"
    );

    let _ = std::fs::remove_dir_all(cache_dir);
    handle.join().unwrap();
}

#[tokio::test]
async fn pkg_import_valid_args_reaches_loader_load() {
    use std::io::Read;
    use std::io::Write;
    use std::net::TcpListener;
    use std::path::PathBuf;
    use std::thread;

    let listener = TcpListener::bind("127.0.0.1:0").unwrap();
    let addr = listener.local_addr().unwrap();
    let base_url = format!("http://{addr}");
    let handle = thread::spawn(move || {
        let (mut stream, _) = listener.accept().unwrap();
        let mut request = [0_u8; 1024];
        let bytes_read = stream.read(&mut request).unwrap();
        let request_text = String::from_utf8_lossy(&request[..bytes_read]);
        assert!(
            request_text.starts_with("GET /lodash@4.17.21 HTTP/1.1"),
            "unexpected request: {request_text}"
        );

        let body = "export const answer = 42;";
        let response = format!(
            "HTTP/1.1 200 OK\r\nContent-Type: application/javascript\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
            body.len()
        );
        stream.write_all(response.as_bytes()).unwrap();
    });

    run_js_with_loader_config(
        format!(
            r#"
globalThis.__pkgBaseUrl = "{base_url}";
const mod = await pkg.import("lodash", "4.17.21");
if (mod.answer !== 42) {{
  throw new Error(`unexpected answer: ${{mod.answer}}`);
}}
"#
        ),
        LoaderConfig {
            base_url: Url::parse(&format!("{base_url}/")).unwrap(),
            cache_dir: PathBuf::from("/tmp/esm-sh-cache"),
        },
    )
    .await
    .unwrap();

    handle.join().unwrap();
}

#[tokio::test]
async fn lodash_chunk_executes_via_pkg_import() {
    use std::collections::HashMap;
    use std::io::Read;
    use std::io::Write;
    use std::net::TcpListener;
    use std::thread;
    use std::time::SystemTime;
    use std::time::UNIX_EPOCH;

    let listener = TcpListener::bind("127.0.0.1:0").unwrap();
    let addr = listener.local_addr().unwrap();
    let base_url = format!("http://{addr}");
    let handle = thread::spawn(move || {
        let responses = HashMap::from([
            (
                "/lodash@4.17.21",
                r#"export { chunk } from "/lodash@4.17.21/chunk.js";"#,
            ),
            (
                "/lodash@4.17.21/chunk.js",
                r#"export function chunk(items, size) {
  const result = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}"#,
            ),
        ]);

        for _ in 0..responses.len() {
            let (mut stream, _) = listener.accept().unwrap();
            let mut request = [0_u8; 1024];
            let bytes_read = stream.read(&mut request).unwrap();
            let request_text = String::from_utf8_lossy(&request[..bytes_read]);
            let request_line = request_text.lines().next().unwrap_or_default();
            let path = request_line.split_whitespace().nth(1).unwrap_or_default();
            let body = responses.get(path).unwrap_or_else(|| panic!("unexpected request: {request_text}"));
            let response = format!(
                "HTTP/1.1 200 OK\r\nContent-Type: application/javascript\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
                body.len()
            );
            stream.write_all(response.as_bytes()).unwrap();
        }
    });

    let unique = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let cache_dir = std::env::temp_dir().join(format!("esm-sh-cache-e2e-test-{unique}"));

    let result = run_js_with_loader_config(
        format!(
            r#"
globalThis.__pkgBaseUrl = "{base_url}";
const mod = await pkg.import("lodash", "4.17.21");
const result = mod.chunk([1, 2, 3, 4], 2);
if (JSON.stringify(result) !== JSON.stringify([[1, 2], [3, 4]])) {{
  throw new Error(`unexpected chunk result: ${{JSON.stringify(result)}}`);
}}
"#
        ),
        LoaderConfig {
            base_url: Url::parse(&format!("{base_url}/")).unwrap(),
            cache_dir: cache_dir.clone(),
        },
    )
    .await;

    let _ = std::fs::remove_dir_all(cache_dir);
    handle.join().unwrap();

    result.unwrap();
}
