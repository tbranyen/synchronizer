## How to use.

Inside your RequireJS configuration:

``` javascript
onBuildWrite: function(moduleName, path, contents) {
  // First argument is a valid JS identifier name of your project, this will be
  // exported to the global scope.  The second and third arguments are used
  // internally to optimize each file.
  return require("synchronizer").optimizer("MyProject", this, contents);
}
```
