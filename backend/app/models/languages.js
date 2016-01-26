var sql = require('sql');

var Language = sql.define({
    name: 'Languages',
    columns: ['id', 'name', 'nativeName', 'code']
});

module.exports = Language;
