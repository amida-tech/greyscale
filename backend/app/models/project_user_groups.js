var sql = require('sql');

var ProjectUserGroup = sql.define({
    name: 'ProjectUserGroups',
    columns: ['projectId', 'groupId']
});

module.exports = ProjectUserGroup;
