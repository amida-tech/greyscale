var sql = require('sql');

var UnitOfAnalysisClassType = sql.define({
    name: 'UnitOfAnalysisClassType',
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

UnitOfAnalysisClassType.translate = translate;

module.exports = UnitOfAnalysisClassType;
