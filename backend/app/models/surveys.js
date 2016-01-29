var sql = require('sql');

var Survey = sql.define({
    name: 'Surveys',
    schema: 'proto_amida',
    columns: [
        'id',
        'title',
        'description',
        'productId'
    ]
});

module.exports = Survey;
