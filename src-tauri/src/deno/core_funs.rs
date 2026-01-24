use std::sync::Mutex;

use deno_core::{error::AnyError, op2};
use sonyflake::Sonyflake;

use crate::{dao::models::RunLog, deno::lib::emit_log};

lazy_static::lazy_static! {
    static ref SNOW_ID:Mutex<Sonyflake> = {
        Mutex::new(Sonyflake::new().unwrap())
    };
}

#[op2]
pub(crate) fn println(
    #[serde] body: Option<serde_json::Value>,
    #[serde] args: Vec<serde_json::Value>,
) -> Result<(), AnyError> {
    let body_str = match body {
        Some(body) => {
            if body.is_string() {
                let template = body.as_str().unwrap();
                format_string(template, &args)
            } else {
                body_to_string(Some(body))
            }
        }
        None => String::new(),
    };
    emit_log("println", RunLog::log(body_str));
    Ok(())
}

#[op2]
pub(crate) fn eprintln(
    #[serde] body: Option<serde_json::Value>,
    #[serde] args: Vec<serde_json::Value>,
) -> Result<(), AnyError> {
    let body_str = match body {
        Some(body) => {
            if body.is_string() {
                let template = body.as_str().unwrap();
                format_string(template, &args)
            } else {
                body_to_string(Some(body))
            }
        }
        None => String::new(),
    };
    emit_log("eprintln", RunLog::error(body_str));
    Ok(())
}

#[op2]
#[string]
pub(crate) fn op_md5(#[string] str: String) -> Result<String, AnyError> {
    let res: String = format!("{:x}", md5::compute(str));
    Ok(res)
}

#[op2]
#[string]
pub(crate) fn op_uuid() -> Result<String, AnyError> {
    let uuid = uuid::Uuid::new_v4().to_string();
    Ok(uuid)
}

#[op2]
#[string]
pub(crate) fn op_snowid() -> Result<String, AnyError> {
    let binding = SNOW_ID.lock().unwrap();
    let id = binding.next_id().unwrap();
    Ok(id.to_string())
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
        }
        None => "null".to_string(),
    }
}

/// 格式化字符串，支持类似 console.log 的格式化占位符
fn format_string(template: &str, args: &[serde_json::Value]) -> String {
    let mut result = String::new();
    let chars: Vec<char> = template.chars().collect();
    let mut i = 0;
    let mut arg_index = 0;

    while i < chars.len() {
        if chars[i] == '%' && i + 1 < chars.len() {
            let specifier = chars[i + 1];

            match specifier {
                's' => {
                    // 字符串
                    if arg_index < args.len() {
                        result.push_str(&value_to_string(&args[arg_index]));
                        arg_index += 1;
                    }
                    i += 2;
                }
                'd' | 'i' => {
                    // 整数
                    if arg_index < args.len() {
                        result.push_str(&value_to_number_string(&args[arg_index]));
                        arg_index += 1;
                    }
                    i += 2;
                }
                'f' => {
                    // 浮点数
                    if arg_index < args.len() {
                        if args[arg_index].is_number() {
                            if let Some(n) = args[arg_index].as_f64() {
                                result.push_str(
                                    &format!("{:.6}", n)
                                        .trim_end_matches('0')
                                        .trim_end_matches('.')
                                        .to_string(),
                                );
                            } else {
                                result.push_str("NaN");
                            }
                        } else {
                            result.push_str(&value_to_string(&args[arg_index]));
                        }
                        arg_index += 1;
                    }
                    i += 2;
                }
                'o' | 'O' => {
                    // 对象
                    if arg_index < args.len() {
                        match serde_json::to_string_pretty(&args[arg_index]) {
                            Ok(obj_str) => result.push_str(&obj_str),
                            Err(_) => result.push_str(&value_to_string(&args[arg_index])),
                        }
                        arg_index += 1;
                    }
                    i += 2;
                }
                'c' => {
                    // CSS 样式 - 在控制台中通常用于样式化，这里忽略
                    if arg_index < args.len() {
                        arg_index += 1;
                    }
                    i += 2;
                }
                '%' => {
                    // 转义的百分号
                    result.push('%');
                    i += 2;
                }
                _ => {
                    // 未知格式符，保持原样
                    result.push('%');
                    result.push(specifier);
                    i += 2;
                }
            }
        } else {
            result.push(chars[i]);
            i += 1;
        }
    }

    // 如果还有未使用的参数，追加到末尾
    for arg in args.iter().skip(arg_index) {
        result.push(' ');
        result.push_str(&value_to_string(arg));
    }

    result
}

/// 将值转换为字符串表示
fn value_to_string(value: &serde_json::Value) -> String {
    if value.is_string() {
        value.as_str().unwrap().to_string()
    } else if value.is_number() {
        value.to_string()
    } else if value.is_boolean() {
        value.as_bool().unwrap().to_string()
    } else if value.is_null() {
        "null".to_string()
    } else {
        match serde_json::to_string(value) {
            Ok(s) => s,
            Err(_) => value.to_string(),
        }
    }
}

/// 将值转换为数字字符串
fn value_to_number_string(value: &serde_json::Value) -> String {
    if value.is_i64() {
        value.as_i64().unwrap().to_string()
    } else if value.is_u64() {
        value.as_u64().unwrap().to_string()
    } else if value.is_f64() {
        let n = value.as_f64().unwrap();
        if n.fract() == 0.0 {
            (n as i64).to_string()
        } else {
            n.to_string()
        }
    } else if value.is_string() {
        // 尝试解析字符串为数字
        match value.as_str().unwrap().parse::<f64>() {
            Ok(n) => {
                if n.fract() == 0.0 {
                    (n as i64).to_string()
                } else {
                    n.to_string()
                }
            }
            Err(_) => "NaN".to_string(),
        }
    } else if value.is_boolean() {
        (if value.as_bool().unwrap() { 1 } else { 0 }).to_string()
    } else {
        "NaN".to_string()
    }
}
