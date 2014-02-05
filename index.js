var path = require("path");
var fs = require("fs");
var _ = require("lodash");
var transmoglify = require("amdclean");

var fragPath = path.join(__dirname, "fragments");

// A method that is used as `onBuildStart`.
var onBuildStart = _.once(function(name, config) {
  var shimConfiguration = config.shim;
  var context = new transmoglify.Context("default", name);

  // Prime the context with the shim configuration.
  Object.keys(shimConfiguration || {}).forEach(function(key) {
    context.register(key, "window['" + shimConfiguration[key].exports + "']");
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

  var ast = transmoglify.clean(source, config.context);
  return ast.toString();
};
