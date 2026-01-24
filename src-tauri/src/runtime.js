const core = Deno.core;
const ops = core.ops;

class HttpClient {
  #rid;

  constructor(url) {
    this.#rid = ops.op_http_client_new(url);
  }

  header(key, value) {
    ops.op_http_client_set_header(this.#rid, key, value);
    return this;
  }

  headers(headers) {
    ops.op_http_client_set_headers(this.#rid, headers);
    return this;
  }

  method(method) {
    ops.op_http_client_method(this.#rid, method);
    return this;
  }

  params(params) {
    ops.op_http_client_set_params(this.#rid, params);
    return this;
  }

  body(body) {
    ops.op_http_client_set_json_body(this.#rid, body);
    return this;
  }

  async execute() {
    return await ops.op_http_client_execute(this.#rid);
  }

  close() {
    if (this.#rid) {
      Deno.core.close(this.#rid);
      this.#rid = undefined;
    }
  }

  [Symbol.dispose]() {
    this.close();
  }
}

((globalThis) => {




  function argsToMessage(...args) {
    return args.map((arg) => JSON.stringify(arg)).join(" ");
  }

  globalThis.HttpClient = HttpClient

  globalThis.md5 = (arg) => {
    return core.ops.op_md5(arg);
  }

  globalThis.uuid = (arg) => {
    return core.ops.op_uuid(arg);
  }

  globalThis.snowid = (arg) => {
    return core.ops.op_snowid(arg);
  }

  globalThis.Handlebars = {
    render: (template, data) => {
      return core.ops.handlebars_render(template, data);
    }
  }

  globalThis.console = {
    log: (args) => {
      core.ops.println(args);
    },
    error: (args) => {
      core.ops.eprintln(args);
    },
  };

  globalThis.fs = {
    read_xls: (path) => {
      return core.ops.op_read_xls(path);
    },
    create: (path) => {
      return core.ops.op_fs_create_file(path);
    },
    append: (path, content) => {
      return core.ops.op_fs_append(path, content);
    },
    copy: (src, dst) => {
      return core.ops.op_fs_copy_file(src, dst);
    },
    create_dir: (path) => {
      return core.ops.op_fs_create_dir(path);
    },
    read_dir: (path) => {
      return core.ops.op_fs_read_dir(path);
    },
    is_dir: (path) => {
      return core.ops.op_fs_is_dir(path);
    },
    is_file: (path) => {
      return core.ops.op_fs_is_file(path);
    },
    create_dir_all: (path) => {
      return core.ops.op_fs_create_dir_all(path);
    },
    exists: (path) => {
      return core.ops.op_fs_exists(path);
    },
    hard_link: (src, dst) => {
      return core.ops.op_fs_hard_link(src, dst);
    },
    read_to_string: (path) => {
      return core.ops.op_fs_read_to_string(path);
    },
    remove_dir: (path) => {
      return core.ops.op_fs_remove_dir(path);
    },
    remove_dir_all: (path) => {
      return core.ops.op_fs_remove_dir_all(path);
    },
    remove_file: (path) => {
      return core.ops.op_fs_remove_file(path);
    },
    rename: (src, dst) => {
      return core.ops.op_fs_rename(src, dst);
    },
    write: (path, contents) => {
      return core.ops.op_fs_write(path, contents);
    },
    read_to_line: (filePath) => {
      return core.ops.op_fs_read_line(filePath);
    }

  };

  globalThis.http = {
    get: async (url, headers) => {
      return core.ops.op_http_get(url, headers);
    },
    post: async (url, headers, body) => {
      return core.ops.op_http_post(url, headers, body);
    },
    postForm: async (url, headers, formData) => {
      return core.ops.op_http_post_form(url, headers, formData);
    },
    put: async (url, headers, body) => {
      return core.ops.op_http_put(url, headers, body);
    },
    upload: async (url, headers, formFields, files, customHeaders) => {
      return core.ops.op_http_post_upload(url, headers, formFields, files, customHeaders);
    },
    delete: async (url, headers) => {
      return core.ops.op_http_delete(url, headers);
    },
    getCookies: async () => {
      return core.ops.op_http_get_cookies();
    },
    clearCookies: async () => {
      return core.ops.op_http_clear_cookies();
    },
    setCookie: async (name, value, domain, path, expires, secure, httpOnly) => {
      return core.ops.op_http_set_cookie(name, value, domain, path, expires, secure, httpOnly);
    },
  }
})(globalThis);




