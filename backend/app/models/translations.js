var sql = require('sql');

var Translation = sql.define({
    name: 'Translations',
    schema: 'proto_amida',
    columns: ['essenceId', 'entityId', 'field', 'langId', 'value']
});

module.exports = Translation;
