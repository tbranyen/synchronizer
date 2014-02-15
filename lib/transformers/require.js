const path = require("path");
const utils = require("../utils");
const transmogrify = require("transmogrify-amd");

var RequireTransformer = transmogrify.Transformers.Require.prototype;

/**
 *
 */
function NormalizeRequireTransformer(transform) {
  this.transform = transform;

  // Shadow properties from the passed in transform object.
  this.args = transform.args;
  this.node = transform.node;
  this.context = transform.context;

  // Short hand these references to context properties.
  this.tree = this.context.tree;
  this.fileName = this.context.fileName;

  // By default the module is the provided moduleName off the context.
  this.moduleName = this.context.moduleName;

}

// Proxy the RequireTransformer's methods via the prototype.
NormalizeRequireTransformer.prototype = Object.create(RequireTransformer);

/**
 * Empty require calls do not need to be normalized.
 */
NormalizeRequireTransformer.prototype.noArguments = function() {};

/**
 * Single argument require's simply need their identifier replaced.
 */
NormalizeRequireTransformer.prototype.singleArgument = function() {
  var arg = this.args[0];
  var moduleName = this.tree.moduleToPath(arg.value, this.fileName);

  this.node.update("require('" + moduleName + "')");
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
      var normalized = this.tree.moduleToPath(element.value, this.fileName);

      return "\"" + normalized + "\"";
    }, this) + "]";

    arg.update(value);
  }
};

module.exports = NormalizeRequireTransformer;
