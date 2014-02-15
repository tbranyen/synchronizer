var optimize = require('../').optimize;

suite('optimize', function() {
  test('require module', function() {
    optimize('test/fixtures/b.js');
  });
});
