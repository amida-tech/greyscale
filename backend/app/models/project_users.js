var sql = require('sql');

var ProjectUser = sql.define({
    name: 'ProjectUser',
    columns: ['projectId', 'userId']
});

module.exports = ProjectUser;
