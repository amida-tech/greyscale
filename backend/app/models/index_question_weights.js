var sql = require('sql');

var columns = [
    'id',
    'indexId',
    'questionId',
    'weight',
    'type'
];

var IndexQuestionWeight = sql.define({
    name: 'IndexQuestionWeights',
    columns: columns
});

module.exports = IndexQuestionWeight;
