var sql = require('sql');

var columns = [
    'id',
    'workflowId',
    'name',
    'description',
    'projectId',
    'matrixId',
    'productConfigId',
    'contentType',
    'mode',
    'reportUrl',
    'analyticsUrl'
];

//var translate = [
//	'title',
//	'description'
//];

var Product = sql.define({
    name: 'Products',
    schema: 'proto_amida',
    columns: columns
});

//Product.translate = translate;

module.exports = Product;
