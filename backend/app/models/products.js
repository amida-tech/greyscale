var sql = require('sql');

var columns =  [
  'id', 
  'title', 
  'description', 
  'matrixId'
];

var Product = sql.define({
  name: 'Products',
  columns: columns
});

module.exports = Product;