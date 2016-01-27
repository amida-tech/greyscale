var sql = require('sql');

var columns = [
    'id',
    'organizationId',
    'codeName',
    'description',
    'created',
    'matrixId',
    'startTime',
];

var ProjectMembership = sql.define({
    name: 'ProjectMembership',
    schema: 'proto_amida',
    columns: columns
});

module.exports = ProjectMembership;
