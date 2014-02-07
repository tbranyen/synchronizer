const path = require("path");
const fs = require("fs");
const _ = require("lodash");
const transmogrify = require("transmogrify-amd");

const utils = require("./utils");
const Tree = require("./tree");

// This will rewrite the anonymous define calls.
const AnonymousDefineTransformer = require("./transformers/anonymous");

// Register the anonympous define transformer.
transmogrify.registerTransformer("define", AnonymousDefineTransformer);

var fragPath = path.join(__dirname, "fragments");

// A method that is used as `onBuildStart`.
var onBuildStart = _.once(function(name, config) {
  var shimConfiguration = config.shim;
  var context = new transmogfify.Context("default", name);

  // Prime the context with the shim configuration.
  Object.keys(shimConfiguration || {}).forEach(function(key) {
    context.register(key, shimConfiguration[key].exports, "window");
  });

  var startFrag = String(fs.readFileSync(path.join(fragPath, "start.frag")));
  var endFrag = String(fs.readFileSync(path.join(fragPath, "end.frag")));

  // Set the start and end fragments.
  config.wrap = {
    start: _.template(startFrag)({ name: name }),
    end: _.template(endFrag)({ name: name }),
  };

  // Attach the context to the shared configuration object.
  config.context = context;
});

exports.optimize = function(name, config, source) {
  // This runs once.
  onBuildStart(name, config);

  // Build out the AST from the source.  Reuse the existing context each time
  // to remain consistent.
  var ast = transmogrify.clean(source, config.context);

  // Return the string contents of the modified source file.
  return ast.toString();
};


exports.optimize = function(fileName, config) {
  var startFrag = String(fs.readFileSync(path.join(fragPath, "start.frag")));
  var endFrag = String(fs.readFileSync(path.join(fragPath, "end.frag")));

  // Easy way of handling defaults.
  config = _.defaults(config || {}, {
    name: "__EXPORTS__",

    deps: [],

    writeRequire: function(dep) {
      return "require('" + dep + "');";
    }
  });

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

  // Set the context on the tree.
  tree.context = config.context;

  // Parse out the dependency tree and for each source, optimize and add to the
  // list of sources.
  var parsed = tree.parse().forEach(function(module) {
    // Store the moduleName on the context.
    config.context.moduleName = module.moduleName;

    // Build out the AST from the source.  Reuse the existing context each time
    // to remain consistent.
    var ast = transmogrify.clean(module.source, config.context);

    // Add this source content to the final build.
    sources.push(utils.indent(ast.toString(), 2));
  });

  // Add the outro.
  sources.push(config.wrap.end(config));

  // Add a new line between each concatenated file.
  return sources.join("\n");
};

exports.main = function() {};
