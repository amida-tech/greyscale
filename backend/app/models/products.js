var sql = require('sql');

var columns = [
    'id',
    'title',
    'description',
    'projectId',
    'originalLangId',
    'surveyId',
    'status',
    'workflowTemplateId'
];

var Product = sql.define({
    name: 'Products',
    columns: columns
});

Product.statuses = {
    0: 'Planning',
    1: 'Started',
    2: 'Suspended',
    3: 'Completed',
    4: 'Cancelled'
};

Product.editCols = ['title', 'description', 'projectId', 'surveyId', 'status', 'workflowTemplateId'];
Product.whereCol = [ 'projectId', 'surveyId', 'status'];

Product.translate = [
    'title',
    'description'
];

module.exports = Product;
