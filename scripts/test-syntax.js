// Test the EXACT pattern from pages.js line 95
var h = '';
var e = {enTienda: true, id: 5};
h += '<button class="btn btn-sm "' + ' extra="x">';
console.log('test a:', h);

h += '<button class="btn btn-sm " + (e.enTienda ? "\'btn-green\'" : "\'btn-outline\'") + ' test';
console.log('test b:', h);
