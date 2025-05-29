((globalThis) => {
  const core = Deno.core;

  function argsToMessage(...args) {
    return args.map((arg) => JSON.stringify(arg)).join(" ");
  }

  globalThis.md5=(arg)=>{
    return core.ops.op_md5(arg);
  }

  globalThis.uuid=(arg)=>{
    return core.ops.op_uuid(arg);
  }

  globalThis.snowid=(arg)=>{
    return core.ops.op_snowid(arg);
  }

  globalThis.console = {
    log: (...args) => {
      core.ops.println(`${args.toString()}`);
    },
    error: (...args) => {
      core.ops.eprintln(`${args.toString()}`);
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
    createDir: (path) => {
      return core.ops.op_fs_create_dir(path);
    },
    createDirAll: (path) => {
      return core.ops.op_fs_create_dir_all(path);
    },
    exists: (path) => {
      return core.ops.op_fs_exists(path);
    },
    hardLink: (src, dst) => {
      return core.ops.op_fs_hard_link(src, dst);
    },
    readToString: (path) => {
      return core.ops.op_fs_read_to_string(path);
    },
    removeDir: (path) => {
      return core.ops.op_fs_remove_dir(path);
    },
    removeDirAll: (path) => {
      return core.ops.op_fs_remove_dir_all(path);
    },
    removeFile: (path) => {
      return core.ops.op_fs_remove_file(path);
    },
    rename: (src, dst) => {
      return core.ops.op_fs_rename(src, dst);
    },
    write: (path, contents) => {
      return core.ops.op_fs_write(path, contents);
    },
    readToLine: (filePath) => {
      return core.ops.op_fs_read_line(filePath);
    }

  };
})(globalThis);
