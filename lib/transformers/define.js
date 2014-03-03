const Module = require("../module");
const utils = require("../utils");
const transmogrify = require("transmogrify-amd");

var DefineTransformer = transmogrify.Transformers.Define.prototype;

/**
 * Represents a DefineTransformer that focuses on normalizing identifiers.
 *
 * @constructor
 * @param {Object} transform object to reference.
 */
function NormalizeDefineTransformer(transform) {
  this.transform = transform;

  // Shadow properties from the passed in transform object.
  this.args = transform.args;
  this.node = transform.node;
  this.context = transform.context;

  // By default the module is the provided moduleName off the context.
  this.moduleName = this.context.moduleName;
}

// Proxy the DefineTransformer's methods via the prototype.
NormalizeDefineTransformer.prototype = Object.create(DefineTransformer);

/**
 * Empty define's are still given an inline module name.
 */
NormalizeDefineTransformer.prototype.noArguments = function() {
  var arg = this.args[0];
  var moduleName = this.context.tree.pathToModule(this.context.fileName);
  arg.update("\"" + moduleName + "\"");
};

/**
 * Update single agument define's by shifting its value and adding the
 * moduleName.
 */
NormalizeDefineTransformer.prototype.singleArgument = function() {
  var arg = this.args[0];
  var moduleName = Module.moduleName(this.context.fileName);

  arg.update("\"" + moduleName + "\", " + arg.source());
};

/**
 * Ensure all anonymous defines are rewritten to named defines.
 */
NormalizeDefineTransformer.prototype.multipleArguments = function() {
  var arg = this.args[0];
  var moduleName = this.context.tree.pathToModule(this.context.fileName);
  var normalizeDeps = "";
  var functionArg = "";

  // Find all anonymous defines.
  if (arg.type !== "Literal" && !utils.isString(arg)) {
    // If it's an ArrayExpression, we need to map the arguments and normalize
    // to a literal.
    if (arg.type === "ArrayExpression") {
      // FIXME This can't be right, it's normalizing the same name every single time.
      normalizeDeps = "[" + arg.elements.map(function() {
        var moduleName = this.context.tree.pathToModule(this.context.fileName);
        return "\"" + moduleName + "\"";
      }, this) + "]";
    }

    // If a function argument was provided, ensure it's added as well.
    if (this.args.length > 2) {
      functionArg = ", " + this.args[1].source();
    }

    arg.update("\"" + moduleName + "\", " + normalizeDeps + functionArg);
  }
};

module.exports = NormalizeDefineTransformer;
