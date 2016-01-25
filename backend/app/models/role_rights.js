var sql = require('sql');

var columns = ['roleID', 'rightID'];

var RolesRights = sql.define({
    name: 'RolesRights',
    columns: columns
});

RolesRights.whereCol = columns;

module.exports = RolesRights;
