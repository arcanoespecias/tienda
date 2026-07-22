var o = {
  f() {
    var h = '<td>' +
      '<button class="btn " + (true ? "'btn-green'" : "'x'") + '" onclick="foo(\'bar\')">text</button>' +
      '</td>';
  }
};
