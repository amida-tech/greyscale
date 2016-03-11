var sql = require('sql');

var columns = [
    'id',
    'subindexId',
    'questionId',
    'weight',
    'type'
];

var SubindexWeight = sql.define({
    name: 'SubindexWeights',
    columns: columns
});

module.exports = SubindexWeight;
