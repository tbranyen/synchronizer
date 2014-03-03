var path = require("path");
var vm = require("vm");
var optimize = require("../../").optimize;

var initContext = {
  exports: {},
  require: function() {
    throw new Error("Synchronized source maintained a call to `require`");
  },
  define: function() {
    throw new Error("Synchronized source maintained a call to `define`");
  }
};

function optAndRun(fixtureName, options) {
  var sourceFile = path.join("test", "fixtures", fixtureName);
  var optimizedSrc = optimize(sourceFile, options);
  var context;
  initContext.module = {};
  initContext.global = {};
  context = vm.createContext(initContext);

  vm.runInContext(optimizedSrc, context);

  return context;
}

module.exports = optAndRun;
