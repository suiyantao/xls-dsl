use crate::dao::models::RunLog;
use chrono::Local;

use crate::dao::file_dao;
use crate::dao::models::{NewFile, XlsFile};
use crate::deno::lib::{emit_log, DenoRuntime};


#[tauri::command]
pub(crate) fn find_all_file() -> Vec<XlsFile> {
    file_dao::select().unwrap()
}

#[tauri::command]
pub(crate) fn add_file(new_file: NewFile) -> XlsFile {
    file_dao::insert(NewFile {
        created_date: Some(Local::now().naive_local()),
        updated_date: Some(Local::now().naive_local()),
        ..new_file
    })
    .unwrap()
}

#[tauri::command]
pub(crate) fn remove_file(id: i32) {
    file_dao::remove(id).unwrap();
}

#[tauri::command]
pub(crate) fn update_code_by_id(id: i32, code: String) -> XlsFile {
    file_dao::update_code_by_id(id, code).unwrap()
}

#[tauri::command]
pub(crate) fn update_name_xls_by_id(id: i32, name: String, xls: String) -> XlsFile {
    file_dao::update_name_xls_by_id(id, name, xls).unwrap()
}

#[tauri::command]
pub(crate) fn update_file(update_file: XlsFile) -> XlsFile {
    file_dao::update(update_file).unwrap()
}

#[tauri::command]
pub(crate) fn get_by_id(id: i32) -> XlsFile {
    file_dao::get_by_id(id).unwrap()
}

#[tauri::command]
pub(crate) fn run(id: i32) -> Result<String, String> {
    let file: XlsFile = file_dao::get_by_id(id).expect("id not found");

    // 使用 std::thread 创建一个新线程来运行异步任务
    std::thread::spawn(move || {
        // 在新线程中运行异步任务
        actix_rt::System::new().block_on(async {
            let res = DenoRuntime::new(file).run_script().await;
            match res {
                Ok(_) => {
                    emit_log("println", RunLog::result("success".to_string()));
                },
                Err(e) => {
                    eprintln!("Error running script: {}", e);
                    emit_log("println", RunLog::error(format!("{:?}", e)));
                }
            }
        });
    });

    Ok("success".to_string())
}
