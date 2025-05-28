// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// mod v8;

mod deno;
mod collections;
mod dao;
mod handlers;
mod parse_xls;

use handlers::handler::{self, APP};

use crate::dao::db;
use core::result::Result::Ok;
use tauri::Manager;


 
fn main() {
    tauri::Builder::default()
        .setup(|_app| {
            db::init();
            APP.lock().unwrap().insert("window".to_string(), _app.get_window("main").unwrap().clone());
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

