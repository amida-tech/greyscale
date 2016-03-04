var sql = require('sql');

var AccessPermission = sql.define({
    name: 'AccessPermissions',
    schema: 'proto_amida',
    columns: ['id', 'matrixId', 'roleId', 'rightId', 'permission']
});

module.exports = AccessPermission;
