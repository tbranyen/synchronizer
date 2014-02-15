var optimize = require('../').optimize;

suite('optimize', function() {
  test('optimize `require` call', function() {
    optimize('test/fixtures/a.js');
    optimize('test/fixtures/b.js');
  });

  test('optimize `define` call twice', function() {
    optimize('test/fixtures/b.js');
    optimize('test/fixtures/b.js');
  });
});
