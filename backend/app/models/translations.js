var sql = require('sql');

var columns = ['essenceId', 'entityId', 'field', 'langId', 'value'];

var Translation = sql.define({
    name: 'Translations',
    columns: columns
});

Translation.whereCol = columns;

module.exports = Translation;
