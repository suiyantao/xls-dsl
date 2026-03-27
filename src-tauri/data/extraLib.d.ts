/**
 * Handlebars template rendering engine
 */
declare const Handlebars: {
  /**
   * Render a Handlebars template with data
   * @param template - The template string
   * @param data - The data object to render
   * @returns The rendered string
   */
  render(template: string, data: Record<string, unknown>): string;
};

/**
 * Cell value type in Excel sheets
 */
type XlsCell = string | number | boolean | null;

/**
 * Row in an Excel sheet as key-value pairs
 */
interface XlsRow {
  [column: string]: XlsCell;
}

/**
 * Sheet data represented as an array of rows
 */
type XlsSheet = XlsRow[];

/**
 * File system operations API
 * Provides cross-platform file system access
 */
declare const fs: {
  /**
   * Create a new file
   */
  create(filePath: string): void;
  /**
   * Append content to a file
   */
  append(filePath: string, content: string): void;
  /**
   * Read Excel files (.xlsx, .xls)
   */
  read_xls(filePath?: string): Promise<XlsSheet[]>;
  /**
   * Copy a file from source to destination
   */
  copy(src: string, dst: string): void;
  /**
   * Create a directory
   */
  create_dir(path: string): void;
  /**
   * Read directory contents
   * @returns Array of file/directory names
   */
  read_dir(path: string): Array<string>;
  /**
   * Check if path is a directory
   */
  is_dir(path: string): boolean;
  /**
   * Check if path is a file
   */
  is_file(path: string): boolean;
  /**
   * Create directory and all parent directories
   */
  create_dir_all(path: string): void;
  /**
   * Check if file or directory exists
   */
  exists(path: string): boolean;
  /**
   * Create a hard link
   */
  hard_link(src: string, dst: string): void;
  /**
   * Read entire file as string
   */
  read_to_string(filePath?: string): string;
  /**
   * Remove a directory
   */
  remove_dir(path: string): Promise<void>;
  /**
   * Remove directory and all contents
   */
  remove_dir_all(path: string): Promise<void>;
  /**
   * Remove a file
   */
  remove_file(path: string): Promise<void>;
  /**
   * Rename/move a file or directory
   */
  rename(src: string, dst: string): void;
  /**
   * Write content to file
   */
  write(path: string, contents: string): Promise<void>;
  /**
   * Read file line by line
   */
  read_to_line(filePath?: string): Array<string>;
};

/**
 * Generate a UUID v4
 */
declare function uuid(): string;

/**
 * Generate a Snowflake ID
 */
declare function snowid(): string;

/**
 * Calculate MD5 hash of string
 */
declare function md5(content: string): string;

/**
 * HTTP response object
 */
declare class HttpResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
  duration_ms: number;
  constructor(
    status: number,
    headers: Record<string, string>,
    body: string,
    duration_ms: number,
  );
}

/**
 * HTTP client for making HTTP requests
 */
declare const http: {
  /**
   * Perform GET request
   */
  get(url: string, headers?: Record<string, unknown>): Promise<HttpResponse>;
  /**
   * Perform POST request with JSON body
   */
  post(
    url: string,
    headers?: Record<string, unknown>,
    data?: Record<string, unknown>,
  ): Promise<HttpResponse>;
  /**
   * Submit form data
   */
  postForm(
    url: string,
    headers?: Record<string, unknown>,
    data?: Record<string, unknown>,
  ): Promise<HttpResponse>;
  /**
   * Upload file with form data
   */
  postUpload(
    url: string,
    headers?: Record<string, unknown>,
    data?: Record<string, unknown>,
  ): Promise<HttpResponse>;
  /**
   * Perform PUT request
   */
  put(
    url: string,
    headers?: Record<string, unknown>,
    data?: Record<string, unknown>,
  ): Promise<HttpResponse>;
  /**
   * Perform DELETE request
   */
  delete(url: string, headers?: Record<string, unknown>): Promise<HttpResponse>;
  /**
   * Get all cookies
   */
  getCookies(): Promise<Array<Record<string, unknown>>>;
  /**
   * Clear all cookies
   */
  clearCookies(): Promise<void>;
  /**
   * Set a cookie
   */
  setCookie(
    name: string,
    value: string,
    domain: string,
    path: string,
    expires?: Date,
    secure?: boolean,
    httpOnly?: boolean,
  ): Promise<void>;
};

interface PkgImportTypeRegistry {}

interface PkgImportApi {
  import<N extends string, V extends string>(
    name: N,
    version: V,
  ): Promise<`${N}@${V}` extends keyof PkgImportTypeRegistry ? PkgImportTypeRegistry[`${N}@${V}`] : unknown>;
}

declare const pkg: PkgImportApi;

declare class HttpClient {
  /**
   * Create a new HttpClient instance
   * @param baseUrl - Base URL for all requests
   */
  constructor(baseUrl: string);
  /**
   * Set a single header
   */
  header(key: string, value: string): this;
  /**
   * Set multiple headers
   */
  headers(headers: Record<string, string>): this;
  /**
   * Set HTTP method
   */
  method(method: string): this;
  /**
   * Set URL query parameters
   */
  params(params: Record<string, string>): this;
  /**
   * Set request body
   */
  body(body: string): this;
  /**
   * Execute the request
   */
  execute(): Promise<HttpResponse>;
}
