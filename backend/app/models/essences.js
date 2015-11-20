var sql = require('sql');

var Essence = sql.define({
  name: 'Essences',
  columns: ['id', 'label', 'name']
});

module.exports = Essence;