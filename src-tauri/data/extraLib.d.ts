declare const Handlebars: {
  render(template: string, data: Record<string, unknown>): string;
};

declare const fs: {
  create(filePath: string): void;
  append(filePath: string, content: string): void;
  read_xls(filePath?: string): Promise<Array<Array<unknown>>>;
  copy(src: string, dst: string): void;
  create_dir(path: string): void;
  read_dir(path: string): Array<string>;
  is_dir(path: string): boolean;
  is_file(path: string): boolean;
  create_dir_all(path: string): void;
  exists(path: string): boolean;
  hard_link(src: string, dst: string): void;
  read_to_string(filePath?: string): string;
  remove_dir(path: string): Promise<void>;
  remove_dir_all(path: string): Promise<void>;
  remove_file(path: string): Promise<void>;
  rename(src: string, dst: string): void;
  write(path: string, contents: string): Promise<void>;
  read_to_line(filePath?: string): Array<string>;
};

declare function uuid(): string;
declare function snowid(): string;
declare function md5(content: string): string;

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

declare const http: {
  get(url: string, headers?: Record<string, unknown>): Promise<HttpResponse>;
  post(
    url: string,
    headers?: Record<string, unknown>,
    data?: Record<string, unknown>,
  ): Promise<HttpResponse>;
  postForm(
    url: string,
    headers?: Record<string, unknown>,
    data?: Record<string, unknown>,
  ): Promise<HttpResponse>;
  postUpload(
    url: string,
    headers?: Record<string, unknown>,
    data?: Record<string, unknown>,
  ): Promise<HttpResponse>;
  put(
    url: string,
    headers?: Record<string, unknown>,
    data?: Record<string, unknown>,
  ): Promise<HttpResponse>;
  delete(url: string, headers?: Record<string, unknown>): Promise<HttpResponse>;
  getCookies(): Promise<Array<Record<string, unknown>>>;
  clearCookies(): Promise<void>;
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

declare const pkg: {
  import(name: string, version: string): Promise<unknown>;
};

declare class HttpClient {
  constructor(baseUrl: string);
  header(key: string, value: string): this;
  headers(headers: Record<string, string>): this;
  method(method: string): this;
  params(params: Record<string, string>): this;
  body(body: string): this;
  execute(): Promise<HttpResponse>;
}
