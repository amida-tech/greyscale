var sql = require('sql');

var columns =  [
    'id',
    'name',
    'description',
    'projectId',
    'matrixId',

    //'workflowId',
    //'productConfigId',
    //'contentType',
    //'mode',
    //'reportUrl',
    //'analyticsUrl'
];

//var translate = [
//	'title',
//	'description'
//];

var Product = sql.define({
  name: 'Products',
  columns: columns
});

//Product.translate = translate;

module.exports = Product;