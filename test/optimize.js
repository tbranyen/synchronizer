var assert = require("chai").assert;
var optAndRun = require("./utils/optAndRun");

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

  test("exclude", function() {
    var options = {
      exclude: ["b"]
    };

    var glob = optAndRun("a.js", options).global;

    assert.deepEqual(
      glob.things,
      [ undefined, { msg: "Hello world" } ]
    );
  });
});
