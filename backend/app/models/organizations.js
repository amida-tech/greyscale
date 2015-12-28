var sql = require('sql');

var columns = [
    'id',
    'name',
    'address',
    'adminUserId',
    'url',
    'enforceApiSecurity',
    'isActive'
];

var Organization = sql.define({
    name: 'Organizations',
    columns: columns
});

Organization.whereCol = columns;

module.exports = Organization;