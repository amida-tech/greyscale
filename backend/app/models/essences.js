var sql = require('sql');

var Essence = sql.define({
  name: 'Essences',
  columns: ['id', 'tableName', 'name', 'fileName']
});

module.exports = Essence;