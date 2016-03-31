var sql = require('sql');

var DataApiKey = sql.define({
    name: 'DataApiKeys',
    columns: [
        'id',
        'key',
        'organizationId'
    ]
});

module.exports = DataApiKey;
