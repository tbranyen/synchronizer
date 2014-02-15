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
  var normalized = this.context.tree.moduleToPath(arg.value, this.context.fileName);

  console.log('single require', arg.value, normalized);

  this.node.update("require('" + normalized + "')");
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
      var normalized = this.context.tree.moduleToPath(element.value, this.context.fileName);

      console.log('multiple require', element.value, normalized);
      return "\"" + normalized + "\"";
    }, this) + "]";

    arg.update(value);
  }
};

module.exports = NormalizeRequireTransformer;
