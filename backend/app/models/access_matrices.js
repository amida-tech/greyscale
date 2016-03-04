var sql = require('sql');

var AccessMatrix = sql.define({
    name: 'AccessMatrices',
    schema: 'proto_amida',
    columns: ['id', 'name', 'description', 'default_value']
});

module.exports = AccessMatrix;
