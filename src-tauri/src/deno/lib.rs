use deno_core::error::AnyError;
use deno_core::extension;
use deno_core::op2;
use deno_core::url::Url;
use sonyflake::Sonyflake;
use std::collections::HashMap;
use std::fs;
use std::fs::File;
use std::io::BufReader;
use std::path::Path;
use std::rc::Rc;
use std::sync::Mutex;

use crate::dao::models::XlsFile;
use crate::dao::models::RunLog;
use crate::handler::APP;
use crate::parse_xls::lib::ParseXls;
use std::io::Write;
use std::io::BufRead;

lazy_static::lazy_static! {
    static ref PATH:Mutex<HashMap<String, String>> = {
        let map = HashMap::new();
        Mutex::new(map)
    };

    static ref SNOW_ID:Mutex<Sonyflake> = {
        Mutex::new(Sonyflake::new().unwrap())
    };
}

#[op2(async)]
#[serde]
async fn op_read_xls(#[string] mut path: String) -> Result<serde_json::Value, AnyError> {
   
    if path == ""  {
        path = PATH.lock().unwrap().get("path").unwrap().clone();
    }

    let mut parse = ParseXls { xls_path: path };

    let res = parse.read_all();

    match res {
        Ok(v) => {
            return Ok(v);
        }
        Err(e) => {
            return Err(AnyError::from(e));
        }
    }
}

#[op2]
#[string]
fn op_read_file(#[string] path: String) -> Result<String, AnyError> {
    let contents = fs::read_to_string(path);
    match contents  {
        Ok(c) => {
            return Ok(c);
        }
        Err(e) => {
            return Err(AnyError::from(e));
        }
    }
}

#[op2(fast)]
fn op_write_file(#[string] path: String, #[string] contents: String) -> Result<(), AnyError> {
    match fs::write(path, contents){
        Ok(_) => {
            return Ok(());
        }
        Err(e) => {
            return Err(AnyError::from(e));
        }
    }
}
#[op2(fast)]
fn op_remove_file(#[string] path: String) -> Result<(), AnyError> {
    std::fs::remove_file(path)?;
    Ok(())
}

#[op2(fast)]
fn println(#[string] str: String) -> Result<(), AnyError> {
    if let Some(w) = APP.lock().unwrap().get("window") {
        w.emit("println", RunLog::log(str)).unwrap();
    }
    Ok(())
}

#[op2(fast)]
fn eprintln(#[string] str: String) -> Result<(), AnyError> {
    if let Some(w) = APP.lock().unwrap().get("window") {
        w.emit("println", RunLog::error(str)).unwrap();
    }
    Ok(())
}

#[op2]
#[string]
fn op_md5(#[string] str: String) -> Result<String, AnyError> {
    let res: String = format!("{:x}", md5::compute(str));
    Ok(res)
}

#[op2]
#[string]
fn op_uuid() -> Result<String, AnyError> {
    let uuid = uuid::Uuid::new_v4().to_string();
    Ok(uuid)
}

#[op2]
#[string]
fn op_snowid() -> Result<String, AnyError> {
    let binding = SNOW_ID.lock().unwrap();
    let id = binding.next_id().unwrap();
    Ok(id.to_string())
}

#[op2(fast)]
fn op_file_create(#[string] file: String) -> Result<(), AnyError> {
    let path = Path::new(&file);
    let dir = path.parent().unwrap();
    match fs::create_dir_all(dir) {
        Ok(_) => {
            File::create(file).unwrap();
        }
        Err(e) => {
            return Err(AnyError::from(e));
        }
    }
    Ok(())
}

#[op2(fast)]
fn op_file_append(#[string] file: String, #[string] contents: String) -> Result<(), AnyError> {
    let file_opt  = File::options().append(true).open(file);
    match file_opt {
        Ok(mut file) => {
            let write_opt = file.write_all(contents.as_bytes());
            match write_opt {
                Ok(_) => {
                    return Ok(());
                }
                Err(e) => {
                    return Err(AnyError::from(e));
                }
            }
        }
        Err(e) => {
            return Err(AnyError::from(e));
        }
    }
}

#[op2]
#[serde]
fn op_file_read_line(#[string] path: String) -> Result<Vec<String>, AnyError> {
    let file = File::open(path);
    match file  {
        Ok(f) => {
            let reader = BufReader::new(f);
            let mut lines_res = Vec::new();
            for line in reader.lines() {
                let line = line.unwrap();
                lines_res.push(line);
            }
            return Ok(lines_res);
        }
        Err(e) => {
            return Err(AnyError::from(e));
        }
    }
}

#[op2]
#[string]
fn op_read_to_string(#[string] path: String) -> Result<String, AnyError> {
    let contents = fs::read_to_string(path);
    match contents {
        Ok(v) => {
            return Ok(v);
        }
        Err(e) => {
            return Err(AnyError::from(e));
        }
    }
}




extension!(
    runjs,
    ops = [op_read_file, op_write_file, op_remove_file, println, eprintln, op_read_xls, op_md5, op_uuid, op_snowid, op_file_create, op_file_append, op_file_read_line, op_read_to_string],
    esm_entry_point = "ext:runjs/runtime.js",
    esm = [dir "src", "runtime.js"]
);

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
