const path = require("path");
const utils = require("../utils");
const transmogrify = require("transmogrify-amd");

var DefineTransformer = transmogrify.Transformers.Define.prototype;

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
 * Define calls that do not contain arguments are assumed to be undefined
 * modules.
 */
NormalizeDefineTransformer.prototype.noArguments = function() {
};

NormalizeDefineTransformer.prototype.singleArgument = function() {
  var arg = this.args[0];
  var moduleName = this.context.tree.pathToModule(this.context.fileName);

  arg.update("\"" + moduleName + "\", " + arg.source());
};

/**
 * Ensure all anonymous defines are rewritten to named defines.
 */
NormalizeDefineTransformer.prototype.multipleArguments = function() {
  var arg = this.args[0];
  var previousValue = "";

  var moduleName = this.context.tree.pathToModule(this.context.fileName);

  // Find all anonymous defines.
  if (arg.type !== "Literal" && !utils.isString(arg)) {
    // If it's an ArrayExpression, we need to map the arguments and normalize
    // to a literal.
    if (arg.type === "ArrayExpression") {
      previousValue = "[" + arg.elements.map(function(element) {
        var moduleName = this.context.tree.pathToModule(this.context.fileName);
        return "\"" + moduleName + "\"";
      }, this) + "]";
    }

    // TODO Don't hardcode the style here.
    arg.update("\"" + moduleName + "\", " + previousValue);
  }

  //return DefineTransformer.multipleArguments.apply(this, arguments);
};

module.exports = NormalizeDefineTransformer;
