const Module = require("../module");
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
  var module = new Module(arg.value, this.tree.baseDir);

  this.node.update("require('" + module.moduleName() + "')");
};

/**
 *
 */
NormalizeRequireTransformer.prototype.multipleArguments = function() {
  var arg = this.args[0];
  var value = "";

  // If the first argument is an array, it's dependencies.
  if (arg.type === "ArrayExpression") {
    value = "[" + arg.elements.map(function(element) {
      var module = new Module(element.value, this.tree.baseDir);
      return "\"" + module.moduleName() + "\"";
    }, this) + "]";

    arg.update(value);
  }
};

module.exports = NormalizeRequireTransformer;
