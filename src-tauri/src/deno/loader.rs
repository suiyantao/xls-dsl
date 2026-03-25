use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::Arc;
use std::sync::Mutex;
use std::time::SystemTime;
use std::time::UNIX_EPOCH;

use deno_core::error::AnyError;
use deno_core::resolve_import;
use deno_core::url::Url;
use deno_core::ModuleLoadResponse;
use deno_core::ModuleLoader;
use deno_core::ModuleSource;
use deno_core::ModuleSourceCode;
use deno_core::ModuleSpecifier;
use deno_core::ModuleType;
use deno_core::RequestedModuleType;
use deno_core::ResolutionKind;
use lazy_static::lazy_static;
use sha2::Digest;
use sha2::Sha256;

lazy_static! {
    static ref REMOTE_CACHE_LOCKS: Mutex<HashMap<String, Arc<Mutex<()>>>> =
        Mutex::new(HashMap::new());
}

#[allow(dead_code)]
pub struct LoaderConfig {
    pub base_url: Url,
    pub cache_dir: PathBuf,
}

#[allow(dead_code)]
pub struct EsmShModuleLoader {
    config: LoaderConfig,
}

impl EsmShModuleLoader {
    pub fn new(config: LoaderConfig) -> Self {
        Self { config }
    }

    fn is_same_origin(base_url: &Url, module_specifier: &ModuleSpecifier) -> bool {
        base_url.scheme() == module_specifier.scheme()
            && base_url.host_str() == module_specifier.host_str()
            && base_url.port_or_known_default() == module_specifier.port_or_known_default()
    }

    fn module_source_from_string(
        module_specifier: &ModuleSpecifier,
        source: String,
    ) -> ModuleSource {
        ModuleSource::new(
            ModuleType::JavaScript,
            ModuleSourceCode::String(source.into()),
            module_specifier,
            None,
        )
    }

    fn cache_file_path(cache_dir: &std::path::Path, module_specifier: &ModuleSpecifier) -> PathBuf {
        let mut hasher = Sha256::new();
        hasher.update(module_specifier.as_str().as_bytes());
        let digest = hasher.finalize();
        cache_dir.join(format!("{:x}.js", digest))
    }

    fn read_cached_source(cache_path: &std::path::Path) -> Option<String> {
        let source = match fs::read_to_string(cache_path) {
            Ok(source) => source,
            Err(_) => {
                let _ = fs::remove_file(cache_path);
                return None;
            }
        };

        if source.is_empty() {
            let _ = fs::remove_file(cache_path);
            return None;
        }

        Some(source)
    }

    fn cache_lock(module_specifier: &ModuleSpecifier) -> Arc<Mutex<()>> {
        let mut locks = REMOTE_CACHE_LOCKS.lock().unwrap();
        locks
            .entry(module_specifier.to_string())
            .or_insert_with(|| Arc::new(Mutex::new(())))
            .clone()
    }

    fn write_cached_source(cache_path: &std::path::Path, source: &str) -> Result<(), AnyError> {
        if let Some(parent) = cache_path.parent() {
            fs::create_dir_all(parent)?;
        }

        let unique = SystemTime::now().duration_since(UNIX_EPOCH)?.as_nanos();
        let tmp_path = cache_path.with_extension(format!("tmp-{unique}"));
        fs::write(&tmp_path, source)?;
        fs::rename(&tmp_path, cache_path)?;
        Ok(())
    }

