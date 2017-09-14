var sql = require('sql');

var ProjectUserGroup = sql.define({
    name: 'ProjectUserGroup',
    columns: ['projectId', 'groupId']
});

module.exports = ProjectUserGroup;
