var sql = require('sql');

var columns = ['roleID', 'rightID'];

var RolesRights = sql.define({
    name: 'RolesRights',
    schema: 'proto_amida',
    columns: columns
});

RolesRights.whereCol = columns;

module.exports = RolesRights;
