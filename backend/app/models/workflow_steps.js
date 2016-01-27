var sql = require('sql');

var columns = [
    'id',
    'workflowId',
    'stepId',
    'startDate',
    'endDate',
    'roleId'
];

var WorkflowStep = sql.define({
    name: 'WorkflowSteps',
    schema: 'proto_amida',
    columns: columns
});

module.exports = WorkflowStep;
