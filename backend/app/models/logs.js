var sql = require('sql');

var Log = sql.define({
    name: 'Logs',
    columns: [
        'id',
        'created',
        'user',
        'action',
        'essence',
        'entity',
        'entities',
        'quantity',
        'info',
        'error'
    ]
});
Log.insertCols = [
    'id',
    'created',
    'user',
    'action',
    'essence',
    'entity',
    'entities',
    'quantity',
    'info',
    'error'
];

module.exports = Log;
