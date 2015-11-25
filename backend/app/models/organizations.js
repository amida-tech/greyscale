var sql = require('sql');

var Organization = sql.define({
    name: 'Organizations',
    columns: [
        'id', 
        'name', 
        'address', 
        'adminUserId', 
        'url', 
        'enforceApiSecurity',
        'isActive'
    ]
});

module.exports = Organization;