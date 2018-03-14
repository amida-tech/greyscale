var sql = require('sql');

var ProjectUser = sql.define({
    name: 'ProjectUsers',
    columns: ['projectId', 'userId']
});

module.exports = ProjectUser;
