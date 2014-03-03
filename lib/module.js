const path = require("path");

function Module(name, baseDir) {
  this.name = name;
  this.dir = path.join(baseDir, name, "../");
  this.file = path.join(baseDir, name) + ".js";

  // Determine if the module name is relative.
  if (name.indexOf("../") === 0 || name.indexOf("./") === 0) {
    this.isRelative = true;
  }
}

Module.moduleName = function(fileName) {
  return fileName.slice(0, -3);
};

// Take this module and normalize to the path.
Module.prototype.relativeTo = function(module) {
  // If the module is a relative path, join to the module directory.
  if (this.isRelative) {
    return path.join(module.dir, this.name) + ".js";
  }

  return this.file;
};

// The module name is the absolute file path without the extension.
Module.prototype.moduleName = function() {
  return Module.moduleName(this.file);
};

module.exports = Module;
