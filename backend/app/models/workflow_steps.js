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
    'allowTranslate',
    'writeToAnswers',
    'position',
    'title',
    'allowEdit'
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
    'allowTranslate',
    'allowEdit'
];

module.exports = WorkflowStep;
