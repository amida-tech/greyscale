var sql = require('sql');

var columns = [
    'id',
    'indexId',
    'subindexId',
    'weight'
];

var IndexSubindexWeight = sql.define({
    name: 'IndexSubindexWeights',
    columns: columns
});

module.exports = IndexSubindexWeight;
