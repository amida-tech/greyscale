var sql = require('sql');

var columns = [
    'id',
    'workflowId',
    'startDate',
    'endDate',
    'blindReview',
    'provideResponses',
    'seeOthersResponses',
    'discussionParticipation',
    'allowTranslate',
    'writeToAnswers',
    'position',
    'title',
    'allowEdit',
    'role',
    'isDeleted',
];

var WorkflowStep = sql.define({
    name: 'WorkflowSteps',
    columns: columns
});

WorkflowStep.editCols = [
    'startDate',
    'endDate',
    'writeToAnswers',
    'position',
    'title',
    'blindReview',
    'provideResponses',
    'seeOthersResponses',
    'discussionParticipation',
    'allowTranslate',
    'allowEdit',
    'role',
    'isDeleted',
];

WorkflowStep.translate = [
    'title',
    'role'
];

module.exports = WorkflowStep;
