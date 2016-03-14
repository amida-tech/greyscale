var sql = require('sql');

var columns = [
    'id',
    'productId',
    'title',
    'description',
    'divisor'
];

var Index = sql.define({
    name: 'Indexes',
    columns: columns
});

module.exports = Index;
