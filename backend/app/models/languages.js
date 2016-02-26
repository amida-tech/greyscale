var sql = require('sql');

var Language = sql.define({
    name: 'Languages',
    schema: 'proto_amida',
    columns: ['id', 'name', 'nativeName', 'code']
});

module.exports = Language;
