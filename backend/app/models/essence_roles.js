var sql = require('sql');

var EssenceRole = sql.define({
  name: 'EssenceRoles',
  columns: ['id', 'roleId', 'userId', 'essenceId', 'entityId']
});

module.exports = EssenceRole;