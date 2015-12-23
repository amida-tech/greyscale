var sql = require('sql');

var UnitOfAnalysisTag = sql.define({
    name: 'UnitOfAnalysisTag',
    columns: [
        'id',
        'classTypeId',
        'name',
        'description',
        'langId'
    ]
});
var translate = [
    'name',
    'description'
];

UnitOfAnalysisTag.translate = translate;

module.exports = UnitOfAnalysisTag;
