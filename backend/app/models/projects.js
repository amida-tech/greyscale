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
    'closeTime',
    'firstActivated',
    'lastUpdated'
];

var Project = sql.define({
    name: 'Projects',
    columns: columns
});

Project.statuses = [
    0, //inactive
    1 //active
];

Project.whereCol = columns;

Project.translate = [
    'codeName',
    'description'
];

module.exports = Project;
