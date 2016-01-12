var sql = require('sql');

var Survey = sql.define({
    name: 'Surveys',
    columns: ['id', 'data']
});

module.exports = Survey;
