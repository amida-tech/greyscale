var sql = require('sql');

var Organization = sql.define({
    name: 'Organizations',
    columns: [
        'id', 
        'name', 
        'address', 
        'adminUserId', 
        'url', 
        'enforceApiSecurity'
    ]
});

module.exports = Organization;