var sql = require('sql');

var Survey = sql.define({
    name: 'Surveys',
    schema: 'proto_amida',
    columns: ['id', 'data']
});

module.exports = Survey;
