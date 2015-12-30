var sql = require('sql');

var UnitOfAnalysisTagLink = sql.define({
    name: 'UnitOfAnalysisTagLink',
    columns: [
        'id',
        'uoaId',
        'uoaTagId'
    ]
});

module.exports = UnitOfAnalysisTagLink;
