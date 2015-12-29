var sql = require('sql');

var columns = ['id', 'roleId', 'userId', 'essenceId', 'entityId'];

var EssenceRole = sql.define({
  name: 'EssenceRoles',
  columns: columns
});

EssenceRole.whereCol = columns;

module.exports = EssenceRole;