    async fn load_remote_module(
        base_url: Url,
        cache_dir: PathBuf,
        module_specifier: ModuleSpecifier,
    ) -> Result<ModuleSource, AnyError> {
        match module_specifier.scheme() {
            "http" | "https" => {
                if !Self::is_same_origin(&base_url, &module_specifier) {
                    return Err(AnyError::msg(format!(
                        "esm.sh loader only supports same origin modules, got {} with base {}",
                        module_specifier, base_url
                    )));
                }

                let cache_path = Self::cache_file_path(&cache_dir, &module_specifier);
                if let Some(source) = Self::read_cached_source(&cache_path) {
                    return Ok(Self::module_source_from_string(&module_specifier, source));
                }

                let cache_lock = Self::cache_lock(&module_specifier);
                let _guard = cache_lock.lock().unwrap();

                if let Some(source) = Self::read_cached_source(&cache_path) {
                    return Ok(Self::module_source_from_string(&module_specifier, source));
                }

                let module_url = module_specifier.to_string();
                let response = reqwest::get(module_specifier.as_str())
                    .await
                    .map_err(|err| AnyError::msg(format!("failed to download module {module_url}: {err}")))?;

                if !response.status().is_success() {
                    return Err(AnyError::msg(format!(
                        "failed to fetch module {module_url}: HTTP {}",
                        response.status()
                    )));
                }

                let source = response
                    .text()
                    .await
                    .map_err(|err| AnyError::msg(format!("failed to read module body {module_url}: {err}")))?;
                Self::write_cached_source(&cache_path, &source)?;

                Ok(Self::module_source_from_string(&module_specifier, source))
            }
            scheme => Err(AnyError::msg(format!(
                "esm.sh loader only supports http/https modules, got scheme {scheme} for {module_specifier}"
            ))),
        }
    }
}

impl ModuleLoader for EsmShModuleLoader {
    fn resolve(
        &self,
        specifier: &str,
        referrer: &str,
        _kind: ResolutionKind,
    ) -> Result<ModuleSpecifier, AnyError> {
        let referrer = if referrer.is_empty() {
            self.config.base_url.as_str()
        } else {
            referrer
        };

        Ok(resolve_import(specifier, referrer)?)
    }

    fn load(
        &self,
        module_specifier: &ModuleSpecifier,
        _maybe_referrer: Option<&ModuleSpecifier>,
        _is_dyn_import: bool,
        _requested_module_type: RequestedModuleType,
    ) -> ModuleLoadResponse {
        ModuleLoadResponse::Async(Box::pin(Self::load_remote_module(
            self.config.base_url.clone(),
            self.config.cache_dir.clone(),
            module_specifier.clone(),
        )))
    }
}

#[cfg(test)]
mod tests {
    use std::io::Read;
    use std::io::Write;
    use std::net::TcpListener;
    use std::path::PathBuf;
    use std::time::SystemTime;
    use std::time::UNIX_EPOCH;
    use std::thread;

    use deno_core::error::AnyError;
    use deno_core::url::Url;
    use deno_core::ModuleLoadResponse;
    use deno_core::ModuleLoader;
    use deno_core::ModuleSource;
    use deno_core::RequestedModuleType;
    use deno_core::ResolutionKind;

    use super::EsmShModuleLoader;
    use super::LoaderConfig;

    fn loader() -> EsmShModuleLoader {
        EsmShModuleLoader::new(LoaderConfig {
            base_url: Url::parse("https://esm.sh/").unwrap(),
            cache_dir: PathBuf::from("/tmp/esm-sh-cache"),
        })
    }

    fn spawn_mock_http_server(
        path: &'static str,
        content_type: &'static str,
        body: &'static str,
    ) -> (Url, thread::JoinHandle<()>) {
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let addr = listener.local_addr().unwrap();
        let base_url = Url::parse(&format!("http://{addr}/")).unwrap();

        let handle = thread::spawn(move || {
            let (mut stream, _) = listener.accept().unwrap();
            let mut request = [0_u8; 1024];
            let bytes_read = stream.read(&mut request).unwrap();
            let request_text = String::from_utf8_lossy(&request[..bytes_read]);
            assert!(
                request_text.starts_with(&format!("GET {path} HTTP/1.1")),
                "unexpected request: {request_text}"
            );

            let response = format!(
                "HTTP/1.1 200 OK\r\nContent-Type: {content_type}\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
                body.len()
            );
            stream.write_all(response.as_bytes()).unwrap();
        });

        (base_url, handle)
    }

