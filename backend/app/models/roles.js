var sql = require('sql');

var Role = sql.define({
  name: 'Roles',
  columns: ['id', 'name', 'isSystem']
});

module.exports = Role;