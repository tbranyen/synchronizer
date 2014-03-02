  if (define.hadDefine) {
    window.define = define.originalDefine;
  }
  else {
    delete window.define;
  }

  return <%= moduleName %>;
}));
