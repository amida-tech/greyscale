var sql = require('sql');

var UnitOfAnalysisClassType = sql.define({
    name: 'UnitOfAnalysisClassType',
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

UnitOfAnalysisClassType.translate = translate;

module.exports = UnitOfAnalysisClassType;
