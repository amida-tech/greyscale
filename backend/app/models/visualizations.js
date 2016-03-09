var sql = require('sql');

var columns = [
    'id',
    'title',
    'productId',
    'topicIds',
    'indexCollection',
    'indexId',
    'visualizationType',
    'comparativeTopicId'
];

var Visualization = sql.define({
    name: 'Visualizations',
    columns: columns
});

module.exports = Visualization;
