var sql = require('sql');

var ProjectUser = sql.define({
    name: 'ProjectUser',
    columns: ['ProjectId', 'UserId']
});

module.exports = ProjectUser;
