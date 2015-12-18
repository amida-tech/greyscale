var sql = require('sql');

var columns =  [
  'id', 
  'title', 
  'description', 
  'matrixId',
  'originalLangId'
];

var translate = [
	'title',
	'description'
];

var Product = sql.define({
  name: 'Products',
  columns: columns
});

Product.translate = translate;

module.exports = Product;