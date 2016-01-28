var sql = require('sql');

var Survey = sql.define({
    name: 'Surveys',
    columns: [
        'id',
        'title',
        'description',
        'productId'
    ]
});

module.exports = Survey;
