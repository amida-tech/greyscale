var sql = require('sql');

var columns = [
    'id',
    'action',
    'description',
    'essenceId'
];

var Right = sql.define({
    name: 'Rights',
    columns: columns
});

Right.whereCol = columns;

module.exports = Right;
