var sql = require('sql');

var columns = [
    'id',
    'workflowId',
    'startDate',
    'endDate',
    'roleId',
    'taskAccessToResponses',
    'taskAccessToDiscussions',
    'taskBlindReview',
    'workflowAccessToResponses',
    'workflowAccessToDiscussions',
    'workflowBlindReview',
    'position',
    'title'
];

var WorkflowStep = sql.define({
    name: 'WorkflowSteps',
    columns: columns
});

WorkflowStep.editCols = [
    'startDate',
    'endDate',
    'roleId',
    'taskAccessToResponses',
    'taskAccessToDiscussions',
    'taskBlindReview',
    'workflowAccessToResponses',
    'workflowAccessToDiscussions',
    'workflowBlindReview',
    'position',
    'title'
];

module.exports = WorkflowStep;
