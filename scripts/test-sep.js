var o = {
  f() {
    var cls = true ? "'btn-green'" : "'x'";
    var a = '<button class="btn " + cls + " onclick=\"foo(' + "'" + "'bar'" + "'" + ')" + ">text</button>";
  }
};
