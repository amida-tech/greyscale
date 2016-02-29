var sql = require('sql');

var columns = [
    'id',
    'indexId',
    'questionId',
    'weight'
];

var IndexQuestionWeight = sql.define({
    name: 'IndexQuestionWeights',
    columns: columns
});

module.exports = IndexQuestionWeight;
