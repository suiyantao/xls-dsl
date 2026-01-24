/**
 * handlebars 模板引擎，提供渲染模板的功能。
 */
const Handlebars = {
  /**
   * 渲染模板的方法。
   *
   * @param {string} template - 要渲染的模板字符串。
   * @param {object} data - 用于填充模板的数据对象。
   * @returns {string} - 渲染后的字符串。
   */
  render: function (template, data) {},
};

/**
 * 文件流操作api，提供一系列文件和目录的操作方法
 */
const fs = {
  /**
   * 创建文件，若文件已存在则会截断文件，将文件内容清空。
   *
   * @param {string} filePath 文件的完整路径，包含文件名和扩展名。
   * @return {void} 该方法没有返回值。
   */
  create: function (filePath) {},
  /**
   * 向指定文件追加文本内容。若文件不存在，则会创建该文件。
   *
   * @param {string} filePath 文件的完整路径，包含文件名和扩展名。
   * @param {string} content  要追加到文件中的文本内容。
   * @return {void} 该方法没有返回值。
   */
  append: function (filePath, content) {},
  /**
   * 异步读取xls文件内容，将文件中的数据以二维数组的形式返回。
   *
   * @param {string=} filePath 文件的完整路径，包含文件名和扩展名。可选参数，若未提供，则默认读取选择的文件。
   * @return {Promise<Array<Array>>} 一个Promise对象，解析为一个二维数组，代表xls文件中的数据。
   */
  read_xls: async function (filePath) {},
  /**
   * 复制文件，将源文件复制到指定的目标路径。
   *
   * @param {string} src 源文件的完整路径，包含文件名和扩展名。
   * @param {string} dst 目标文件的完整路径，包含文件名和扩展名。
   * @return {void} 该方法没有返回值。
   */
  copy: function (src, dst) {},
  /**
   * 创建单个目录，若目录已存在则会抛出错误。
   *
   * @param {string} path 要创建的目录的完整路径。
   * @return {void} 该方法没有返回值。
   */
  create_dir: function (path) {},
  /**
   * 读取指定目录中的所有文件和子目录。
   *
   * @param {string} path 要读取的目录的完整路径。
   * @return {Array<string>} 一个Promise对象，解析为一个字符串数组，包含目录中的所有文件和子目录的名称。
   */
  read_dir: function (path) {},
  /**
   * 检查指定路径是否为一个目录。
   *
   * @param {string} path 要检查的目录的完整路径。
   * @return {boolean} 若路径是一个目录则返回true，否则返回false。
   */
  is_dir: function (path) {},
  /**
   * 检查指定路径是否为一个文件。
   *
   * @param {string} path 要检查的文件的完整路径。
   * @return {boolean} 若路径是一个文件则返回true，否则返回false。
   */
  is_file: function (path) {},
  /**
   * 递归创建目录，若目录已存在则不会报错，会自动跳过已存在的目录。
   *
   * @param {string} path 要创建的目录的完整路径，支持多级目录。
   * @return {void} 该方法没有返回值。
   */
  create_dir_all: function (path) {},
  /**
   * 检查指定路径的文件或目录是否存在。
   *
   * @param {string} path 文件或目录的完整路径。
   * @return {boolean} 若文件或目录存在则返回true，否则返回false。
   */
  exists: function (path) {},
  /**
   * 创建硬链接，将源文件链接到目标路径。
   *
   * @param {string} src 源文件的完整路径，包含文件名和扩展名。
   * @param {string} dst 目标硬链接的完整路径，包含链接名。
   * @return {void} 该方法没有返回值。
   */
  hard_link: function (src, dst) {},
  /**
   * 读取文件内容并以字符串形式返回。
   *
   * @param {string=} filePath 文件的完整路径，包含文件名和扩展名。可选参数，若未提供，则默认读取选择的文件。
   * @return {string} 返回文件的全部内容。
   */
  read_to_string: function (filePath) {},
  /**
   * 删除单个目录，该目录必须为空，否则会抛出错误。
   *
   * @param {string} path 要删除的目录的完整路径。
   * @return {Promise<void>} 一个Promise对象，代表异步操作的完成。
   */
  remove_dir: function (path) {
    return Deno.core.opAsync("op_fs_remove_dir", path);
  },
  /**
   * 递归删除目录及其所有内容，包括子目录和文件。
   *
   * @param {string} path 要删除的目录的完整路径。
   * @return {Promise<void>} 一个Promise对象，代表异步操作的完成。
   */
  remove_dir_all: function (path) {
    return Deno.core.opAsync("op_fs_remove_dir_all", path);
  },
  /**
   * 删除指定文件。
   *
   * @param {string} path 要删除的文件的完整路径，包含文件名和扩展名。
   * @return {Promise<void>} 一个Promise对象，代表异步操作的完成。
   */
  remove_file: function (path) {
    return Deno.core.opAsync("op_fs_remove_file", path);
  },
  /**
   * 重命名文件或移动文件到新路径。
   *
   * @param {string} src 源文件的完整路径，包含文件名和扩展名。
   * @param {string} dst 目标文件的完整路径，包含新的文件名和扩展名。
   * @return {void} 该方法没有返回值。
   */
  rename: function (src, dst) {},
  /**
   * 将指定内容写入文件，会覆盖原有内容。若文件不存在，则会创建该文件。
   *
   * @param {string} path 文件的完整路径，包含文件名和扩展名。
   * @param {string} contents 要写入文件的内容。
   * @return {Promise<void>} 一个Promise对象，代表异步操作的完成。
   */
  write: function (path, contents) {
    return Deno.core.opAsync("op_fs_write", [path, contents]);
  },
  /**
   * 逐行读取文件内容并返回字符串数组。
   *
   * @param {string=} filePath 文件的完整路径，包含文件名和扩展名。可选参数，若未提供，则默认读取选择的文件。
   * @return {Array<string>} 返回一个字符串数组，每个元素代表文件的一行内容。
   */
  read_to_line: function (filePath) {},
};

