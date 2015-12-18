var sql = require('sql');

var UnitOfAnalysisType = sql.define({
    name: 'UnitOfAnalysisType',
    columns: [
        'id',
        'name',
        'description',
        'langId'
    ]
});
var translate = [
    'name',
    'description'
];

UnitOfAnalysisType.translate = translate;

module.exports = UnitOfAnalysisType;
