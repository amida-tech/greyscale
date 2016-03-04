var sql = require('sql');

var UserUOA = sql.define({
    name: 'UserUOA',
    schema: 'proto_amida',
    columns: ['UserId', 'UOAid']
});

module.exports = UserUOA;
