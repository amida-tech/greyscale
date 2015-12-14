var sql = require('sql');

var Translation = sql.define({
  name: 'Translations',
  columns: ['essenceId', 'entityId', 'field', 'langId', 'value']
});

module.exports = Translation;