const utils = require("../utils");
const transmogrify = require("transmogrify-amd");

var DefineTransformer = transmogrify.Transformers.Define.prototype;

function AnonymousDefineTransformer(transform) {
  this.transform = transform;

  // Shadow properties from the passed in transform object.
  this.args = transform.args;
  this.node = transform.node;
  this.context = transform.context;

  // By default the module is the provided moduleName off the context.
  this.moduleName = this.context.moduleName;
}

// Proxy the DefineTransformer's methods via the prototype.
AnonymousDefineTransformer.prototype = Object.create(DefineTransformer);

/**
 * Define a new module with an anonymous identfier requested from the context
 * or use the one provided on the instance.
 */
AnonymousDefineTransformer.prototype.defineModule = function(value) {
  var identifier = this.moduleName || this.context.moduleName;
  this.context.register(this.moduleName, identifier);
  return this.context.writeIdentifier(identifier) + " = " + value;
};

/**
 * Define calls that do not contain arguments are assumed to be undefined
 * modules.
 */
AnonymousDefineTransformer.prototype.noArguments = function() {
  return DefineTransformer.noArguments.apply(this, arguments);
};

AnonymousDefineTransformer.prototype.singleArgument = function() {
  // Cache the first argument for easier typing.
  var arg = this.args[0];
  var source = "";

  // If the first argument is a function, handle it differently from all other
  // values.
  if (arg.type === "FunctionExpression") {
    var params = arg.params;

    // If the first argument we hit is `require` then we are now CJS.
    if (params.length && params[0].name === "require") {
      source = this.wrapCJS(params, arg.body.source());
      // TODO Handle Source
      console.log('multi define', source);
    }

    // Otherwise we can assume it's a single AMD define.
    else {
      source = "(" + arg.source() + ")()";
      // TODO Handle Source
      console.log('single define', source, this.moduleName);
    }
  }

  // Special case empty named defines.
  else if (utils.isString(arg.value)) {
    // Use the existing name or fall back to the value in the argument.
    this.moduleName = this.moduleName || arg.value;
    console.log('empty named define', this.moduleName);
  }

  else {
    this.node.update(this.defineModule(arg.source()));
  }

  return DefineTransformer.singleArgument.apply(this, arguments);
};

AnonymousDefineTransformer.prototype.multipleArguments = function() {
  var arg = this.args[0];
  var arg1 = this.args[1];
  var transformer;

  // If the first argument is a String, it's a module identifier.
  if (utils.isString(arg.value)) {
    if (this.args.length === 2) {
      transformer = new AnonymousDefineTransformer(this.transform);
      transformer.args = transformer.args.slice(1);
      transformer.moduleName = this.moduleName || arg.value;

      // Run the single argument.
      transformer.singleArgument();
    }

    // If the first argument is a String,
    else if (utils.isString(arg.value) && this.args.length > 2) {
      transformer = new AnonymousDefineTransformer(this.transform);
      transformer.args = transformer.args.slice(1);
      transformer.moduleName = this.moduleName || arg.value;

      // Run the single argument.
      transformer.multipleArguments();
    }
  }

  // If the first argument is an array, it's dependencies.
  else if (arg.type === "ArrayExpression") {
    //var source = this.wrapAMD(arg.elements, arg1.body.source(), arg1.params);
    console.log('dependencies', arg.elements);
    arg.elements.forEach(function(element) {
      this.deps.push(element.value);
    }, this);
    //this.node.update(this.defineModule(source));
  }

  return DefineTransformer.multipleArguments.apply(this, arguments);
};

module.exports = AnonymousDefineTransformer;
