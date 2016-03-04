var sql = require('sql');

var columns = ['essenceId', 'entityId', 'field', 'langId', 'value'];

var Translation = sql.define({
    name: 'Translations',
    schema: 'proto_amida',
    columns: columns
});

Translation.whereCol = columns;

module.exports = Translation;
