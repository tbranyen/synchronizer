# Synchronizer

> Build AMD projects into a single UMD file.

[![Build Status](https://travis-ci.org/tbranyen/synchronizer.png)](https://travis-ci.org/tbranyen/synchronizer)

## Install

You can install Synchronizer locally and use its API or you can install
globally to use as an executable.

Install using [NPM](http://npmjs.org/):

``` bash
npm install -g synchronizer
```

## Example

Optimize a project using the defaults.

``` bash
synchronizer lib/index > bundle.js
```

## Tests

Unit tests can be invoked from the command line via:

``` bash
npm test
```

## Documentation

At the moment there are no pubished resources for API documentation, but fear
not, you can generate the API documentation by running:

``` bash
npm run jsdoc
```

Once that completes you can open **docs/index.html** in your browser.

## License

Copyright (c) 2014 Mike Pennisi & Tim Branyen
Licensed under the MIT license.
