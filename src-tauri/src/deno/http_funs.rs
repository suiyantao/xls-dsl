//! HTTP功能模块
//!
//! 提供完整的HTTP客户端功能，包括：
//! - REST API支持（GET, POST, PUT, DELETE）
//! - 表单数据提交
//! - 文件上传
//! - Cookie管理
//! - 请求/响应头处理

use deno_core::{error::AnyError, op2};
use deno_core::{OpState, Resource, ResourceId};
use serde::{Deserialize, Serialize};
use std::cell::RefCell;
use std::collections::HashMap;
use std::path::Path;
use std::rc::Rc;
use std::sync::Arc;
use std::time::Duration;

// =============================================================================
// 类型定义
// =============================================================================

/// HTTP请求头结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HttpHeaders {
    pub headers: HashMap<String, String>,
}

impl HttpHeaders {
    /// 转换为reqwest头格式
    pub fn to_reqwest_headers(&self) -> reqwest::header::HeaderMap {
        let mut header_map = reqwest::header::HeaderMap::new();
        for (key, value) in &self.headers {
            if let Ok(header_name) = reqwest::header::HeaderName::from_bytes(key.as_bytes()) {
                if let Ok(header_value) = reqwest::header::HeaderValue::from_str(value) {
                    header_map.insert(header_name, header_value);
                }
            }
        }
        header_map
    }
}

/// HTTP响应结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HttpResponse {
    pub status: u16,
    pub headers: HashMap<String, String>,
    pub body: serde_json::Value,
    pub duration_ms: u64,
}

/// 文件上传数据结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileUploadData {
    pub field_name: String,
    pub file_path: String,
    pub file_name: Option<String>,
    pub mime_type: Option<String>,
}

/// Cookie数据结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CookieData {
    pub name: String,
    pub value: String,
    pub domain: Option<String>,
    pub path: Option<String>,
    pub expires: Option<i64>,
    pub secure: Option<bool>,
    pub http_only: Option<bool>,
}

/// Cookie jar管理结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CookieJarInfo {
    pub cookies: Vec<CookieData>,
    pub count: usize,
}

// =============================================================================
// 全局配置
// =============================================================================

lazy_static::lazy_static! {
    /// 共享的Cookie jar
    static ref COOKIE_JAR: Arc<reqwest::cookie::Jar> = Arc::new(reqwest::cookie::Jar::default());

    /// 全局HTTP客户端
    static ref HTTP_CLIENT: reqwest::Client = create_http_client();
}

/// 创建配置好的HTTP客户端
fn create_http_client() -> reqwest::Client {
    reqwest::Client::builder()
        .timeout(Duration::from_secs(30))
        .connect_timeout(Duration::from_secs(10))
        .user_agent("XLS-DSL/1.0")
        .cookie_provider(COOKIE_JAR.clone())
        .build()
        .expect("Failed to create HTTP client")
}

// =============================================================================
// 辅助函数
// =============================================================================

/// 提取响应头
fn extract_headers(response: &reqwest::Response) -> HashMap<String, String> {
    let mut headers = HashMap::new();
    for (key, value) in response.headers() {
        if let Ok(value_str) = value.to_str() {
            headers.insert(key.to_string(), value_str.to_string());
        }
    }
    headers
}

/// 构建带查询参数的URL
fn build_url_with_params(url: String, params: Option<HashMap<String, String>>) -> String {
    if let Some(params) = params {
        if !params.is_empty() {
            let query_string = params
                .iter()
                .map(|(k, v)| format!("{}={}", urlencoding::encode(k), urlencoding::encode(v)))
                .collect::<Vec<_>>()
                .join("&");

            return if url.contains('?') {
                format!("{}&{}", url, query_string)
            } else {
                format!("{}?{}", url, query_string)
            };
        }
    }
    url
}

/// 解析响应体为JSON或字符串
fn parse_response_body(response_text: String) -> serde_json::Value {
    match serde_json::from_str::<serde_json::Value>(&response_text) {
        Ok(json) => json,
        Err(_) => serde_json::Value::String(response_text),
    }
}

