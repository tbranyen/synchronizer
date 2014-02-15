var optimize = require('../').optimize;

suite('optimize', function() {
  test('optimize twice', function() {
    optimize('test/fixtures/b.js');
    optimize('test/fixtures/b.js');
  });
});
