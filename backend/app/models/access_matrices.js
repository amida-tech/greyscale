var sql = require('sql');

var AccessMatrix = sql.define({
    name: 'AccessMatrices',
    columns: ['id', 'name', 'description', 'default_value']
});

module.exports = AccessMatrix;