    fn unique_cache_dir() -> PathBuf {
        let unique = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        std::env::temp_dir().join(format!("esm-sh-cache-test-{unique}"))
    }

    async fn load_module_source(
        loader: &EsmShModuleLoader,
        specifier: &Url,
    ) -> Result<String, AnyError> {
        let response = loader.load(specifier, None, false, RequestedModuleType::None);
        let module = match response {
            ModuleLoadResponse::Sync(result) => result?,
            ModuleLoadResponse::Async(fut) => fut.await?,
        };

        Ok(ModuleSource::get_string_source(module.code).to_string())
    }

    #[test]
    fn loader_resolve_relative_remote_specifier() {
        let resolved = loader()
            .resolve(
                "./chunk.js",
                "https://esm.sh/lodash@4.17.21",
                ResolutionKind::Import,
            )
            .unwrap();

        assert_eq!(resolved.as_str(), "https://esm.sh/chunk.js");
    }

    #[test]
    fn loader_resolve_root_remote_specifier() {
        let resolved = loader()
            .resolve(
                "/chunk.js",
                "https://esm.sh/lodash@4.17.21",
                ResolutionKind::Import,
            )
            .unwrap();

        assert_eq!(resolved.as_str(), "https://esm.sh/chunk.js");
    }

    #[tokio::test]
    async fn loader_fetches_remote_module_source() {
        let (base_url, handle) = spawn_mock_http_server(
            "/lodash@4.17.21",
            "application/javascript",
            "export const answer = 42;",
        );
        let specifier = Url::parse(&format!("{}lodash@4.17.21", base_url)).unwrap();
        let loader = EsmShModuleLoader::new(LoaderConfig {
            base_url,
            cache_dir: PathBuf::from("/tmp/esm-sh-cache"),
        });

        let response = loader.load(&specifier, None, false, RequestedModuleType::None);
        let module = match response {
            ModuleLoadResponse::Sync(result) => result.unwrap(),
            ModuleLoadResponse::Async(fut) => fut.await.unwrap(),
        };

        let code = ModuleSource::get_string_source(module.code);
        assert_eq!(code.to_string(), "export const answer = 42;");

        handle.join().unwrap();
    }

    #[tokio::test]
    async fn loader_rejects_cross_origin_remote_module_source() {
        let loader = EsmShModuleLoader::new(LoaderConfig {
            base_url: Url::parse("http://127.0.0.1:41001/").unwrap(),
            cache_dir: PathBuf::from("/tmp/esm-sh-cache"),
        });
        let specifier = Url::parse("http://127.0.0.1:41002/lodash@4.17.21").unwrap();

        let response = loader.load(&specifier, None, false, RequestedModuleType::None);
        let err = match response {
            ModuleLoadResponse::Sync(result) => result.unwrap_err(),
            ModuleLoadResponse::Async(fut) => fut.await.unwrap_err(),
        };

        assert!(
            err.to_string().contains("same origin"),
            "unexpected error: {err}"
        );
    }

    #[tokio::test]
    async fn cache_reuses_downloaded_remote_module_across_loader_instances() {
        let cache_dir = unique_cache_dir();
        let module_path = "/lodash@4.17.21";
        let module_source = "export const answer = 42;";

        let (base_url, handle) =
            spawn_mock_http_server(module_path, "application/javascript", module_source);
        let specifier = Url::parse(&format!("{}{path}", base_url, path = &module_path[1..])).unwrap();

        let first_loader = EsmShModuleLoader::new(LoaderConfig {
            base_url: base_url.clone(),
            cache_dir: cache_dir.clone(),
        });
        let first_source = load_module_source(&first_loader, &specifier).await.unwrap();
        assert_eq!(first_source, module_source);

        handle.join().unwrap();

        let second_loader = EsmShModuleLoader::new(LoaderConfig {
            base_url,
            cache_dir: cache_dir.clone(),
        });
        let second_source = load_module_source(&second_loader, &specifier).await.unwrap();
        assert_eq!(second_source, module_source);

        let _ = std::fs::remove_dir_all(cache_dir);
    }
}
