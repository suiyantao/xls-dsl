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

  globalThis.tera_template = (template, data) => {
    return core.ops.op_tera_template(template, data);
  }

  globalThis.handlebars_template = (template, data) => {
    return core.ops.handlebars_template(template, data);
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
    create_dir: (path) => {
      return core.ops.op_fs_create_dir(path);
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
})(globalThis);
