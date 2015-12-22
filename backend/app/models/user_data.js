var sql = require('sql');

var UserData = sql.define({
  name: 'UserData',
  columns: ['id', 'data']
});

module.exports = UserData;