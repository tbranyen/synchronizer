const fs = require("fs");
const path = require("path");
const transmogrify = require("transmogrify-amd");
const falafel = require("falafel");
const _ = require("lodash");

const utils = require("./utils");

// Our transform normalizes dependencies and anonymous module names.
const DefineTransformer = require("./transformers/define");
const RequireTransformer = require("./transformers/require");

// Register the anonympous define transformer.
transmogrify.registerTransformer("define", DefineTransformer);
transmogrify.registerTransformer("require", RequireTransformer);

function Tree(startFile) {
  this.startFile = startFile;
  this.baseDir = path.dirname(startFile);
  this.modules = [];
  this.paths = {};
}

Tree.prototype.readFile = function(fileName) {
  return fs.readFileSync(fileName).toString();
};

// Will need to be aware of paths, packages, shim, and map.
Tree.prototype.pathToModule = function(fileName) {
  var stripBaseDir = new RegExp("^" + this.baseDir + "/");
  var moduleName = fileName.replace(stripBaseDir, "");

  // Strip off the extension.
  moduleName = moduleName.slice(0, moduleName.lastIndexOf("."));

  // Find the correct path from the paths configuration.
  _.each(this.paths, function(path, name) {
    if (moduleName === name) {
      moduleName = path;
    }
  });

  return moduleName;
};

Tree.prototype.moduleToPath = function(moduleName) {
  return (this.paths[moduleName] || path.join(this.baseDir, moduleName)) + ".js";
};

Tree.prototype.pathsIdentifier = function(identifier) {
  return (this.paths[identifier] || path.join(this.baseDir, identifier)) + ".js";
};

Tree.prototype.parse = function(fileName) {
  fileName = fileName || this.startFile;

  // Find the moduleName.
  var moduleName = this.pathToModule(fileName);

  // Find the source contents.
  var contents = this.readFile(fileName);

  // FIXME Better place for this reference?
  this.context.tree = this;
  this.context.fileName = fileName;

  // Initial pass, naming all defines and normalizing dependencies.
  var ast = new transmogrify.Parser(contents, this.context).parse();

  // TODO SourceMaps will need to be circulated here.
  // Reset the contents.
  contents = ast.toString();

  // Scan the contents for requires.
  var deps = this.scan(contents);

  // Now parse all dependencies.
  deps = deps.map(this.pathsIdentifier, this);

  if (deps.length) {
    deps.forEach(this.parse, this);
  }

  // Last thing is to add this moduleName and contents into the list.
  this.modules.push({
    moduleName: moduleName,
    path: fileName,
    source: contents,
    deps: deps
  });

  var seen = {};

  return _.filter(this.modules, function(module) {
    if (!seen[module.moduleName]) {
      seen[module.moduleName] = true;
      return true;
    }
  });
};

Tree.prototype._processNode = function(deps, node) {
  // Shorthand the `arguments` property to a non-restricted identifier.
  var args = node.arguments;

  // Exit early if not inspecting a `CallExpression` as we are only interested
  // in function calls.
  if (node.type !== "CallExpression") {
    return;
  }

  // Alias the extracted name of the function to avoid typing it so much.
  var functionName = node.callee.name;

  // If inspecting any registered calls, modify the AST based on the
  // `functionName`.
  if (functionName === "require" || functionName === "define") {
    var args = node.callee.parent.arguments;

    // First or second arguments are the only positions allowed for dependency
    // arrays.
    var arrayArg = args[0].type === "ArrayExpression" ? args[0] : args[1];
    var stringArg = args[0].type === "Literal" ? args[0] : args[1];

    // Rewrite the variable with the literal value or null.
    stringArg = stringArg ? stringArg.value : null;
    
    if (arrayArg) {
      // If we did not detect a valid array, set to null.
      arrayArg = arrayArg.type === "ArrayExpression" ? arrayArg : null;

      var elements = arrayArg ? arrayArg.elements : [];

      elements = elements.map(function(element) {
        return element.value;
      });

      deps.push.apply(deps, elements);
    }

    // If the first argument is a String it's dependencies.
    else if (node.callee.name === "require" && utils.isString(stringArg)) {
      deps.push(stringArg);
    }
  }
};

/**
 * Scans for dependencies.
 */
Tree.prototype.scan = function(contents) {
  var deps = [];
  falafel(contents, this._processNode.bind(this, deps));
  return deps;
};

module.exports = Tree;
