const path = require("path");
const utils = require("../utils");
const transmogrify = require("transmogrify-amd");

var RequireTransformer = transmogrify.Transformers.Define.prototype;

/**
 *
 */
function NormalizeRequireTransformer(transform) {
  this.transform = transform;

  // Shadow properties from the passed in transform object.
  this.args = transform.args;
  this.node = transform.node;
  this.context = transform.context;

  // By default the module is the provided moduleName off the context.
  this.moduleName = this.context.moduleName;
}

// Proxy the RequireTransformer's methods via the prototype.
NormalizeRequireTransformer.prototype = Object.create(RequireTransformer);

/**
 * Define calls that do not contain arguments are assumed to be undefined
 * modules.
 */
NormalizeRequireTransformer.prototype.noArguments = function() {};

/**
 *
 */
NormalizeRequireTransformer.prototype.singleArgument = function() {
  var arg = this.args[0];
  var normalized = path.join(this.context.fileName, "../", arg.value) + ".js";

  this.node.update(this.context.tree.pathToModule(normalized));
};

/**
 *
 */
NormalizeRequireTransformer.prototype.multipleArguments = function() {
  var arg = this.args[0];
  var arg1 = this.args[1];
  var value = "";

  // If the first argument is an array, it's dependencies.
  if (arg.type === "ArrayExpression") {
    value = "[" + arg.elements.map(function(element) {
      // FIXME Don't hardcode the filename???
      var normalized = path.join(this.context.fileName, "../", element.value) + ".js";
      return "\"" + this.context.tree.pathToModule(normalized) + "\"";
    }, this) + "]";

    arg.update(value);
  }
};

module.exports = NormalizeRequireTransformer;
