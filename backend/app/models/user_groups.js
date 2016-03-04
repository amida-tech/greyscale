var sql = require('sql');

var columns = ['userId', 'groupId'];

var UserGroup = sql.define({
    name: 'UserGroups',
    columns: columns
});

UserGroup.whereCol = columns;

module.exports = UserGroup;
