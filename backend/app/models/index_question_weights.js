var sql = require('sql');

var columns = [
    'id',
    'indexId',
    'questionId',
    'weight',
    'type',
    'aggregateType'
];

var IndexQuestionWeight = sql.define({
    name: 'IndexQuestionWeights',
    columns: columns
});

module.exports = IndexQuestionWeight;