/**
 * 生成一个通用唯一识别码（UUID），遵循标准的UUID格式。
 *
 * @return {string} 返回一个字符串形式的UUID。
 */
function uuid() {
  return "";
}

/**
 * 生成一个雪花ID，这是一种分布式唯一ID生成算法生成的ID。
 *
 * @return {string} 返回一个字符串形式的雪花ID。
 */
function snowid() {
  return "";
}

/**
 * 对输入的文本进行MD5编码，返回编码后的十六进制字符串。
 *
 * @param {string} content 要进行MD5编码的文本。
 * @return {string} 返回MD5编码后的十六进制字符串。
 */
function md5(content) {
  return "";
}

export class HttpClient {
  constructor(url) {}
  /**
   * 设置HTTP请求方法。
   *
   * @param {HttpMethod} method HTTP请求方法，如GET、POST等。
   * @return {HttpClient} 返回当前HttpClient实例，用于链式调用。
   */
  method(method) {
    return this;
  }

  /**
   * 设置HTTP请求头。
   *
   * @param {string} key 请求头的键。
   * @param {*} value 请求头的值。
   * @return {HttpClient} 返回当前HttpClient实例，用于链式调用。
   */
  header(key, value) {
    return this;
  }

  /**
   * 设置HTTP请求头。
   *
   * @param {Object} headers 请求头，键值对形式。
   * @return {HttpClient} 返回当前HttpClient实例，用于链式调用。
   */
  headers(headers) {
    return this;
  }
  /**
   * 设置HTTP请求参数。
   *
   * @param {Object} params 请求参数，键值对形式。
   * @return {void} 该方法没有返回值。
   */
  params(params) {
    return this;
  }

  /**
   * 设置HTTP请求体。
   *
   * @param {Object} body 请求体，键值对形式。
   * @return {HttpClient} 返回当前HttpClient实例，用于链式调用。
   */
  body(body) {
    return this;
  }
  /**
   * 发送HTTP请求。
   *
   * @return {Promise<HttpResponse>} 返回一个Promise对象，解析为Response对象。
   */
  async execute() {}
}

const HttpMethod = Object.freeze({
  GET: "Get",
  POST: "Post",
  PUT: "Put",
  DELETE: "Delete",
});

