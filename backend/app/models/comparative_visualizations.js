var sql = require('sql');

var columns = [
    'id',
    'title',
    'organizationId'
];

var ComparativeVisualization = sql.define({
    name: 'ComparativeVisualizations',
    columns: columns
});

module.exports = ComparativeVisualization;
