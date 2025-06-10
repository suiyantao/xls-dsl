use deno_core::error::AnyError;
use deno_core::url::Url;
use lazy_static::lazy_static;
use tauri::WebviewWindow;
use std::cell::RefCell;
use std::rc::Rc;
use std::sync::Arc;
use std::sync::Mutex;

use crate::dao::models::RunLog;
use crate::dao::models::XlsFile;
use tauri::Emitter;

use super::funs::runjs;

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



pub(crate) async fn run_js(code: String) -> Result<(), AnyError> {
    let main_module = Url::parse("file://")?;

    let mut js_runtime = deno_core::JsRuntime::new(deno_core::RuntimeOptions {
        module_loader: Some(Rc::new(deno_core::FsModuleLoader)),
        extensions: vec![runjs::init_ops_and_esm()],
        ..Default::default()
    });

    let mod_id = js_runtime
        .load_main_es_module_from_code(&main_module, code)
        .await?;

    let result = js_runtime.mod_evaluate(mod_id);
    js_runtime.run_event_loop(Default::default()).await?;
    result.await
}

pub struct DenoRuntime {
    file: XlsFile,
}

impl DenoRuntime {
    pub fn new(file: XlsFile) -> Self {
        Self { file }
    }
    pub async fn run_script(&self) -> Result<(), AnyError> {
        // 执行脚本
        // 这里可以添加脚本执行的逻辑
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
