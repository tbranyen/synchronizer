const path = require("path");
const fs = require("fs");
const _ = require("lodash");
const transmogrify = require("transmogrify-amd");

const utils = require("./utils");
const Tree = require("./tree");

var fragPath = path.join(__dirname, "fragments");

exports.optimize = function(fileName, config) {
  var startFrag = String(fs.readFileSync(path.join(fragPath, "start.frag")));
  var endFrag = String(fs.readFileSync(path.join(fragPath, "end.frag")));

  // Easy way of handling defaults.
  config = _.defaults(config || {}, {
    name: "__EXPORTS__",

    deps: [],

    spaces: 2,

    writeRequire: function(dep) {
      return "require('" + dep + "');";
    }
  });

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
  config.context = config.context || new transmogrify.Context("name", config.name);

  // Attach the entry module name for exposing.
  try {
    config.moduleName = tree.moduleToPath(fileName).slice(0, -3);
  }
  catch (ex) {
    config.moduleName = "null";
  }

  // Set the context on the tree.
  tree.context = config.context;

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
  var parsed = tree.parse().forEach(function(module) {
    // Ensure the correct transformers are registered.
    transmogrify.registerTransformer("define", transmogrify.Transformers.Define);
    transmogrify.registerTransformer("require", transmogrify.Transformers.Require);

    // Store the moduleName on the context.
    config.context.moduleName = module.moduleName;

    // Build out the AST from the source.  Reuse the existing context each time
    // to remain consistent.
    var ast = transmogrify.clean(module.source, config.context);

    // Add this source content to the final build.
    sources.push(utils.indent(ast.toString(), config.spaces));
  });

  // Update the moduleName now.
  config.moduleName = config.context.lookup(config.moduleName);

  // Add the outro.
  sources.push(config.wrap.end(config));

  // Add a new line between each concatenated file.
  return sources.join("\n").trim();
};