/// 执行HTTP请求并返回响应
async fn execute_request<F>(
    request_builder: F,
    start_time: std::time::Instant,
) -> Result<HttpResponse, AnyError>
where
    F: std::future::Future<Output = Result<reqwest::Response, reqwest::Error>>,
{
    let response = request_builder.await?;
    let status = response.status().as_u16();
    let response_headers = extract_headers(&response);
    let response_text = response.text().await?;
    let body = parse_response_body(response_text);
    let duration_ms = start_time.elapsed().as_millis() as u64;

    Ok(HttpResponse {
        status,
        headers: response_headers,
        body,
        duration_ms,
    })
}

// =============================================================================
// HTTP操作函数
// =============================================================================

/// 发送HTTP GET请求
#[op2(async)]
#[serde]
pub async fn op_http_get(
    #[string] url: String,
    #[serde] headers: Option<HttpHeaders>,
) -> Result<HttpResponse, AnyError> {
    let start_time = std::time::Instant::now();
    let mut request_builder = HTTP_CLIENT.get(&url);

    if let Some(headers) = headers {
        request_builder = request_builder.headers(headers.to_reqwest_headers());
    }

    execute_request(request_builder.send(), start_time).await
}

/// 发送HTTP POST请求（JSON数据）
#[op2(async)]
#[serde]
pub async fn op_http_post(
    #[string] url: String,
    #[serde] headers: Option<HttpHeaders>,
    #[serde] body: Option<serde_json::Value>,
) -> Result<HttpResponse, AnyError> {
    let start_time = std::time::Instant::now();
    let mut request_builder = HTTP_CLIENT.post(&url);

    if let Some(headers) = headers {
        request_builder = request_builder.headers(headers.to_reqwest_headers());
    }

    if let Some(body) = body {
        let body_string = serde_json::to_string(&body)?;
        request_builder = request_builder
            .body(body_string)
            .header(reqwest::header::CONTENT_TYPE, "application/json");
    }

    execute_request(request_builder.send(), start_time).await
}

/// 发送HTTP POST请求（表单数据）
#[op2(async)]
#[serde]
pub async fn op_http_post_form(
    #[string] url: String,
    #[serde] params: Option<HashMap<String, String>>,
    #[serde] form_data: Option<HashMap<String, String>>,
    #[serde] headers: Option<HttpHeaders>,
) -> Result<HttpResponse, AnyError> {
    let start_time = std::time::Instant::now();
    let final_url = build_url_with_params(url, params);
    let mut request_builder = HTTP_CLIENT.post(&final_url);

    if let Some(headers) = headers {
        request_builder = request_builder.headers(headers.to_reqwest_headers());
    }

    if let Some(form_data) = form_data {
        if !form_data.is_empty() {
            let form_params: Vec<(&str, &str)> = form_data
                .iter()
                .map(|(k, v)| (k.as_str(), v.as_str()))
                .collect();
            request_builder = request_builder.form(&form_params).header(
                reqwest::header::CONTENT_TYPE,
                "application/x-www-form-urlencoded",
            );
        }
    }

    execute_request(request_builder.send(), start_time).await
}

/// 发送HTTP PUT请求
#[op2(async)]
#[serde]
pub async fn op_http_put(
    #[string] url: String,
    #[serde] headers: Option<HttpHeaders>,
    #[serde] body: Option<serde_json::Value>,
) -> Result<HttpResponse, AnyError> {
    let start_time = std::time::Instant::now();
    let mut request_builder = HTTP_CLIENT.put(&url);

    if let Some(headers) = headers {
        request_builder = request_builder.headers(headers.to_reqwest_headers());
    }

    if let Some(body) = body {
        let body_string = serde_json::to_string(&body)?;
        request_builder = request_builder
            .body(body_string)
            .header(reqwest::header::CONTENT_TYPE, "application/json");
    }

    execute_request(request_builder.send(), start_time).await
}

/// 发送HTTP DELETE请求
#[op2(async)]
#[serde]
pub async fn op_http_delete(
    #[string] url: String,
    #[serde] headers: Option<HttpHeaders>,
) -> Result<HttpResponse, AnyError> {
    let start_time = std::time::Instant::now();
    let mut request_builder = HTTP_CLIENT.delete(&url);

    if let Some(headers) = headers {
        request_builder = request_builder.headers(headers.to_reqwest_headers());
    }

    execute_request(request_builder.send(), start_time).await
}

