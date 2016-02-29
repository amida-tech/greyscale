var sql = require('sql');

var columns = [
    'id',
    'subindexId',
    'questionId',
    'weight'
];

var SubindexWeight = sql.define({
    name: 'SubindexWeights',
    columns: columns
});

module.exports = SubindexWeight;
