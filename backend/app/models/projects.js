var sql = require('sql');

var columns = [
    'id',
    'organizationId',
    'codeName',
    'description',
    'created',
    'matrixId',
    'startTime',
    'status',
    'closeTime'
];

var Project = sql.define({
    name: 'Projects',
    schema: 'proto_amida',
    columns: columns
});

Project.statuses = [
    0, //active
    1 //inactive
];

Project.whereCol = columns;

module.exports = Project;
