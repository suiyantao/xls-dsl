// 文件操作函数
use std::{
    fs,
    io::{BufRead, Write},
};

use deno_core::{error::AnyError, op2};

// 复制文件，将源文件复制到目标路径
/// # 参数
/// - `src`: 源文件的路径，以字符串形式表示。
/// - `dst`: 目标文件的路径，以字符串形式表示。
#[op2(fast)]
pub fn op_fs_copy_file(#[string] src: String, #[string] dst: String) -> Result<(), AnyError> {
    fs::copy(src, dst)?;
    Ok(())
}

// 创建单个目录，若目录已存在则报错
/// # 参数
/// - `path`: 要创建的目录的路径，以字符串形式表示。
#[op2(fast)]
pub fn op_fs_create_dir(#[string] path: String) -> Result<(), AnyError> {
    fs::create_dir(path)?;
    Ok(())
}

// 递归创建目录，若目录已存在则不报错
/// # 参数
/// - `path`: 要递归创建的目录的路径，以字符串形式表示。
#[op2(fast)]
pub fn op_fs_create_dir_all(#[string] path: String) -> Result<(), AnyError> {
    fs::create_dir_all(path)?;
    Ok(())
}

// 检查指定路径的文件或目录是否存在
/// # 参数
/// - `path`: 要检查的文件或目录的路径，以字符串形式表示。
#[op2(fast)]
pub fn op_fs_exists(#[string] path: String) -> Result<bool, AnyError> {
    Ok(fs::metadata(path).is_ok())
}

// 创建硬链接，将源文件链接到目标路径
/// # 参数
/// - `src`: 源文件的路径，以字符串形式表示。
/// - `dst`: 目标硬链接的路径，以字符串形式表示。
#[op2(fast)]
pub fn op_fs_hard_link(#[string] src: String, #[string] dst: String) -> Result<(), AnyError> {
    fs::hard_link(src, dst)?;
    Ok(())
}

// 读取文件内容并以字符串形式返回
/// # 参数
/// - `path`: 要读取的文件的路径，以字符串形式表示。
#[op2]
#[string]
pub fn op_fs_read_to_string(#[string] path: String) -> Result<String, AnyError> {
    let contents = fs::read_to_string(path);
    match contents {
        Ok(c) => {
            return Ok(c);
        }
        Err(e) => {
            return Err(AnyError::from(e));
        }
    }
}

// 读取所有目录
/// # 参数
/// - `path`: 要读取的目录的路径，以字符串形式表示。
#[op2]
#[serde]
pub fn op_fs_read_dir(#[string] path: String) -> Result<Vec<String>, AnyError> {
    let dir = fs::read_dir(path);
    match dir {
        Ok(d) => {
            let mut res = Vec::new();
            for entry in d {
                let entry = entry?;
                let path = entry.path();
                res.push(path.to_str().unwrap().to_string());
            }
            return Ok(res);
        }
        Err(e) => {
            return Err(AnyError::from(e));
        }
    }
}

// 判断是否是目录
/// # 参数
/// - `path`: 要判断的路径，以字符串形式表示。
#[op2(fast)]
pub fn op_fs_is_dir(#[string] path: String) -> Result<bool, AnyError> {
    Ok(fs::metadata(path)?.is_dir())
}

// 判断是否是文件
/// # 参数
/// - `path`: 要判断的路径，以字符串形式表示。
#[op2(fast)]
pub fn op_fs_is_file(#[string] path: String) -> Result<bool, AnyError> {
    Ok(fs::metadata(path)?.is_file())
}

// 删除单个目录，目录必须为空
/// # 参数
/// - `path`: 要删除的空目录的路径，以字符串形式表示。
#[op2(fast)]
pub fn op_fs_remove_dir(#[string] path: String) -> Result<(), AnyError> {
    fs::remove_dir(path)?;
    Ok(())
}

// 递归删除目录及其所有内容
/// # 参数
/// - `path`: 要递归删除的目录的路径，以字符串形式表示。
#[op2(fast)]
pub fn op_fs_remove_dir_all(#[string] path: String) -> Result<(), AnyError> {
    fs::remove_dir_all(path)?;
    Ok(())
}

// 删除指定文件
/// # 参数
/// - `path`: 要删除的文件的路径，以字符串形式表示。
#[op2(fast)]
pub fn op_fs_remove_file(#[string] path: String) -> Result<(), AnyError> {
    fs::remove_file(path)?;
    Ok(())
}

// 重命名文件或移动文件到新路径
/// # 参数
/// - `src`: 源文件的路径，以字符串形式表示。
/// - `dst`: 目标文件的路径，以字符串形式表示。
#[op2(fast)]
pub fn op_fs_rename(#[string] src: String, #[string] dst: String) -> Result<(), AnyError> {
    fs::rename(src, dst)?;
    Ok(())
}
// 公共方法：创建文件，如果创建失败则返回错误
fn create_file_if_not_exists(path: &str) -> Result<(), AnyError> {
    // 如果文件的文件夹不存在，则创建文件夹
    if let Some(parent) = std::path::Path::new(path).parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    if !std::path::Path::new(path).exists() {
        let file = std::fs::File::create(path);
        match file {
            Ok(_) => {}
            Err(e) => {
                return Err(AnyError::from(e));
            }
        }
    }
    Ok(())
}

// 将指定内容写入文件，会覆盖原有内容
/// # 参数
/// - `path`: 要写入内容的文件的路径，以字符串形式表示。
/// - `contents`: 要写入文件的内容，以字符串形式表示。
#[op2(fast)]
pub fn op_fs_write(#[string] path: String, #[string] contents: String) -> Result<(), AnyError> {
    create_file_if_not_exists(&path)?;
    fs::write(path, contents)?;
    Ok(())
}

// 逐行读取文件内容并返回字符串向量
/// # 参数
/// - `path`: 要逐行读取的文件的路径，以字符串形式表示。
#[op2]
#[serde]
pub fn op_fs_read_line(#[string] path: String) -> Result<Vec<String>, AnyError> {
    let file = std::fs::File::open(path);
    match file {
        Ok(f) => {
            let reader = std::io::BufReader::new(f);
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

// 追加内容到文件末尾
/// # 参数
/// - `file`: 要追加内容的文件的路径，以字符串形式表示。
/// - `contents`: 要追加到文件末尾的内容，以字符串形式表示。
#[op2(fast)]
pub fn op_fs_append(#[string] file: String, #[string] contents: String) -> Result<(), AnyError> {
    // 如果文件不存在，则创建文件
    create_file_if_not_exists(&file)?;
    let file_opt = std::fs::OpenOptions::new().append(true).open(&file);
    match file_opt {
        Ok(mut file) => match file.write_all(contents.as_bytes()) {
            Ok(_) => {
                return Ok(());
            }
            Err(e) => {
                return Err(AnyError::from(e));
            }
        },
        Err(e) => {
            return Err(AnyError::from(e));
        }
    }
}

// 创建新文件，若文件已存在则会截断文件
/// # 参数
/// - `path`: 要创建或截断的文件的路径，以字符串形式表示。
#[op2(fast)]
pub fn op_fs_create_file(#[string] path: String) -> Result<(), AnyError> {
    let file = std::fs::File::create(path);
    match file {
        Ok(_) => {
            return Ok(());
        }
        Err(e) => {
            return Err(AnyError::from(e));
        }
    }
}
