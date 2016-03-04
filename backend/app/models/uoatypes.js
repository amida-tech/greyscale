var sql = require('sql');

var UnitOfAnalysisType = sql.define({
    name: 'UnitOfAnalysisType',
    schema: 'proto_amida',
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