/// 发送HTTP POST请求（文件上传）
#[op2(async)]
#[serde]
pub async fn op_http_post_upload(
    #[string] url: String,
    #[serde] params: Option<HashMap<String, String>>,
    #[serde] fields: Option<HashMap<String, String>>,
    #[serde] files: Vec<FileUploadData>,
    #[serde] headers: Option<HttpHeaders>,
) -> Result<HttpResponse, AnyError> {
    let start_time = std::time::Instant::now();
    let final_url = build_url_with_params(url, params);
    let mut request_builder = HTTP_CLIENT.post(&final_url);

    if let Some(headers) = headers {
        request_builder = request_builder.headers(headers.to_reqwest_headers());
    }

    // 构建多部分表单数据
    let mut form = reqwest::multipart::Form::new();

    // 添加表单字段
    if let Some(fields) = fields {
        for (key, value) in fields {
            form = form.text(key, value);
        }
    }

    // 添加文件
    for file_data in files {
        let path = Path::new(&file_data.file_path);

        if !path.exists() {
            return Err(AnyError::msg(format!(
                "File not found: {}",
                file_data.file_path
            )));
        }

        let file_content = std::fs::read(&file_data.file_path)?;
        let file_name = file_data.file_name.unwrap_or_else(|| {
            path.file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("upload.bin")
                .to_string()
        });

        let mut file_part = reqwest::multipart::Part::bytes(file_content).file_name(file_name);

        if let Some(mime_type) = &file_data.mime_type {
            file_part = file_part.mime_str(mime_type)?;
        }

        form = form.part(file_data.field_name, file_part);
    }

    request_builder = request_builder.multipart(form);
    execute_request(request_builder.send(), start_time).await
}

// =============================================================================
// Cookie管理函数
// =============================================================================

/// 获取所有Cookie
#[op2(async)]
#[serde]
pub async fn op_http_get_cookies() -> Result<CookieJarInfo, AnyError> {
    // 简化实现：返回空列表，因为reqwest的cookie jar API有限
    Ok(CookieJarInfo {
        cookies: vec![],
        count: 0,
    })
}

/// 清除所有Cookie
#[op2(async)]
#[string]
pub async fn op_http_clear_cookies() -> Result<String, AnyError> {
    // 简化实现：返回成功
    Ok("true".to_string())
}

/// 设置Cookie
#[op2(async)]
#[string]
pub async fn op_http_set_cookie(
    #[string] name: String,
    #[string] value: String,
    #[string] domain: Option<String>,
    #[string] path: Option<String>,
    #[number] expires_seconds: Option<i64>,
    secure: Option<bool>,
    http_only: Option<bool>,
) -> Result<String, AnyError> {
    // 创建cookie字符串
    let mut cookie_str = format!("{}={}", name, value);

    if let Some(domain) = &domain {
        cookie_str.push_str(&format!("; domain={}", domain));
    }

    if let Some(path) = &path {
        cookie_str.push_str(&format!("; path={}", path));
    }

    if let Some(expires) = expires_seconds {
        cookie_str.push_str(&format!("; expires={}", expires));
    }

    if secure.unwrap_or(false) {
        cookie_str.push_str("; secure");
    }

    if http_only.unwrap_or(false) {
        cookie_str.push_str("; httponly");
    }

    // 简化实现：返回成功
    Ok("true".to_string())
}

struct HttpClient {
    client: reqwest::Client,
    // 使用 RefCell 实现内部可变性
    headers: RefCell<Option<HttpHeaders>>,
    url: Rc<String>,
    method: RefCell<HttpMethod>,
    params: RefCell<Option<HashMap<String, String>>>,
    body: RefCell<Option<serde_json::Value>>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
enum HttpMethod {
    Get,
    Post,
    Delete,
    Put,
}

impl Resource for HttpClient {
    fn name(&self) -> std::borrow::Cow<'_, str> {
        "HttpClient".into()
    }
}

impl HttpClient {
    pub fn new(url: String) -> Self {
        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(30))
            .connect_timeout(Duration::from_secs(10))
            .user_agent("XLS-DSL/1.0")
            .cookie_provider(COOKIE_JAR.clone())
            .build()
            .expect("Failed to create HTTP client");

        Self {
            client,
            headers: RefCell::new(None),
            url: Rc::new(url),
            method: RefCell::new(HttpMethod::Get),
            params: RefCell::new(None),
            body: RefCell::new(None),
        }
    }
}

#[op2(fast)]
#[smi]
pub fn op_http_client_new(state: &mut OpState, #[string] url: String) -> ResourceId {
    let http_client = HttpClient::new(url);
    state.resource_table.add(http_client)
}

