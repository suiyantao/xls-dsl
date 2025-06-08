use handlebars::Handlebars;
use sonyflake::Sonyflake;
use std::sync::Mutex;
use tauri::Emitter;
use tera::Context;

use deno_core::{error::AnyError, extension, op2};

use crate::{
    dao::models::RunLog,
    deno::{fs_funs, lib::XLS_PATH},
    handler::APP,
    parse_xls::lib::ParseXls,
};

lazy_static::lazy_static! {
    static ref SNOW_ID:Mutex<Sonyflake> = {
        Mutex::new(Sonyflake::new().unwrap())
    };
}

#[op2(async)]
#[serde]
async fn op_read_xls(#[string] mut path: String) -> Result<serde_json::Value, AnyError> {
    if path == "" {
        path = XLS_PATH.with(|path| path.borrow().clone());
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

#[op2]
#[string]
fn op_tera_template(
    #[string] template: String,
    #[serde] data: serde_json::Value,
) -> Result<String, AnyError> {
    let context = Context::from_value(data)?;
    let res = tera::Tera::one_off(&template, &context, true)?;
    Ok(res)
}

#[op2]
#[string]
fn handlebars_render(
    #[string] template: String,
    #[serde] data: serde_json::Value,
) -> Result<String, AnyError> {
    let mut hb = Handlebars::new();
    hb.register_template_string("data", &template)?;
    let res = hb.render("data", &data)?;
    Ok(res)
}

extension!(
    runjs,
    ops = [
        println, eprintln, op_read_xls, op_md5, op_uuid, op_snowid,
        fs_funs::op_fs_copy_file,
        fs_funs::op_fs_create_dir,
        fs_funs::op_fs_create_dir_all,
        fs_funs::op_fs_exists,
        fs_funs::op_fs_hard_link,
        fs_funs::op_fs_read_to_string,
        fs_funs::op_fs_remove_dir,
        fs_funs::op_fs_remove_dir_all,
        fs_funs::op_fs_remove_file,
        fs_funs::op_fs_rename,
        fs_funs::op_fs_write,
        fs_funs::op_fs_read_line,
        fs_funs::op_fs_append,
        fs_funs::op_fs_create_file,
        op_tera_template,
        handlebars_render
    ],
    esm_entry_point = "ext:runjs/runtime.js",
    esm = [dir "src", "runtime.js"]
);
