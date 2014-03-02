  if (hadDefine) {
    window.define = oldDefine;
  }
  else {
    delete window.define;
  }
  return <%= moduleName %>;
}));
