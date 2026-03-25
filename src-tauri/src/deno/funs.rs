use handlebars::Handlebars;
use tera::Context;

use deno_core::{error::AnyError, extension, op2};

use crate::{
    deno::{core_funs, fs_funs, http_funs, lib::XLS_PATH},
    parse_xls::lib::ParseXls,
};

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
        core_funs::println, core_funs::eprintln, op_read_xls, core_funs::op_md5, core_funs::op_uuid, core_funs::op_snowid,
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
        fs_funs::op_fs_write_binary,
        fs_funs::op_fs_read_binary,
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
        handlebars_render,
        http_funs::op_http_client_new,
        http_funs::op_http_client_method,
        http_funs::op_http_client_set_header,
        http_funs::op_http_client_set_headers,
        http_funs::op_http_client_execute,
        http_funs::op_http_client_set_params,
        http_funs::op_http_client_set_json_body
    ],
    esm_entry_point = "ext:runjs/runtime.js",
    esm = [dir "src", "runtime.js"]
);
