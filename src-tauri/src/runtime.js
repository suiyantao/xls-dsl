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
    readFile: (path) => {
      return core.ops.op_read_file(path);
    },
    writeFile: (path, contents) => {
      return core.ops.op_write_file(path, contents);
    },
    removeFile: (path) => {
      return core.ops.op_remove_file(path);
    },
    read_xls: (path) => {
      return core.ops.op_read_xls(path);
    },
    create: (path) => {
      return core.ops.op_file_create(path);
    },
    append: (path, contents) => {
      return core.ops.op_file_append(path, contents);
    },
    read_to_line: (path, contents) => {
      return core.ops.op_file_read_line(path, contents);
    },
    read_to_string: (path, contents) => {
      return core.ops.op_read_to_string(path, contents);
    }
  };
})(globalThis);
