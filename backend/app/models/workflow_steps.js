var sql = require('sql');

var columns = [
    'id',
    'workflowId',
    'startDate',
    'endDate',
    'roleId',
    'blindReview',
    'provideResponses',
    'seeOthersResponses',
    'discussionParticipation',
    'editTranslate',
    'writeToAnswers',
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
    'writeToAnswers',
    'position',
    'title',
    'blindReview',
    'provideResponses',
    'seeOthersResponses',
    'discussionParticipation',
    'editTranslate'
];

module.exports = WorkflowStep;
