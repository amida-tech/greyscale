var sql = require('sql');

var UnitOfAnalysis = sql.define({
    name: 'UnitOfAnalysis',
    schema: 'proto_amida',
    columns: [
        'id',
        'gadmId0',
        'gadmId1',
        'gadmId2',
        'gadmId3',
        'gadmObjectId',
        'ISO',
        'ISO2',
        'nameISO',
        'name',
        'description',
        'shortName',
        'HASC',
        'unitOfAnalysisType',
        'parentId',
        'creatorId',
        'ownerId',
        'visibility',
        'status',
        'createTime',
        'deleteTime',
        'langId'
    ]
});
var translate = [
    'name',
    'description',
    'shortName'
];

UnitOfAnalysis.translate = translate;

module.exports = UnitOfAnalysis;
