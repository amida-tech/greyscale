var sql = require('sql');

var Token = sql.define({
    name: 'Token',
    schema: 'proto_amida',
    columns: ['userID', 'body', 'issuedAt']
});

module.exports = Token;
