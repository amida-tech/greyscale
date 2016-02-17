var sql = require('sql');

var columns = [
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
    'created',
    'updated',
    'deleted',
    'langId'
];

var UnitOfAnalysis = sql.define({
    name: 'UnitOfAnalysis',
    columns: columns
});
var translate = [
    'name',
    'description',
    'shortName'
];

UnitOfAnalysis.translate = translate;
UnitOfAnalysis.whereCol = columns;

module.exports = UnitOfAnalysis;
