var sql = require('sql');

var columns = [
    'id',
    'title',
    'cols',
    'uoaCol',
    'uoaType',
    'yearCol',
    'dataCol',
    'data',
    'visualizationId'
];

var ImportedDataset = sql.define({
    name: 'ImportedDatasets',
    columns: columns
});

module.exports = ImportedDataset;
