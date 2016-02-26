var sql = require('sql');

var columns = ['id', 'name', 'isSystem'];

var Role = sql.define({
    name: 'Roles',
    schema: 'proto_amida',
    columns: columns
});

Role.whereCol = columns;

module.exports = Role;
