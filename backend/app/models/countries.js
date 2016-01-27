var sql = require('sql');

var Country = sql.define({
    name: 'Countries',
    schema: 'proto_amida',
    columns: [
        'id',
        'name',
        'alpha2',
        'alpha3',
        'nbr'
    ]
});

module.exports = Country;
