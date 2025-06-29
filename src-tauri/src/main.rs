// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// mod v8;

mod collections;
mod dao;
mod deno;
mod handlers;
mod parse_xls;


use crate::{dao::db, deno::lib::WINDOW, handlers::handler::{self}};
use core::result::Result::Ok;
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .setup(|_app| {
            db::init();
            let _ = WINDOW.lock().unwrap().insert(
                _app.get_webview_window("main").unwrap().clone()
            );
            Ok({})
        })
        .invoke_handler(tauri::generate_handler![
            handler::find_all_file,
            handler::add_file,
            handler::remove_file,
            handler::update_code_by_id,
            handler::update_file,
            handler::get_by_id,
            handler::update_name_xls_by_id,
            handler::run
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
