var sql = require('sql');

var columns = [
    'id',
    'organizationId',
    'codeName',
    'description',
    // 'ownerUserId',
    'created',
    'matrixId',
    //'viewMatrixId',
    'startTime',
    //'studyPeriodId',
    'status',
    //'logoPath',
    //'msgboardId',
    //'adminUserId',
    //'sponsorLogos',
    //'isActive',
    'closeTime',
    // 'visibility',
    // 'importId',
    // 'reportUrl',
    // 'analyticsUrl'
];

var Project = sql.define({
    name: 'Projects',
    columns: columns
});

Project.statuses = [
    0, //active
    1 //inactive
]

Project.whereCol = columns;

module.exports = Project;
