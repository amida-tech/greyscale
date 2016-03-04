var sql = require('sql');

var columns = [
    'id',
    'action',
    'description',
    'essenceId'
];

var Right = sql.define({
    name: 'Rights',
    schema: 'proto_amida',
    columns: columns
});

Right.whereCol = columns;

module.exports = Right;
