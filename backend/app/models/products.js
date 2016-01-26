var sql = require('sql');

var columns = [
    'id',
    'title',
    'description',
    'projectId',
    'matrixId',
    'originalLangId'
    //'workflowId'
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

Product.editCols = ['title', 'description', 'projectId', 'matrixId', 'workflowId'];

//Product.translate = translate;

module.exports = Product;
