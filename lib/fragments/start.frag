(function(window, factory) {
  "use strict";

  // AMD. Register as an anonymous module.  Wrap in function so we have access
  // to root via `this`.
  if (typeof define === "function" && define.amd) {
    return define([<%= _.keys(deps).map(writeDefine) %>], function() {
      return factory.apply(window, arguments);
    });
  }
  
  // Node. Does not work with strict CommonJS, but only CommonJS-like
  // enviroments that support module.exports, like Node.
  else if (typeof exports === "object") {
    module.exports = factory.call(window, <%= writeCJS(deps) %>);
  }

  // Browser globals.
  else {
    <%= _.values(deps).map(writeGlobal) %>
    var retVal = factory.call(window);

    <% if (name) { %>
    window.<%= name %> = retVal;
    <% } %>
  }
}(typeof global === "object" ? global : this, function(<%= deps %>) {
  "use strict";

  // Set window to always equal the global object.
  var window = typeof global === "object" ? global : this;

  // Repurpose the `define` function, as it is the only identifier we can
  // safely shadow.
  var define = function() {};

  // Save references to the original define and a boolean for whether or not
  // it was pre-existing.
  define.originalDefine = window.define;
  define.hadDefine = "define" in window;

  // The module namespace.
  define.modules = {};

  // Ensure AMD checks are satisfied in third-party code.
  define.amd = {};
