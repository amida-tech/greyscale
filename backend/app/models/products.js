var sql = require('sql');

var columns = [
    'id',
    'title',
    'description',
    'projectId',
    'originalLangId',
    'surveyId',
    'status'
];

var Product = sql.define({
    name: 'Products',
    columns: columns
});

Product.statuses = [
    0, //'PLANNING'
    1, //'STARTED'
    2, //'SUSPENDED'
    3, //'COMPLETED'
    4 //'CANCELLED'
];

Product.editCols = ['title', 'description', 'projectId', 'surveyId', 'status'];
Product.whereCol = [ 'projectId', 'surveyId', 'status'];

Product.translate = [
    'title',
    'description'
];

module.exports = Product;