class HttpResponse {
  constructor(status, headers, body, duration_ms) {
    this.status = status;
    this.headers = headers;
    this.body = body;
    this.duration_ms = duration_ms;
  }
}

const http = {
  /**
   * 发送HTTP GET请求。
   *
   * @param {string} url 请求的URL。
   * @param {Object=} headers 可选的请求头，键值对形式，可省略。
   * @return {Promise<Response>} 返回一个Promise对象，解析为Response对象。
   */
  get: async function (url, headers) {
    return Deno.core.opAsync("op_http_get", [url, headers]);
  },

  /**
   * 发送HTTP POST请求。
   *
   * @param {string} url 请求的URL。
   * @param {Object=} headers 可选的请求头，键值对形式。
   * @param {Object=} data 可选的POST数据，键值对形式。
   * @return {Promise<Response>} 返回一个Promise对象，解析为Response对象。
   */
  post: function (url, headers, data) {
    return Deno.core.opAsync("op_http_post", [url, headers, data]);
  },

  /**
   * 发送HTTP POST表单请求。
   *
   * @param {string} url 请求的URL。
   * @param {Object=} headers 可选的请求头，键值对形式。
   * @param {Object=} data 可选的POST表单数据，键值对形式。
   * @return {Promise<Response>} 返回一个Promise对象，解析为Response对象。
   */
  postForm: function (url, headers, data) {
    return Deno.core.opAsync("op_http_post_form", [url, headers, data]);
  },

  /**
   * 发送HTTP POST上传文件请求。
   *
   * @param {string} url 请求的URL。
   * @param {Object=} headers 可选的请求头，键值对形式。
   * @param {Object=} data 可选的POST上传文件数据，键值对形式。
   * @return {Promise<Response>} 返回一个Promise对象，解析为Response对象。
   */
  postUpload: function (url, headers, data) {
    return Deno.core.opAsync("op_http_post_upload", [url, headers, data]);
  },

  /**
   * 发送HTTP PUT请求。
   *
   * @param {string} url 请求的URL。
   * @param {Object=} headers 可选的请求头，键值对形式。
   * @param {Object=} data 可选的PUT数据，键值对形式。
   * @return {Promise<Response>} 返回一个Promise对象，解析为Response对象。
   */
  put: function (url, headers, data) {
    return Deno.core.opAsync("op_http_put", [url, headers, data]);
  },

  /**
   * 发送HTTP DELETE请求。
   *
   * @param {string} url 请求的URL。
   * @param {Object=} headers 可选的请求头，键值对形式。
   * @return {Promise<Response>} 返回一个Promise对象，解析为Response对象。
   */
  delete: function (url, headers) {
    return Deno.core.opAsync("op_http_delete", [url, headers]);
  },

  /**
   * 获取当前HTTP请求的所有cookies。
   *
   * @return {Promise<Array<Cookie>>} 返回一个Promise对象，解析为Cookie数组。
   */
  getCookies: function () {
    return Deno.core.opAsync("op_http_get_cookies", []);
  },

  /**
   * 清除当前HTTP请求的所有cookies。
   *
   * @return {Promise<void>} 返回一个Promise对象，代表异步操作的完成。
   */
  clearCookies: function () {
    return Deno.core.opAsync("op_http_clear_cookies", []);
  },

  /**
   * 设置当前HTTP请求的cookie。
   *
   * @param {string} name cookie的名称。
   * @param {string} value cookie的值。
   * @param {string} domain cookie的域名。
   * @param {string} path cookie的路径。
   * @param {Date=} expires 可选的过期时间，Date对象。
   * @param {boolean=} secure 是否仅通过HTTPS传输。
   * @param {boolean=} httpOnly 是否仅通过HTTP(S)访问。
   * @return {Promise<void>} 返回一个Promise对象，代表异步操作的完成。
   */
  setCookie: function (name, value, domain, path, expires, secure, httpOnly) {
    return Deno.core.opAsync("op_http_set_cookie", [
      name,
      value,
      domain,
      path,
      expires,
      secure,
      httpOnly,
    ]);
  },
};
