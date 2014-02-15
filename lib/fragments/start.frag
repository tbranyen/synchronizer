(function(window, factory) {
  "use strict";

  // AMD. Register as an anonymous module.  Wrap in function so we have access
  // to root via `this`.
  if (typeof define === "function" && define.amd) {
    return define([<%= deps %>], function() {
      return factory.apply(window, arguments);
    });
  }
  
  // Node. Does not work with strict CommonJS, but only CommonJS-like
  // enviroments that support module.exports, like Node.
  else if (typeof exports === "object") {
    module.exports = factory(<%= deps.map(writeRequire) %>);
  }

  // Browser globals.
  else {
    window.<%= name %> = factory.call(window);
  }
}(typeof global === "object" ? global : this, function(<%= deps %>) {
  "use strict";

  // The exports object that contains all modules.
  var <%= name %> = {};

  // Set window to always equal the global object.
  var window = this;