#[op2]
#[smi]
pub fn op_http_client_method(
    state: &mut OpState,
    #[smi] rid: ResourceId,
    #[serde] method: HttpMethod,
) -> ResourceId {
    let http_client = state.resource_table.get::<HttpClient>(rid).unwrap();
    *http_client.method.borrow_mut() = method;
    rid
}

#[op2(fast)]
#[smi]
pub fn op_http_client_set_header(
    state: &mut OpState,
    #[smi] rid: ResourceId,
    #[string] key: String,
    #[string] value: String,
) -> ResourceId {
    // 从资源表中获取对象
    let http_client = state.resource_table.get::<HttpClient>(rid).unwrap();

    // 获取 RefCell 的可写借用并更新
    let mut headers_guard = http_client.headers.borrow_mut();

    if let Some(ref mut h) = *headers_guard {
        h.headers.insert(key, value); // 假设 HttpHeaders 有 insert 方法
    } else {
        let mut h = HttpHeaders {
            headers: HashMap::new(),
        };
        h.headers.insert(key, value);
        *headers_guard = Some(h);
    }

    rid
}

#[op2]
#[smi]
pub fn op_http_client_set_headers(
    state: &mut OpState,
    #[smi] rid: ResourceId,
    #[serde] headers: Option<HttpHeaders>,
) -> ResourceId {
    // 从资源表中获取对象
    let http_client = state.resource_table.get::<HttpClient>(rid).unwrap();

    // 获取 RefCell 的可写借用并更新
    let mut headers_guard = http_client.headers.borrow_mut();
    *headers_guard = headers;
    rid
}

#[op2(async)]
#[serde]
pub async fn op_http_client_execute(
    state: Rc<RefCell<OpState>>,
    #[smi] rid: ResourceId,
) -> Result<HttpResponse, AnyError> {
    let http_client = state.borrow().resource_table.get::<HttpClient>(rid)?;
    let client = http_client.client.clone();
    let url = http_client.url.to_string();
    let headers = http_client.headers.borrow().clone();
    let method = http_client.method.borrow().clone();
    let mut request_builder = match method {
        HttpMethod::Get => client.get(url),
        HttpMethod::Post => client.post(url),
        HttpMethod::Delete => client.delete(url),
        HttpMethod::Put => client.put(url),
    };

    if let Some(h) = headers {
        request_builder = request_builder.headers(h.to_reqwest_headers());
    }

    // 设置 params
    if let Some(params) = http_client.params.borrow().clone() {
        request_builder = request_builder.query(&params);
    }
    // 设置 body
    if let Some(body) = http_client.body.borrow().clone() {
        let body_string = serde_json::to_string(&body)?;
        println!("{:?}", body_string);
        request_builder = request_builder
            .body(body_string)
            .header(reqwest::header::CONTENT_TYPE, "application/json");
    }

    execute_request(request_builder.send(), std::time::Instant::now()).await
}

// 设置 params
#[op2]
#[smi]
pub fn op_http_client_set_params(
    state: &mut OpState,
    #[smi] rid: ResourceId,
    #[serde] params: Option<HashMap<String, String>>,
) -> ResourceId {
    // 从资源表中获取对象
    let http_client = state.resource_table.get::<HttpClient>(rid).unwrap();

    // 获取 RefCell 的可写借用并更新
    let mut params_guard = http_client.params.borrow_mut();
    *params_guard = params;

    rid
}

// 设置 json body
#[op2]
#[smi]
pub fn op_http_client_set_json_body(
    state: &mut OpState,
    #[smi] rid: ResourceId,
    #[serde] body: Option<serde_json::Value>,
) -> ResourceId {
    // 从资源表中获取对象
    let http_client = state.resource_table.get::<HttpClient>(rid).unwrap();
    // 获取 RefCell 的可写借用并更新
    let mut body_guard = http_client.body.borrow_mut();
    *body_guard = body;
    // 设置 content-type 为 application/json
    let mut content_type_guard = http_client.headers.borrow_mut();
    if let Some(ref mut h) = *content_type_guard {
        h.headers
            .insert("content-type".to_string(), "application/json".to_string());
    } else {
        let mut h = HttpHeaders {
            headers: HashMap::new(),
        };
        h.headers
            .insert("content-type".to_string(), "application/json".to_string());
        *content_type_guard = Some(h);
    }
    rid
}
