var sql = require('sql');

var columns = [
    'id',
    'classTypeId',
    'name',
    'description',
    'langId'
];

var UnitOfAnalysisTag = sql.define({
    name: 'UnitOfAnalysisTag',
    schema: 'proto_amida',
    columns: columns
});
var translate = [
    'name',
    'description'
];

UnitOfAnalysisTag.translate = translate;

UnitOfAnalysisTag.whereCol = columns;

module.exports = UnitOfAnalysisTag;
