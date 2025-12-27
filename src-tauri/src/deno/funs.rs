use handlebars::Handlebars;
use sonyflake::Sonyflake;
use std::sync::Mutex;
use tera::Context;

use deno_core::{error::AnyError, extension, op2};

use crate::{
    dao::models::RunLog,
    deno::{fs_funs, http_funs, lib::{XLS_PATH, emit_log}},
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

fn body_to_string(body: Option<serde_json::Value>) -> String {
    match body {
        Some(body) => {
            if body.is_string() {
                // 如果是字符串，直接获取字符串值
                body.as_str().unwrap().to_string()
            } else if body.is_number() {
                // 如果是数字，转换为字符串
                body.to_string()
            } else if body.is_boolean() {
                // 如果是布尔值，转换为字符串
                body.as_bool().unwrap().to_string()
            } else if body.is_null() {
                // 如果是null，返回"null"
                "null".to_string()
            } else {
                // 对于对象和数组，使用serde_json序列化为字符串
                match serde_json::to_string(&body) {
                    Ok(json_str) => json_str,
                    Err(_) => body.to_string(), // 如果序列化失败，使用默认的to_string
                }
            }
        },
        None => {
            "null".to_string()
        }
    }
    
}


#[op2]
fn println(#[serde] body: Option<serde_json::Value>) -> Result<(), AnyError> {
    let body_str = body_to_string(body);
    emit_log("println", RunLog::log(body_str));
    Ok(())
}

#[op2]
fn eprintln(#[serde] body: Option<serde_json::Value>) -> Result<(), AnyError> {
    let body_str = body_to_string(body);
    emit_log("eprintln", RunLog::error(body_str));
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
        fs_funs::op_fs_read_dir,
        fs_funs::op_fs_is_dir,
        fs_funs::op_fs_is_file,
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
        http_funs::op_http_get,
        http_funs::op_http_post,
        http_funs::op_http_post_form,
        http_funs::op_http_post_upload,
        http_funs::op_http_put,
        http_funs::op_http_delete,
        http_funs::op_http_get_cookies,
        http_funs::op_http_clear_cookies,
        http_funs::op_http_set_cookie,
        op_tera_template,
        handlebars_render
    ],
    esm_entry_point = "ext:runjs/runtime.js",
    esm = [dir "src", "runtime.js"]
);
