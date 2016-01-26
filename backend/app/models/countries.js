var sql = require('sql');

var Country = sql.define({
    name: 'Countries',
    columns: [
        'id',
        'name',
        'alpha2',
        'alpha3',
        'nbr'
    ]
});

module.exports = Country;
