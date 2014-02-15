var path = require("path");
var vm = require("vm");

var assert = require("chai").assert;

var optimize = require("../").optimize;

var initContext = {
  exports: {},
  require: function() {
    throw new Error("Synchronized source maintained a call to `require`");
  },
  define: function() {
    throw new Error("Synchronized source maintained a call to `define`");
  }
};

function optAndRun(fixtureName) {
  var sourceFile = path.join("test", "fixtures", fixtureName);
  var optimizedSrc = optimize(sourceFile);
  var context;
  initContext.module = {};
  initContext.global = {};
  context = vm.createContext(initContext);

  vm.runInContext(optimizedSrc, context);

  return context;
}

suite("optimize", function() {
  test("define", function() {
    var b = optAndRun("b.js").module.exports;
    assert.deepEqual(b, { msg: "Hello world!" });
  });
  test("require", function() {
    var glob = optAndRun("a.js").global;
    assert.deepEqual(
      glob.things,
      [ { msg: "Hello world!" }, { msg: "Hello world!" } ]
    );
  });
});
