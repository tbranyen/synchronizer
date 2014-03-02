const path = require("path");
const fs = require("fs");
const _ = require("lodash");
const transmogrify = require("transmogrify-amd");

const utils = require("./utils");
const Tree = require("./tree");
const Module = require("./module");

var fragPath = path.join(__dirname, "fragments");

exports.optimize = function(fileName, config) {
  var startFrag = String(fs.readFileSync(path.join(fragPath, "start.frag")));
  var endFrag = String(fs.readFileSync(path.join(fragPath, "end.frag")));

  // Specify sane defaults.
  config = _.defaults(config || {}, {
    name: "",
    deps: [],
    exclude: [],
    spaces: 2,

    writeDefine: function(dep) {
      return "\"" + dep + "\"";
    },

    writeRequire: function(dep) {
      return "require(\"" + dep + "\")";
    },

    writeCJS: function(deps) {
      var requires = deps.map(this.writeRequire);
      return requires.length ? requires : "undefined";
    },

    writeGlobal: function(dep) {
      return "var " + dep + " = " + "window[\"" + dep + "\"];\n";
    }
  });

  // Attach all modules into the `define.modules` namespace.
  var moduleNamespace = "define.modules";

  // Set the configuration object on the module prototype, so that it live
  // updates and so that we do not need to pass it into every instance.
  Module.prototype.config = config;

  // FIXME The logic here is too complex.
  // Set the start and end fragments.  Allow for these options to be supplied
  // upstream by using: `{ start: "(function() {", end: "})();" }`
  config.wrap = {
    start: _.template(config.wrap ? config.wrap.start : startFrag),
    end: _.template(config.wrap ? config.wrap.end : endFrag)
  };

  var tree = new Tree(fileName);
  var sources = [config.wrap.start(config)];

  // Always associate a Context with a configuration so that it may be
  // overwritten.
  config.context = config.context || new transmogrify.Context("name", moduleNamespace);

  // Set the context on the tree.
  tree.context = config.context;

  // Give the tree access to the configuration.
  tree.config = config;

  // Normalize all exclude paths.
  config.exclude = config.exclude.map(function(name) {
    var moduleName = new Module(name, tree.baseDir).moduleName();

    // Internally register the exclusion as undefined.  This avoids module not
    // found errors.
    config.context.register(moduleName, "undefined");

    return moduleName;
  });

  // Prime the context with the shim configuration.
  Object.keys(config.shim || {}).forEach(function(key) {
    config.context.register(key, config.shim[key].exports, "window");
  });

  // Prime the context with the shim configuration.
  Object.keys(config.paths || {}).forEach(function(key) {
    tree.paths[key] = config.paths[key];
    config.context.register(config.paths[key], key);
  });

  // Parse out the dependency tree and for each source, optimize and add to the
  // list of sources.
  tree.parse().forEach(function(module) {
    // Ensure the correct transformers are registered.
    transmogrify.registerTransformer("define", transmogrify.Transformers.Define);
    transmogrify.registerTransformer("require", transmogrify.Transformers.Require);

    // Store the moduleName on the context.
    config.context.moduleName = module.moduleName;

    // Abort processing if the moduleName is excluded.
    if (config.exclude.indexOf(module.moduleName) > -1) {
      return;
    }

    // Build out the AST from the source.  Reuse the existing context each time
    // to remain consistent.
    var ast = transmogrify.clean(module.source, config.context);

    // Add this source content to the final build.
    sources.push(utils.indent(ast.toString(), config.spaces));
  });

  // Attach the entry module name for exposing.
  try {
    config.moduleName = tree.moduleToPath(fileName).slice(0, -3);

    // Update the moduleName from context.
    config.moduleName = config.context.lookup(config.moduleName);
  }
  catch (ex) {
    config.moduleName = "null";
  }

  // Add the outro.
  sources.push(config.wrap.end(config));

  // Add a new line between each concatenated file.
  return sources.join("\n").trim();
};
