use deno_core::error::AnyError;
use deno_core::url::Url;
use std::collections::HashMap;
use std::rc::Rc;
use std::sync::Mutex;

use crate::dao::models::XlsFile;
use crate::dao::models::RunLog;
use crate::handler::APP;

use super::funs::runjs;

lazy_static::lazy_static! {
    pub static ref PATH:Mutex<HashMap<String, String>> = {
        let map = HashMap::new();
        Mutex::new(map)
    };
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

        PATH.lock()
            .unwrap()
            .insert("path".to_string(), self.file.xlx_template.clone());

        let result = run_js(self.file.code.clone()).await;

        match result {
            Ok(_) => {
                println!("Successfully executed JavaScript");
                if let Some(w) = APP.lock().unwrap().get("window") {
                    w.emit("println", RunLog::result("".to_string())).unwrap();
                }
            }
            Err(err) => {
                eprintln!("Error executing JavaScript: {}", err);
                if let Some(w) = APP.lock().unwrap().get("window") {
                    w.emit("println", RunLog::error(format!("{:?}", err)))
                        .unwrap();
                }
            }
        }
        Ok(())
    }
}
