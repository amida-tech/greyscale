var sql = require('sql');

var UnitOfAnalysisTagLink = sql.define({
    name: 'UnitOfAnalysisTagLink',
    schema: 'proto_amida',
    columns: [
        'id',
        'uoaId',
        'uoaTagId'
    ]
});

module.exports = UnitOfAnalysisTagLink;
