var sql = require('sql');

var AccessPermission = sql.define({
  name: 'AccessPermissions',
  columns: ['id', 'matrixId', 'roleId', 'rightId', 'permission']
});

module.exports = AccessPermission;