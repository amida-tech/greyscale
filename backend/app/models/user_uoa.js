var sql = require('sql');

var UserUOA = sql.define({
    name: 'UserUOA',
    columns: ['UserId', 'UOAid']
});

module.exports = UserUOA;