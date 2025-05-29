/**
 * 文件流操作api
 */
const fs = {
    /**
     * 创建文件，若文件已存在则会截断文件
     *
     * @param {string} filePath 文件地址
     * @return {void} 返回值描述
     */
    create: function(filePath) {
    },
    /**
     * 追加文本
     *
     * @param {string} filePath 文件地址
     * @param {string} content  文本
     * @return {void} 返回值描述
     */
    append: function(filePath, content) {
    },
    /**
     * 读取xls文件
     *
     * @param {string=} filePath 文件地址，可选参数 默认读取选择的文件
     * @return {Promise<Array<Array>>} 返回值描述
     */
    read_xls: async function(filePath) {
    },
    /**
     * 复制文件，将源文件复制到目标路径
     *
     * @param {string} src 源文件地址
     * @param {string} dst 目标文件地址
     * @return {void} 返回值描述
     */
    copy: function(src, dst) {
    },
    /**
     * 创建单个目录，若目录已存在则报错
     *
     * @param {string} path 目录地址
     * @return {void} 返回值描述
     */
    createDir: function(path) {
    },
    /**
     * 递归创建目录，若目录已存在则不报错
     *
     * @param {string} path 目录地址
     * @return {void} 返回值描述
     */
    createDirAll: function(path) {
    },
    /**
     * 检查指定路径的文件或目录是否存在
     *
     * @param {string} path 文件或目录地址
     * @return {boolean} 返回值描述
     */
    exists: function(path) {
    },
    /**
     * 创建硬链接，将源文件链接到目标路径
     *
     * @param {string} src 源文件地址
     * @param {string} dst 目标硬链接地址
     * @return {void} 返回值描述
     */
    hardLink: function(src, dst) {
    },
    /**
     * 读取文件内容并以字符串形式返回
     *
     * @param {string=} filePath 文件地址，可选参数 默认读取选择的文件
     * @return {string} 返回文件内容
     */
    readToString: function(filePath) {
    },
    /**
     * 删除单个目录，目录必须为空
     *
     * @param {string} path 目录地址
     * @return {void} 返回值描述
     */
    removeDir: function(path) {
        return Deno.core.opAsync('op_fs_remove_dir', path);
    },
    /**
     * 递归删除目录及其所有内容
     *
     * @param {string} path 目录地址
     * @return {void} 返回值描述
     */
    removeDirAll: function(path) {
        return Deno.core.opAsync('op_fs_remove_dir_all', path);
    },
    /**
     * 删除指定文件
     *
     * @param {string} path 文件地址
     * @return {void} 返回值描述
     */
    removeFile: function(path) {
        return Deno.core.opAsync('op_fs_remove_file', path);
    },
    /**
     * 重命名文件或移动文件到新路径
     *
     * @param {string} src 源文件地址
     * @param {string} dst 目标文件地址
     * @return {void} 返回值描述
     */
    rename: function(src, dst) {
    },
    /**
     * 将指定内容写入文件，会覆盖原有内容
     *
     * @param {string} path 文件地址
     * @param {string} contents 要写入的内容
     * @return {void} 返回值描述
     */
    write: function(path, contents) {
        return Deno.core.opAsync('op_fs_write', [path, contents]);
    },
    /**
     * 逐行读取文件内容并返回字符串向量
     *
     * @param {string=} filePath 文件地址，可选参数 默认读取选择的文件
     * @return {Array<string>} 返回值描述
     */
    readToLine: function(filePath) {
    }
}


/**
 * 生成UUID
 *
 * @return {string} 返回值描述
 */
function uuid() {
    return "";
}


/**
 * 生成雪花ID方法
 *
 * @return {string} 返回值描述
 */
function snowid() {
    return "";
}

/**
 * MD5编码
 *
 * @param {string} content 文本
 * @return {string} 返回值描述
 */
function md5(content) {
    return "";
}


/**
 * 打印
 *
 * @param {string} content 文本
 * @return {void}
 */
function println(content) {
}
