var sql = require('sql');

var Token = sql.define({
  name: 'Token',
  columns: ['userID', 'body', 'issuedAt']
});

module.exports = Token;


