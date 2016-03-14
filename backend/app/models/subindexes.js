var sql = require('sql');

var columns = [
    'id',
    'productId',
    'title',
    'description',
    'divisor'
];

var Subindex = sql.define({
    name: 'Subindexes',
    columns: columns
});

module.exports = Subindex;
