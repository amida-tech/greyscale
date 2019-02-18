var sql = require('sql');

var AccessPermission = sql.define({
    name: 'AccessPermissions',
    columns: ['id', 'roleId', 'rightId', 'permission']
});

module.exports = AccessPermission;
