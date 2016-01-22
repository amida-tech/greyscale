var sql = require('sql');

var columns =  [
    'id',
    'workflowId',
    'stepId',
    'startDate',
    'endDate',
    'roleId'
];

var WorkflowStep = sql.define({
    name: 'WorkflowSteps',
    columns: columns
});

module.exports = WorkflowStep;