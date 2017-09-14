var sql = require('sql');

var ProjectUsers = sql.define({
    name: 'ProjectUsers',
    columns: ['projectId', 'userId']
});

module.exports = ProjectUsers;
