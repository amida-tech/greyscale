var sql = require('sql');

var columns =  [
    'workflowId',
    'stepId'
];

var WorkflowStep = sql.define({
    name: 'WorkflowSteps',
    columns: columns
});

module.exports = WorkflowStep;