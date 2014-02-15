exports.isString = function(val) {
  return String(val) === val;
};

exports.once = function(callback) {
  var called = false;

  return function() {
    if (!called) {
      callback.apply(this, arguments);
      called = true;
    }
  };
};

exports.indent = function(contents, spaces) {
  var lines = contents.split("\n");

  // Add one additional space for the 
  if (spaces !== "\t") {
    spaces = Array(spaces + 1).join(" ");
  }

  lines = lines.map(function(line) {
    if (line) {
      return spaces + line;
    }

    else {
      return "";
    }
  });

  return lines.join("\n");
};
