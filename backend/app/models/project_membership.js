var sql = require('sql');

var columns = [
    'id',
    'organizationId',
    'codeName',
    'description',
    'created',
    'startTime',
];

var ProjectMembership = sql.define({
    name: 'ProjectMembership',
    columns: columns
});

module.exports = ProjectMembership;
