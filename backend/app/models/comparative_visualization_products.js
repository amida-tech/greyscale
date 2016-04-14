var sql = require('sql');

var columns = [
    'visualizationId',
    'productId',
    'indexId'
];

var ComparativeVisualizationProduct = sql.define({
    name: 'ComparativeVisualizationProducts',
    columns: columns
});

module.exports = ComparativeVisualizationProduct;
